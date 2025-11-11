const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { validationResult, body } = require('express-validator');
const { StreamChat } = require('stream-chat');

const prisma = new PrismaClient();

// Initialize Stream Chat client (server-side)
let serverClient = null;
if (process.env.STREAM_API_KEY && process.env.STREAM_API_SECRET) {
  serverClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY,
    process.env.STREAM_API_SECRET
  );
}

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản mới
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
      });
    }

    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (status = PENDING, chờ admin approve)
    // NOTE: Không lưu faceImage ở đây - user sẽ đăng ký face sau khi login
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        status: 'PENDING' // Mặc định chờ approve
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        status: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Vui lòng chờ admin phê duyệt tài khoản.',
      data: user
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng ký tài khoản',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        faceImage: true,
        faceRegistered: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check user status
    if (user.status === 'PENDING') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đang chờ admin phê duyệt'
      });
    }

    if (user.status === 'DEACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa'
      });
    }

    if (user.status === 'APPROVED') {
      // Auto activate on first login
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' }
      });
      user.status = 'ACTIVE';
    }

    // Generate token
    const token = generateToken(user.id);

    // Create/Update user in Stream Chat
    let streamToken = null;
    if (serverClient) {
      try {
        // Upsert user in Stream Chat
        await serverClient.upsertUser({
          id: user.id,
          name: user.name,
          image: user.avatar || undefined,
        });

        // Generate Stream Chat token for client
        streamToken = serverClient.createToken(user.id);
      } catch (streamError) {
        console.error('Stream Chat error:', streamError);
        // Continue even if Stream Chat fails
      }
    }

    // Remove password from response
    delete user.password;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user,
        token,
        streamToken // Add Stream Chat token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đăng nhập',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        faceImage: true,
        faceRegistered: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin user',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Generate new token
    const newToken = generateToken(decoded.userId);

    res.json({
      success: true,
      data: { token: newToken }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client-side should remove token)
 * @access  Private
 */
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

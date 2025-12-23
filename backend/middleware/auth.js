const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware xác thực JWT token
 */
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User không tồn tại'
      });
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hóa'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn'
      });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xác thực'
    });
  }
};

/**
 * Middleware kiểm tra role admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập'
    });
  }
  next();
};

/**
 * Middleware kiểm tra role teacher
 */
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'TEACHER') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ giáo viên mới có quyền truy cập'
    });
  }
  next();
};

/**
 * Middleware kiểm tra role teacher hoặc admin
 */
const requireTeacherOrAdmin = (req, res, next) => {
  if (req.user.role !== 'TEACHER' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập'
    });
  }
  next();
};

/**
 * Middleware kiểm tra teacher có quyền quản lý subject không
 * Phải được dùng sau auth middleware
 */
const requireSubjectTeacher = async (req, res, next) => {
  try {
    // Admin có toàn quyền
    if (req.user.role === 'ADMIN') {
      return next();
    }

    // Teacher chỉ được quản lý môn học của mình
    if (req.user.role === 'TEACHER') {
      const subjectId = req.params.subjectId || req.body.subjectId;
      
      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy subjectId'
        });
      }

      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        select: { teacherId: true }
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy môn học'
        });
      }

      if (subject.teacherId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phụ trách môn học này'
        });
      }

      return next();
    }

    // User thường không có quyền
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập'
    });
  } catch (error) {
    console.error('requireSubjectTeacher error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền'
    });
  }
};

/**
 * Optional auth - không bắt buộc đăng nhập nhưng nếu có token thì attach user
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true
      }
    });

    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

module.exports = {
  auth,
  requireAdmin,
  requireTeacher,
  requireTeacherOrAdmin,
  requireSubjectTeacher,
  optionalAuth
};

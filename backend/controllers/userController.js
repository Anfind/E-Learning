const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * @route   GET /api/users
 * @desc    List all users (Admin only)
 * @access  Private/Admin
 */
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, role, search } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (role) {
      where.role = role;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    
    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          faceRegistered: true,
          createdAt: true,
          approvedAt: true,
          approvedBy: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
    
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách users',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/users/pending
 * @desc    Get users pending approval
 * @access  Private/Admin
 */
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: {
        status: 'PENDING'
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        faceImage: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json({
      success: true,
      data: {
        count: pendingUsers.length,
        users: pendingUsers
      }
    });
    
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách users chờ duyệt',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user detail
 * @access  Private/Admin or Own profile
 */
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check permission: Admin or own profile
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thông tin này'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id },
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
        updatedAt: true,
        approvedAt: true,
        approvedBy: true,
        // Include enrollment count
        _count: {
          select: {
            enrollments: true,
            examAttempts: true,
            blogPosts: true,
            questions: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin user',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/users/:id/approve
 * @desc    Approve pending user
 * @access  Private/Admin
 */
exports.approveUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists and is pending
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, status: true, name: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }
    
    if (user.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'User không ở trạng thái chờ duyệt'
      });
    }
    
    // Update to APPROVED
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: req.user.id
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        approvedAt: true
      }
    });
    
    res.json({
      success: true,
      message: `Đã phê duyệt tài khoản ${user.name}`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phê duyệt user',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user status (ACTIVE/DEACTIVE)
 * @access  Private/Admin
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!['ACTIVE', 'DEACTIVE'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status không hợp lệ. Chỉ chấp nhận ACTIVE hoặc DEACTIVE'
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, status: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }
    
    // Prevent deactivating admin
    if (user.role === 'ADMIN' && status === 'DEACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Không thể vô hiệu hóa tài khoản Admin'
      });
    }
    
    // Prevent self-deactivation
    if (req.user.id === id && status === 'DEACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể vô hiệu hóa tài khoản của chính mình'
      });
    }
    
    // Update status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        status: true
      }
    });
    
    res.json({
      success: true,
      message: `Đã ${status === 'ACTIVE' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản ${user.name}`,
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái user',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/users/:id
 * @desc    Update user profile
 * @access  Private (Own profile or Admin)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    
    // Check permission
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật thông tin này'
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }
    
    // Update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        status: true
      }
    });
    
    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: updatedUser
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user (Admin only)
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User không tồn tại'
      });
    }
    
    // Prevent deleting admin
    if (user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa tài khoản Admin'
      });
    }
    
    // Prevent self-deletion
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể xóa tài khoản của chính mình'
      });
    }
    
    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: `Đã xóa tài khoản ${user.name}`
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa user',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/users/suggestions
 * @desc    Get friend suggestions (users in same majors)
 * @access  Private
 */
exports.getUserSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    // Get user's enrollments
    const myEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { majorId: true }
    });

    if (myEnrollments.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const myMajorIds = myEnrollments.map(e => e.majorId);

    // Get users enrolled in the same majors
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: userId },
        enrollments: {
          some: {
            majorId: { in: myMajorIds }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        enrollments: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true,
            major: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get user suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy gợi ý kết bạn',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/users/registered-faces
 * @desc    Get all users with registered faces (for face testing)
 * @access  Private (Any authenticated user)
 */
exports.getUsersWithFaces = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        faceRegistered: true,
        status: {
          in: ['APPROVED', 'ACTIVE'] // ✅ Accept both APPROVED and ACTIVE users
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        faceRegistered: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users with faces error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách users',
      error: error.message
    });
  }
};


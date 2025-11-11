const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * @route   GET /api/majors
 * @desc    List all majors (Public)
 * @access  Public
 */
exports.listMajors = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    const majors = await prisma.major.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        order: true,
        isActive: true,
        _count: {
          select: {
            subjects: true,
            enrollments: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    res.json({
      success: true,
      data: majors
    });
    
  } catch (error) {
    console.error('List majors error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ngành học',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/majors/:id
 * @desc    Get major detail with subjects
 * @access  Public
 */
exports.getMajorDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const major = await prisma.major.findUnique({
      where: { id },
      include: {
        subjects: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            order: true,
            prerequisiteId: true,
            prerequisite: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                lessons: true,
                exams: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });
    
    if (!major) {
      return res.status(404).json({
        success: false,
        message: 'Ngành học không tồn tại'
      });
    }
    
    // Add progress data to each subject if user is logged in
    if (userId) {
      for (const subject of major.subjects) {
        // Get all lessons for this subject
        const lessons = await prisma.lesson.findMany({
          where: {
            subjectId: subject.id,
            isActive: true
          },
          select: {
            id: true
          }
        });
        
        const lessonIds = lessons.map(l => l.id);
        
        // Get completed lessons count
        const completedLessons = await prisma.lessonProgress.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            completed: true
          }
        });
        
        // Check if prerequisite subject is completed
        let isLocked = false;
        let lockedReason = '';
        
        if (subject.prerequisiteId) {
          const prereqLessons = await prisma.lesson.findMany({
            where: {
              subjectId: subject.prerequisiteId,
              isActive: true
            },
            select: { id: true }
          });
          
          const prereqLessonIds = prereqLessons.map(l => l.id);
          const completedPrereqLessons = await prisma.lessonProgress.count({
            where: {
              userId,
              lessonId: { in: prereqLessonIds },
              completed: true
            }
          });
          
          if (completedPrereqLessons < prereqLessons.length) {
            isLocked = true;
            lockedReason = `Cần hoàn thành môn ${subject.prerequisite.name} trước`;
          }
        }
        
        subject.userProgress = {
          completedLessons,
          totalLessons: lessons.length,
          isLocked,
          lockedReason
        };
      }
    }
    
    res.json({
      success: true,
      data: major
    });
    
  } catch (error) {
    console.error('Get major detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin ngành học',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/majors
 * @desc    Create new major
 * @access  Private/Admin
 */
exports.createMajor = async (req, res) => {
  try {
    const { name, description, order } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tên ngành học là bắt buộc'
      });
    }
    
    // Check duplicate name
    const existingMajor = await prisma.major.findFirst({
      where: { name }
    });
    
    if (existingMajor) {
      return res.status(400).json({
        success: false,
        message: 'Tên ngành học đã tồn tại'
      });
    }
    
    // Handle image upload
    const imageUrl = req.file ? `/uploads/courses/${req.file.filename}` : null;
    
    // Create major
    const major = await prisma.major.create({
      data: {
        name,
        description,
        imageUrl,
        order: order ? parseInt(order) : 0,
        isActive: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo ngành học thành công',
      data: major
    });
    
  } catch (error) {
    console.error('Create major error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo ngành học',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/majors/:id
 * @desc    Update major
 * @access  Private/Admin
 */
exports.updateMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;
    
    // Check if major exists
    const major = await prisma.major.findUnique({
      where: { id }
    });
    
    if (!major) {
      return res.status(404).json({
        success: false,
        message: 'Ngành học không tồn tại'
      });
    }
    
    // Check duplicate name (exclude current)
    if (name && name !== major.name) {
      const duplicate = await prisma.major.findFirst({
        where: { 
          name,
          NOT: { id }
        }
      });
      
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Tên ngành học đã tồn tại'
        });
      }
    }
    
    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) {
      // Parse boolean from string if needed
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    if (req.file) {
      updateData.imageUrl = `/uploads/courses/${req.file.filename}`;
    }
    
    // Update major
    const updatedMajor = await prisma.major.update({
      where: { id },
      data: updateData
    });
    
    res.json({
      success: true,
      message: 'Cập nhật ngành học thành công',
      data: updatedMajor
    });
    
  } catch (error) {
    console.error('Update major error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật ngành học',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/majors/:id
 * @desc    Delete major
 * @access  Private/Admin
 */
exports.deleteMajor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if major exists
    const major = await prisma.major.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subjects: true,
            enrollments: true
          }
        }
      }
    });
    
    if (!major) {
      return res.status(404).json({
        success: false,
        message: 'Ngành học không tồn tại'
      });
    }
    
    // Check if major has subjects
    if (major._count.subjects > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa ngành học có ${major._count.subjects} môn học. Vui lòng xóa các môn học trước.`
      });
    }
    
    // Check if major has enrollments
    if (major._count.enrollments > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa ngành học có ${major._count.enrollments} học viên đã đăng ký.`
      });
    }
    
    // Delete major
    await prisma.major.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Xóa ngành học thành công'
    });
    
  } catch (error) {
    console.error('Delete major error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa ngành học',
      error: error.message
    });
  }
};

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * @route   GET /api/subjects
 * @desc    List subjects with filters
 * @access  Public
 */
exports.listSubjects = async (req, res) => {
  try {
    const { majorId, isActive } = req.query;
    
    const where = {};
    if (majorId) where.majorId = majorId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const subjects = await prisma.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        order: true,
        isActive: true,
        prerequisiteId: true,
        major: {
          select: {
            id: true,
            name: true
          }
        },
        prerequisite: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            lessons: true,
            exams: true,
            questions: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    res.json({
      success: true,
      data: subjects
    });
    
  } catch (error) {
    console.error('List subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách môn học',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/subjects/:id
 * @desc    Get subject detail with lessons and prerequisite tree
 * @access  Public
 */
exports.getSubjectDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        major: {
          select: {
            id: true,
            name: true
          }
        },
        prerequisite: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        dependentSubjects: {
          select: {
            id: true,
            name: true
          }
        },
        lessons: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            order: true,
            prerequisiteId: true
          },
          orderBy: { order: 'asc' }
        },
        exams: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            passingScore: true,
            isRequired: true,
            order: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Môn học không tồn tại'
      });
    }
    
    // Add progress data to each lesson if user is logged in
    if (userId) {
      const lessonIds = subject.lessons.map(l => l.id);
      const progressData = await prisma.lessonProgress.findMany({
        where: {
          userId,
          lessonId: { in: lessonIds }
        },
        select: {
          lessonId: true,
          completed: true,
          watchTime: true
        }
      });
      
      // Map progress to lessons
      subject.lessons = subject.lessons.map(lesson => {
        const progress = progressData.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          progress: progress ? {
            completed: progress.completed,
            watchTime: progress.watchTime,
            percentComplete: Math.round((progress.watchTime / (lesson.duration || 1)) * 100),
            isLocked: false // Will be calculated below
          } : null
        };
      });
      
      // Calculate locked status based on prerequisites
      for (const lesson of subject.lessons) {
        if (lesson.prerequisiteId) {
          const prereqLesson = subject.lessons.find(l => l.id === lesson.prerequisiteId);
          if (lesson.progress) {
            lesson.progress.isLocked = prereqLesson?.progress?.completed !== true;
          }
        }
      }
    }
    
    res.json({
      success: true,
      data: subject
    });
    
  } catch (error) {
    console.error('Get subject detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin môn học',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/subjects
 * @desc    Create new subject
 * @access  Private/Admin
 */
exports.createSubject = async (req, res) => {
  try {
    const { majorId, name, description, prerequisiteId, order } = req.body;
    
    // Validation
    if (!majorId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Ngành học và tên môn học là bắt buộc'
      });
    }
    
    // Check if major exists
    const major = await prisma.major.findUnique({
      where: { id: majorId }
    });
    
    if (!major) {
      return res.status(404).json({
        success: false,
        message: 'Ngành học không tồn tại'
      });
    }
    
    // Check prerequisite if provided
    if (prerequisiteId) {
      const prerequisite = await prisma.subject.findUnique({
        where: { id: prerequisiteId }
      });
      
      if (!prerequisite) {
        return res.status(404).json({
          success: false,
          message: 'Môn học tiên quyết không tồn tại'
        });
      }
      
      // Check if prerequisite is in same major
      if (prerequisite.majorId !== majorId) {
        return res.status(400).json({
          success: false,
          message: 'Môn học tiên quyết phải thuộc cùng ngành học'
        });
      }
      
      // Prevent circular prerequisite
      if (prerequisiteId === id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đặt môn học làm tiên quyết cho chính nó'
        });
      }
    }
    
    // Check duplicate name in same major
    const duplicate = await prisma.subject.findFirst({
      where: { majorId, name }
    });
    
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: 'Tên môn học đã tồn tại trong ngành này'
      });
    }
    
    // Handle image upload
    const imageUrl = req.file ? `/uploads/courses/${req.file.filename}` : null;
    
    // Create subject
    const subject = await prisma.subject.create({
      data: {
        majorId,
        name,
        description,
        imageUrl,
        prerequisiteId: prerequisiteId || null,
        order: order ? parseInt(order) : 0,
        isActive: true
      },
      include: {
        major: {
          select: { id: true, name: true }
        },
        prerequisite: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Tạo môn học thành công',
      data: subject
    });
    
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo môn học',
      error: error.message
    });
  }
};

/**
 * @route   PATCH /api/subjects/:id
 * @desc    Update subject
 * @access  Private/Admin
 */
exports.updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, majorId, prerequisiteId, order, isActive } = req.body;
    
    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id }
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Môn học không tồn tại'
      });
    }
    
    // Check prerequisite if provided
    if (prerequisiteId) {
      if (prerequisiteId === id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể đặt môn học làm tiên quyết cho chính nó'
        });
      }
      
      const prerequisite = await prisma.subject.findUnique({
        where: { id: prerequisiteId }
      });
      
      if (!prerequisite) {
        return res.status(404).json({
          success: false,
          message: 'Môn học tiên quyết không tồn tại'
        });
      }
      
      // Check if prerequisite is in the same major (use majorId if provided, otherwise use existing)
      const targetMajorId = majorId || subject.majorId;
      if (prerequisite.majorId !== targetMajorId) {
        return res.status(400).json({
          success: false,
          message: 'Môn học tiên quyết phải thuộc cùng ngành học'
        });
      }
      
      // Check for circular dependency
      const checkCircular = async (prereqId, targetId) => {
        if (prereqId === targetId) return true;
        
        const prereq = await prisma.subject.findUnique({
          where: { id: prereqId },
          select: { prerequisiteId: true }
        });
        
        if (!prereq || !prereq.prerequisiteId) return false;
        return checkCircular(prereq.prerequisiteId, targetId);
      };
      
      const hasCircular = await checkCircular(prerequisiteId, id);
      if (hasCircular) {
        return res.status(400).json({
          success: false,
          message: 'Không thể tạo vòng lặp tiên quyết'
        });
      }
    }
    
    // Check duplicate name (in the target major)
    if (name && name !== subject.name) {
      const targetMajorId = majorId || subject.majorId;
      const duplicate = await prisma.subject.findFirst({
        where: {
          majorId: targetMajorId,
          name,
          NOT: { id }
        }
      });
      
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: 'Tên môn học đã tồn tại trong ngành này'
        });
      }
    }
    
    // Build update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (majorId) updateData.majorId = majorId;
    if (prerequisiteId !== undefined) updateData.prerequisiteId = prerequisiteId || null;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) {
      // Parse boolean from string if needed
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    if (req.file) {
      updateData.imageUrl = `/uploads/courses/${req.file.filename}`;
    }
    
    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        major: {
          select: { id: true, name: true }
        },
        prerequisite: {
          select: { id: true, name: true }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Cập nhật môn học thành công',
      data: updatedSubject
    });
    
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật môn học',
      error: error.message
    });
  }
};

/**
 * @route   DELETE /api/subjects/:id
 * @desc    Delete subject
 * @access  Private/Admin
 */
exports.deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            lessons: true,
            exams: true,
            dependentSubjects: true
          }
        }
      }
    });
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Môn học không tồn tại'
      });
    }
    
    // Check if subject has dependent subjects
    if (subject._count.dependentSubjects > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa môn học đang là tiên quyết cho ${subject._count.dependentSubjects} môn học khác`
      });
    }
    
    // Check if subject has lessons
    if (subject._count.lessons > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa môn học có ${subject._count.lessons} bài học. Vui lòng xóa các bài học trước.`
      });
    }
    
    // Check if subject has exams
    if (subject._count.exams > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa môn học có ${subject._count.exams} bài thi. Vui lòng xóa các bài thi trước.`
      });
    }
    
    // Delete subject
    await prisma.subject.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Xóa môn học thành công'
    });
    
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa môn học',
      error: error.message
    });
  }
};

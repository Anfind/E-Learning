const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * List lessons with filters
 */
exports.listLessons = async (req, res) => {
  try {
    const { subjectId, isActive } = req.query;
    const userId = req.user?.id;
    
    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const lessons = await prisma.lesson.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        videoUrl: true,
        duration: true,
        order: true,
        isActive: true,
        prerequisiteId: true,
        subject: {
          select: { 
            id: true, 
            name: true,
            major: {
              select: { id: true, name: true }
            }
          }
        },
        prerequisite: {
          select: { id: true, name: true }
        },
        ...(userId && {
          progress: {
            where: { userId },
            select: { completed: true, watchTime: true }
          }
        })
      },
      orderBy: { order: 'asc' }
    });
    
    res.json({ success: true, data: lessons });
  } catch (error) {
    console.error('List lessons error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài học' });
  }
};

/**
 * Get lesson detail
 */
exports.getLessonDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true, majorId: true } },
        prerequisite: { select: { id: true, name: true } },
        dependentLessons: { select: { id: true, name: true } },
        ...(userId && {
          progress: { where: { userId } }
        })
      }
    });
    
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Bài học không tồn tại' });
    }
    
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('Get lesson detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin bài học' });
  }
};

/**
 * Create lesson
 */
exports.createLesson = async (req, res) => {
  try {
    const { subjectId, name, description, videoUrl, duration, prerequisiteId, order } = req.body;
    
    if (!subjectId || !name || !duration) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Check subject exists
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    }
    
    // Check prerequisite if provided
    if (prerequisiteId) {
      const prerequisite = await prisma.lesson.findUnique({ where: { id: prerequisiteId } });
      if (!prerequisite) {
        return res.status(404).json({ success: false, message: 'Bài học tiên quyết không tồn tại' });
      }
      if (prerequisite.subjectId !== subjectId) {
        return res.status(400).json({ success: false, message: 'Bài học tiên quyết phải thuộc cùng môn học' });
      }
    }
    
    const lesson = await prisma.lesson.create({
      data: {
        subjectId,
        name,
        description,
        videoUrl,
        duration: parseInt(duration),
        prerequisiteId: prerequisiteId || null,
        order: order ? parseInt(order) : 0,
        isActive: true
      },
      include: {
        subject: { select: { id: true, name: true } },
        prerequisite: { select: { id: true, name: true } }
      }
    });
    
    res.status(201).json({ success: true, message: 'Tạo bài học thành công', data: lesson });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bài học' });
  }
};

/**
 * Update lesson
 */
exports.updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, videoUrl, duration, prerequisiteId, order, isActive } = req.body;
    
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Bài học không tồn tại' });
    }
    
    // Check prerequisite
    if (prerequisiteId) {
      if (prerequisiteId === id) {
        return res.status(400).json({ success: false, message: 'Không thể đặt bài học làm tiên quyết cho chính nó' });
      }
      
      const prerequisite = await prisma.lesson.findUnique({ where: { id: prerequisiteId } });
      if (!prerequisite || prerequisite.subjectId !== lesson.subjectId) {
        return res.status(400).json({ success: false, message: 'Bài học tiên quyết không hợp lệ' });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (duration) updateData.duration = parseInt(duration);
    if (prerequisiteId !== undefined) updateData.prerequisiteId = prerequisiteId || null;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) {
      // Parse boolean from string if needed
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    
    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
      include: {
        subject: { select: { id: true, name: true } },
        prerequisite: { select: { id: true, name: true } }
      }
    });
    
    res.json({ success: true, message: 'Cập nhật bài học thành công', data: updatedLesson });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài học' });
  }
};

/**
 * Delete lesson
 */
exports.deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        _count: { select: { dependentLessons: true, progress: true } }
      }
    });
    
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Bài học không tồn tại' });
    }
    
    if (lesson._count.dependentLessons > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa bài học đang là tiên quyết cho ${lesson._count.dependentLessons} bài học khác`
      });
    }
    
    await prisma.lesson.delete({ where: { id } });
    
    res.json({ success: true, message: 'Xóa bài học thành công' });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bài học' });
  }
};

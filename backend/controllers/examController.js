const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Helper: Kiểm tra teacher có quyền quản lý subject không
 */
const checkTeacherPermission = async (userId, role, subjectId) => {
  if (role === 'ADMIN') return { allowed: true };
  
  if (role === 'TEACHER') {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { teacherId: true, name: true }
    });
    
    if (!subject) {
      return { allowed: false, error: 'Môn học không tồn tại', status: 404 };
    }
    
    if (subject.teacherId !== userId) {
      return { allowed: false, error: 'Bạn không phụ trách môn học này', status: 403 };
    }
    
    return { allowed: true };
  }
  
  return { allowed: false, error: 'Bạn không có quyền truy cập', status: 403 };
};

/**
 * Helper: Lấy subjectId từ examId
 */
const getSubjectIdFromExam = async (examId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { subjectId: true }
  });
  return exam?.subjectId;
};

// List exams
exports.listExams = async (req, res) => {
  try {
    const { subjectId, isActive } = req.query;
    
    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const exams = await prisma.exam.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        passingScore: true,
        isRequired: true,
        order: true,
        isActive: true,
        subjectId: true,
        subject: { 
          select: { 
            id: true, 
            name: true,
            majorId: true,
            major: {
              select: { id: true, name: true }
            }
          } 
        },
        _count: { select: { questions: true, attempts: true } }
      },
      orderBy: { order: 'asc' }
    });
    
    res.json({ success: true, data: exams });
  } catch (error) {
    console.error('List exams error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài thi' });
  }
};

// Get exam detail
exports.getExamDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: { select: { id: true, name: true } },
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            points: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
        ...(userId && {
          attempts: {
            where: { userId },
            select: {
              id: true,
              score: true,
              passed: true,
              status: true,
              startedAt: true,
              submittedAt: true
            },
            orderBy: { startedAt: 'desc' }
          }
        })
      }
    });
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    res.json({ success: true, data: exam });
  } catch (error) {
    console.error('Get exam detail error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin bài thi' });
  }
};

// Create exam
exports.createExam = async (req, res) => {
  try {
    const { subjectId, name, description, duration, passingScore, isRequired, order } = req.body;
    
    if (!subjectId || !name || !duration) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }
    
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    }
    
    const exam = await prisma.exam.create({
      data: {
        subjectId,
        name,
        description,
        duration: parseInt(duration),
        passingScore: passingScore ? parseFloat(passingScore) : 60,
        isRequired: isRequired || false,
        order: order ? parseInt(order) : 0,
        isActive: true
      },
      include: {
        subject: { select: { id: true, name: true } }
      }
    });
    
    res.status(201).json({ success: true, message: 'Tạo bài thi thành công', data: exam });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bài thi' });
  }
};

// Add questions to exam (bulk)
exports.addQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body; // Array of questions
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách câu hỏi không hợp lệ' });
    }
    
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }
    
    const createdQuestions = await prisma.examQuestion.createMany({
      data: questions.map((q, index) => ({
        examId: id,
        question: q.question,
        type: q.type || 'MULTIPLE_CHOICE',
        options: q.options ? JSON.stringify(q.options) : null,
        correctAnswer: q.correctAnswer,
        points: q.points ? parseFloat(q.points) : 1,
        order: q.order !== undefined ? parseInt(q.order) : index + 1
      }))
    });
    
    res.status(201).json({
      success: true,
      message: `Đã thêm ${createdQuestions.count} câu hỏi`,
      data: { count: createdQuestions.count }
    });
  } catch (error) {
    console.error('Add questions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm câu hỏi' });
  }
};

// Update exam
exports.updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, duration, passingScore, isRequired, order, isActive } = req.body;
    
    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration) updateData.duration = parseInt(duration);
    if (passingScore) updateData.passingScore = parseFloat(passingScore);
    if (isRequired !== undefined) {
      // Parse boolean from string if needed
      updateData.isRequired = isRequired === 'true' || isRequired === true;
    }
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) {
      // Parse boolean from string if needed
      updateData.isActive = isActive === 'true' || isActive === true;
    }
    
    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: { subject: { select: { id: true, name: true } } }
    });
    
    res.json({ success: true, message: 'Cập nhật bài thi thành công', data: updatedExam });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bài thi' });
  }
};

// Delete exam
exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { _count: { select: { attempts: true } } }
    });
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }
    
    if (exam._count.attempts > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa bài thi đã có ${exam._count.attempts} lượt thi`
      });
    }
    
    await prisma.exam.delete({ where: { id } });
    
    res.json({ success: true, message: 'Xóa bài thi thành công' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa bài thi' });
  }
};

// @desc    Update a single question
// @route   PATCH /api/exams/:id/questions/:questionId
// @access  Private (Admin/Teacher)
exports.updateQuestion = async (req, res) => {
  try {
    const { id: examId, questionId } = req.params;
    const { question, type, options, correctAnswer, points } = req.body;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }

    // Verify question exists and belongs to exam
    const existingQuestion = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion || existingQuestion.examId !== examId) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }

    // Prepare update data
    const updateData = {};
    if (question !== undefined) updateData.question = question;
    if (type !== undefined) updateData.type = type;
    if (options !== undefined) {
      updateData.options = Array.isArray(options) ? JSON.stringify(options) : options;
    }
    if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
    if (points !== undefined) updateData.points = parseFloat(points);

    const updatedQuestion = await prisma.examQuestion.update({
      where: { id: questionId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Cập nhật câu hỏi thành công',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật câu hỏi' });
  }
};

// @desc    Delete a single question
// @route   DELETE /api/exams/:id/questions/:questionId
// @access  Private (Admin/Teacher)
exports.deleteQuestion = async (req, res) => {
  try {
    const { id: examId, questionId } = req.params;

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }

    // Verify question exists and belongs to exam
    const existingQuestion = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion || existingQuestion.examId !== examId) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }

    await prisma.examQuestion.delete({ where: { id: questionId } });

    res.json({ success: true, message: 'Xóa câu hỏi thành công' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa câu hỏi' });
  }
};

// @desc    Reorder questions (batch update)
// @route   PATCH /api/exams/:id/questions/reorder
// @access  Private (Admin/Teacher)
exports.reorderQuestions = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const { questions } = req.body; // Array of { id, order }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Danh sách câu hỏi không hợp lệ' 
      });
    }

    // Verify exam exists
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Bài thi không tồn tại' });
    }
    
    // Kiểm tra quyền teacher với môn học
    const permCheck = await checkTeacherPermission(req.user.id, req.user.role, exam.subjectId);
    if (!permCheck.allowed) {
      return res.status(permCheck.status).json({ success: false, message: permCheck.error });
    }

    // Batch update using transaction
    await prisma.$transaction(
      questions.map(q =>
        prisma.examQuestion.update({
          where: { id: q.id },
          data: { order: q.order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Cập nhật thứ tự câu hỏi thành công',
      data: { updated: questions.length }
    });
  } catch (error) {
    console.error('Reorder questions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi cập nhật thứ tự câu hỏi' 
    });
  }
};

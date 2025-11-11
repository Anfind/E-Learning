const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkExamEligibility } = require('../utils/prerequisite');

// @desc    Start an exam attempt (check eligibility)
// @route   POST /api/exams/:id/start
// @access  Private
exports.startExam = async (req, res, next) => {
  try {
    const { id: examId } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            majorId: true
          }
        },
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            options: true,
            points: true,
            order: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (!exam.isActive) {
      return res.status(400).json({ message: 'This exam is not available' });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_majorId: {
          userId,
          majorId: exam.subject.majorId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ 
        message: 'You must enroll in this major first',
        requiresEnrollment: true
      });
    }

    // Check exam eligibility (must complete all lessons in subject)
    const isEligible = await checkExamEligibility(userId, examId);

    if (!isEligible) {
      return res.status(403).json({
        message: 'You must complete all lessons in this subject before taking the exam',
        locked: true
      });
    }

    // Check if already has a passing attempt
    const passingAttempt = await prisma.examAttempt.findFirst({
      where: {
        userId,
        examId,
        passed: true
      }
    });

    if (passingAttempt && exam.isRequired) {
      return res.json({
        message: 'You have already passed this exam',
        alreadyPassed: true,
        data: passingAttempt
      });
    }

    // Create new attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        userId,
        examId,
        answers: {},
        score: 0,
        passed: false
      }
    });

    // Return exam with questions (without correct answers)
    const examData = {
      id: exam.id,
      name: exam.name,
      description: exam.description,
      duration: exam.duration,
      passingScore: exam.passingScore,
      questions: exam.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        order: q.order
      })),
      attemptId: attempt.id,
      startedAt: attempt.createdAt
    };

    res.json({
      message: 'Exam started. Good luck! 🍀',
      data: examData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit exam answers and calculate score
// @route   POST /api/exams/:id/submit
// @access  Private
exports.submitExam = async (req, res, next) => {
  try {
    const { id: examId } = req.params;
    const { attemptId, answers } = req.body;
    const userId = req.user.id;

    if (!attemptId || !answers || typeof answers !== 'object') {
      return res.status(400).json({ message: 'attemptId and answers are required' });
    }

    // Get exam with questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true
      }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Get attempt and verify ownership
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    if (attempt.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ message: 'This exam has already been submitted' });
    }

    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    for (const question of exam.questions) {
      maxScore += question.points;
      const userAnswer = answers[question.id];
      const correctAnswer = question.correctAnswer;
      const isCorrect = userAnswer && userAnswer.toString().toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) {
        totalScore += question.points;
      }

      results.push({
        questionId: question.id,
        question: question.question,
        userAnswer,
        correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    }

    const scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = scorePercentage >= exam.passingScore;

    // Update attempt
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        answers,
        score: scorePercentage,
        passed,
        submittedAt: new Date()
      }
    });

    res.json({
      message: passed ? '🎉 Congratulations! You passed!' : 'You did not pass this time. Try again!',
      data: {
        attemptId: updatedAttempt.id,
        score: scorePercentage,
        totalScore,
        maxScore,
        passingScore: exam.passingScore,
        passed,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam attempt history
// @route   GET /api/exams/:id/attempts
// @access  Private
exports.getExamAttempts = async (req, res, next) => {
  try {
    const { id: examId } = req.params;
    const userId = req.user.id;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        name: true,
        passingScore: true
      }
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId,
        examId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const attemptsWithDetails = attempts.map(attempt => ({
      id: attempt.id,
      score: attempt.score,
      passed: attempt.passed,
      submittedAt: attempt.submittedAt,
      createdAt: attempt.createdAt,
      duration: attempt.submittedAt 
        ? Math.round((new Date(attempt.submittedAt) - new Date(attempt.createdAt)) / 60000) 
        : null
    }));

    const bestScore = attempts.length > 0 
      ? Math.max(...attempts.map(a => a.score))
      : null;

    const hasPassed = attempts.some(a => a.passed);

    res.json({
      data: {
        exam,
        attempts: attemptsWithDetails,
        totalAttempts: attempts.length,
        bestScore,
        hasPassed
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get exam result details
// @route   GET /api/exams/attempts/:attemptId/result
// @access  Private
exports.getExamResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.id;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt not found' });
    }

    if (attempt.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ message: 'This exam has not been submitted yet' });
    }

    // Build detailed results
    let totalScore = 0;
    let maxScore = 0;
    const results = [];

    for (const question of attempt.exam.questions) {
      maxScore += question.points;
      const userAnswer = attempt.answers[question.id];
      const correctAnswer = question.correctAnswer;
      const isCorrect = userAnswer && userAnswer.toString().toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) {
        totalScore += question.points;
      }

      results.push({
        questionId: question.id,
        question: question.question,
        type: question.type,
        options: question.options,
        userAnswer,
        correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    }

    res.json({
      data: {
        attemptId: attempt.id,
        examName: attempt.exam.name,
        score: attempt.score,
        totalScore,
        maxScore,
        passingScore: attempt.exam.passingScore,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt,
        duration: Math.round((new Date(attempt.submittedAt) - new Date(attempt.createdAt)) / 60000),
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

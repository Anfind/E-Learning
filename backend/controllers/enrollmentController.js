const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Enroll in a major
// @route   POST /api/enrollments
// @access  Private
exports.enrollMajor = async (req, res, next) => {
  try {
    const { majorId } = req.body;
    const userId = req.user.id;

    if (!majorId) {
      return res.status(400).json({ message: 'majorId is required' });
    }

    // Check if major exists and is active
    const major = await prisma.major.findUnique({
      where: { id: majorId }
    });

    if (!major) {
      return res.status(404).json({ message: 'Major not found' });
    }

    if (!major.isActive) {
      return res.status(400).json({ message: 'This major is not available for enrollment' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_majorId: {
          userId,
          majorId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'You are already enrolled in this major' });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        majorId
      },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Enrolled successfully',
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's enrolled majors
// @route   GET /api/enrollments/my
// @access  Private
exports.getMyEnrollments = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            order: true,
            _count: {
              select: {
                subjects: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        // Get all subjects in this major
        const subjects = await prisma.subject.findMany({
          where: { 
            majorId: enrollment.majorId,
            isActive: true
          },
          include: {
            lessons: {
              where: { isActive: true }
            },
            exams: {
              where: { isActive: true }
            }
          }
        });

        // Calculate total lessons and completed lessons
        let totalLessons = 0;
        let completedLessons = 0;
        let totalExams = 0;
        let passedExams = 0;

        for (const subject of subjects) {
          totalLessons += subject.lessons.length;
          totalExams += subject.exams.length;

          // Count completed lessons
          const completedLessonCount = await prisma.lessonProgress.count({
            where: {
              userId,
              lessonId: { in: subject.lessons.map(l => l.id) },
              completed: true
            }
          });
          completedLessons += completedLessonCount;

          // Count passed exams (each exam counted once)
          const passedExamsList = await prisma.examAttempt.findMany({
            where: {
              userId,
              examId: { in: subject.exams.map(e => e.id) },
              passed: true
            },
            distinct: ['examId'],
            select: { examId: true }
          });
          passedExams += passedExamsList.length;
        }

        const progressPercentage = totalLessons > 0 
          ? Math.round(((completedLessons + passedExams) / (totalLessons + totalExams)) * 100)
          : 0;

        return {
          ...enrollment,
          progress: {
            totalLessons,
            completedLessons,
            totalExams,
            passedExams,
            progressPercentage
          }
        };
      })
    );

    res.json({
      data: enrollmentsWithProgress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enrollments (Admin)
// @route   GET /api/enrollments
// @access  Private/Admin
exports.getAllEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, majorId, userId } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (majorId) where.majorId = majorId;
    if (userId) where.userId = userId;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          major: {
            select: {
              id: true,
              name: true,
              imageUrl: true
            }
          }
        },
        orderBy: {
          enrolledAt: 'desc'
        }
      }),
      prisma.enrollment.count({ where })
    ]);

    res.json({
      data: enrollments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unenroll from a major
// @route   DELETE /api/enrollments/:id
// @access  Private
exports.unenrollMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id }
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check ownership (user can only unenroll themselves, admin can unenroll anyone)
    if (enrollment.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to unenroll this user' });
    }

    // Check if user has any progress (optional: you can allow or prevent unenrolling with progress)
    const hasProgress = await prisma.lessonProgress.count({
      where: {
        userId: enrollment.userId,
        lesson: {
          subject: {
            majorId: enrollment.majorId
          }
        }
      }
    });

    if (hasProgress > 0) {
      return res.status(400).json({ 
        message: 'Cannot unenroll: You have learning progress in this major. Please contact admin if you want to unenroll.',
        hasProgress: true
      });
    }

    await prisma.enrollment.delete({
      where: { id }
    });

    res.json({
      message: 'Unenrolled successfully'
    });
  } catch (error) {
    next(error);
  }
};

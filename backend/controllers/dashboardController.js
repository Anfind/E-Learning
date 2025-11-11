const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get user dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get enrolled majors
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        major: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        }
      }
    });

    // Get total lessons completed
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true
      }
    });

    // Get total exams passed (unique exams only)
    const passedExamsList = await prisma.examAttempt.findMany({
      where: {
        userId,
        passed: true
      },
      select: {
        examId: true
      }
    });
    
    // Count unique exam IDs
    const uniqueExamIds = new Set(passedExamsList.map(e => e.examId));
    const passedExams = uniqueExamIds.size;

    // Get in-progress lessons (started but not completed)
    const inProgressLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: false
      }
    });

    // Get recent activities (last 5 lesson progress + exam attempts)
    const recentLessonProgress = await prisma.lessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3
    });

    const recentExamAttempts = await prisma.examAttempt.findMany({
      where: { 
        userId,
        submittedAt: { not: null }
      },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 2
    });

    // Combine and sort activities
    const activities = [
      ...recentLessonProgress.map(p => ({
        type: 'lesson',
        id: p.lesson.id,
        name: p.lesson.name,
        subjectName: p.lesson.subject.name,
        isCompleted: p.completed,
        progress: Math.round((p.watchTime / (p.lesson.duration || 1)) * 100),
        timestamp: p.updatedAt
      })),
      ...recentExamAttempts.map(a => ({
        type: 'exam',
        id: a.exam.id,
        name: a.exam.name,
        subjectName: a.exam.subject.name,
        score: a.score,
        passed: a.passed,
        timestamp: a.submittedAt
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    res.json({
      data: {
        enrolledMajors: enrollments.length,
        completedLessons,
        passedExams,
        inProgressLessons,
        majors: enrollments.map(e => e.major),
        recentActivities: activities
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed progress for a major
// @route   GET /api/dashboard/progress/:majorId
// @access  Private
exports.getMajorProgress = async (req, res, next) => {
  try {
    const { majorId } = req.params;
    const userId = req.user.id;

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_majorId: {
          userId,
          majorId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this major' });
    }

    // Get major with subjects
    const major = await prisma.major.findUnique({
      where: { id: majorId },
      include: {
        subjects: {
          where: { isActive: true },
          include: {
            lessons: {
              where: { isActive: true },
              orderBy: { order: 'asc' }
            },
            exams: {
              where: { isActive: true }
            },
            prerequisite: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!major) {
      return res.status(404).json({ message: 'Major not found' });
    }

    // Build progress for each subject
    const subjectsWithProgress = await Promise.all(
      major.subjects.map(async (subject) => {
        // Get lesson progress
        const lessonProgress = await prisma.lessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: subject.lessons.map(l => l.id) }
          }
        });

        // Get exam attempts
        const examAttempts = await prisma.examAttempt.findMany({
          where: {
            userId,
            examId: { in: subject.exams.map(e => e.id) }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Map lessons with progress
        const lessonsWithProgress = subject.lessons.map(lesson => {
          const progress = lessonProgress.find(p => p.lessonId === lesson.id);
          const isLocked = lesson.prerequisiteId ? !lessonProgress.find(p => p.lessonId === lesson.prerequisiteId && p.completed) : false;

          return {
            id: lesson.id,
            name: lesson.name,
            duration: lesson.duration,
            order: lesson.order,
            prerequisiteId: lesson.prerequisiteId,
            isLocked,
            progress: progress ? {
              watchTime: progress.watchTime,
              isCompleted: progress.completed,
              percentComplete: Math.round((progress.watchTime / lesson.duration) * 100)
            } : null
          };
        });

        // Map exams with attempts
        const examsWithAttempts = subject.exams.map(exam => {
          const attempts = examAttempts.filter(a => a.examId === exam.id);
          const bestAttempt = attempts.length > 0 
            ? attempts.reduce((best, current) => current.score > best.score ? current : best)
            : null;
          const hasPassed = attempts.some(a => a.passed);

          return {
            id: exam.id,
            name: exam.name,
            duration: exam.duration,
            passingScore: exam.passingScore,
            isRequired: exam.isRequired,
            attempts: attempts.length,
            bestScore: bestAttempt?.score || null,
            hasPassed
          };
        });

        // Calculate subject completion
        const completedLessons = lessonProgress.filter(p => p.completed).length;
        const totalLessons = subject.lessons.length;
        const passedExams = subject.exams.filter(e => 
          examAttempts.some(a => a.examId === e.id && a.passed)
        ).length;
        const totalExams = subject.exams.length;

        const completionPercentage = totalLessons + totalExams > 0
          ? Math.round(((completedLessons + passedExams) / (totalLessons + totalExams)) * 100)
          : 0;

        // Check if subject is locked by prerequisite
        const isSubjectLocked = subject.prerequisiteId ? completionPercentage === 0 : false;

        return {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          order: subject.order,
          prerequisite: subject.prerequisite,
          isLocked: isSubjectLocked,
          completionPercentage,
          totalLessons,
          completedLessons,
          totalExams,
          passedExams,
          lessons: lessonsWithProgress,
          exams: examsWithAttempts
        };
      })
    );

    // Calculate next lessons to complete
    const nextLessons = [];
    for (const subject of subjectsWithProgress) {
      if (!subject.isLocked) {
        const nextLesson = subject.lessons.find(l => !l.isLocked && !l.progress?.isCompleted);
        if (nextLesson) {
          nextLessons.push({
            ...nextLesson,
            subjectId: subject.id,
            subjectName: subject.name
          });
        }
      }
    }

    res.json({
      data: {
        major: {
          id: major.id,
          name: major.name,
          description: major.description,
          imageUrl: major.imageUrl
        },
        subjects: subjectsWithProgress,
        nextLessons: nextLessons.slice(0, 3), // Show top 3 next lessons
        enrolledAt: enrollment.enrolledAt
      }
    });
  } catch (error) {
    next(error);
  }
};

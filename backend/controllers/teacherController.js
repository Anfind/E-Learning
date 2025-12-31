const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * @route   GET /api/teacher/subjects
 * @desc    Lấy danh sách môn học mà teacher phụ trách
 * @access  Private/Teacher
 */
exports.getMySubjects = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const subjects = await prisma.subject.findMany({
      where: { teacherId },
      include: {
        major: {
          select: {
            id: true,
            name: true
          }
        },
        lessons: {
          select: {
            id: true,
            name: true,
            isActive: true
          },
          orderBy: { order: 'asc' }
        },
        exams: {
          select: {
            id: true,
            name: true,
            isActive: true,
            passingScore: true
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            lessons: true,
            exams: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Đếm số sinh viên enrolled trong mỗi môn
    const subjectsWithStats = await Promise.all(
      subjects.map(async (subject) => {
        // Lấy major của subject để đếm enrollments
        const enrollmentCount = await prisma.enrollment.count({
          where: {
            majorId: subject.majorId,
            status: 'ACTIVE'
          }
        });

        // Đếm số lesson progress trong subject này
        const lessonIds = subject.lessons.map(l => l.id);
        const progressCount = await prisma.lessonProgress.count({
          where: {
            lessonId: { in: lessonIds },
            completed: true
          }
        });

        // Đếm số exam attempts trong subject này
        const examIds = subject.exams.map(e => e.id);
        const examAttemptCount = await prisma.examAttempt.count({
          where: {
            examId: { in: examIds }
          }
        });

        return {
          ...subject,
          stats: {
            enrolledStudents: enrollmentCount,
            completedLessons: progressCount,
            examAttempts: examAttemptCount
          }
        };
      })
    );

    res.json({
      success: true,
      data: subjectsWithStats
    });
  } catch (error) {
    console.error('Get my subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách môn học',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/subjects/:subjectId/students
 * @desc    Lấy danh sách sinh viên đã enroll vào major chứa môn học này
 * @access  Private/Teacher
 */
exports.getSubjectStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId } = req.params;

    // Kiểm tra subject có thuộc về teacher không
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        teacherId: true,
        majorId: true,
        lessons: {
          select: { id: true }
        },
        exams: {
          select: { id: true }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    if (subject.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phụ trách môn học này'
      });
    }

    // Lấy danh sách sinh viên đã enroll vào major này
    const enrollments = await prisma.enrollment.findMany({
      where: {
        majorId: subject.majorId,
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true
          }
        }
      }
    });

    const lessonIds = subject.lessons.map(l => l.id);
    const examIds = subject.exams.map(e => e.id);

    // Lấy progress của từng sinh viên
    const studentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const userId = enrollment.user.id;

        // Lesson progress
        const lessonProgress = await prisma.lessonProgress.findMany({
          where: {
            userId,
            lessonId: { in: lessonIds }
          },
          select: {
            lessonId: true,
            completed: true,
            watchTime: true,
            faceVerifiedBefore: true,
            faceVerifiedAfter: true
          }
        });

        const completedLessons = lessonProgress.filter(p => p.completed).length;
        const totalLessons = lessonIds.length;

        // Exam attempts
        const examAttempts = await prisma.examAttempt.findMany({
          where: {
            userId,
            examId: { in: examIds }
          },
          select: {
            examId: true,
            score: true,
            passed: true,
            submittedAt: true
          },
          orderBy: { submittedAt: 'desc' }
        });

        // Lấy điểm cao nhất cho mỗi exam
        const examResults = examIds.map(examId => {
          const attempts = examAttempts.filter(a => a.examId === examId);
          if (attempts.length === 0) return null;
          
          const bestAttempt = attempts.reduce((best, current) => 
            current.score > best.score ? current : best
          );
          
          return {
            examId,
            bestScore: bestAttempt.score,
            passed: bestAttempt.passed,
            attemptCount: attempts.length
          };
        }).filter(Boolean);

        const passedExams = examResults.filter(r => r.passed).length;

        return {
          ...enrollment.user,
          enrolledAt: enrollment.createdAt,
          progress: {
            completedLessons,
            totalLessons,
            lessonProgressPercent: totalLessons > 0 
              ? Math.round((completedLessons / totalLessons) * 100) 
              : 0,
            passedExams,
            totalExams: examIds.length,
            examResults
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name,
          totalLessons: lessonIds.length,
          totalExams: examIds.length
        },
        students: studentsWithProgress,
        totalStudents: studentsWithProgress.length
      }
    });
  } catch (error) {
    console.error('Get subject students error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sinh viên',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/subjects/:subjectId/students/:studentId
 * @desc    Lấy chi tiết tiến độ học của một sinh viên
 * @access  Private/Teacher
 */
exports.getStudentDetail = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId, studentId } = req.params;

    // Kiểm tra subject có thuộc về teacher không
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        lessons: {
          select: {
            id: true,
            name: true,
            order: true,
            duration: true
          },
          orderBy: { order: 'asc' }
        },
        exams: {
          select: {
            id: true,
            name: true,
            order: true,
            passingScore: true,
            duration: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    if (subject.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phụ trách môn học này'
      });
    }

    // Lấy thông tin sinh viên
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Kiểm tra sinh viên có enroll vào major chứa subject không
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        majorId: subject.majorId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'Sinh viên chưa đăng ký ngành học này'
      });
    }

    // Lấy lesson progress chi tiết
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: studentId,
        lessonId: { in: subject.lessons.map(l => l.id) }
      }
    });

    const lessonsWithProgress = subject.lessons.map(lesson => {
      const progress = lessonProgress.find(p => p.lessonId === lesson.id);
      return {
        ...lesson,
        progress: progress ? {
          completed: progress.completed,
          watchTime: progress.watchTime,
          faceVerifiedBefore: progress.faceVerifiedBefore,
          faceVerifiedAfter: progress.faceVerifiedAfter,
          startedAt: progress.createdAt,
          lastAccessedAt: progress.updatedAt
        } : null
      };
    });

    // Lấy exam attempts chi tiết
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId: studentId,
        examId: { in: subject.exams.map(e => e.id) }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const examsWithAttempts = subject.exams.map(exam => {
      const attempts = examAttempts.filter(a => a.examId === exam.id);
      const bestAttempt = attempts.length > 0 
        ? attempts.reduce((best, current) => current.score > best.score ? current : best)
        : null;

      return {
        ...exam,
        attempts: attempts.map(a => ({
          id: a.id,
          score: a.score,
          passed: a.passed,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          faceVerifiedStart: a.faceVerifiedStart
        })),
        bestScore: bestAttempt?.score || null,
        passed: bestAttempt?.passed || false,
        attemptCount: attempts.length
      };
    });

    res.json({
      success: true,
      data: {
        student,
        enrolledAt: enrollment.createdAt,
        subject: {
          id: subject.id,
          name: subject.name
        },
        lessons: lessonsWithProgress,
        exams: examsWithAttempts,
        summary: {
          completedLessons: lessonsWithProgress.filter(l => l.progress?.completed).length,
          totalLessons: subject.lessons.length,
          passedExams: examsWithAttempts.filter(e => e.passed).length,
          totalExams: subject.exams.length
        }
      }
    });
  } catch (error) {
    console.error('Get student detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin sinh viên',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/dashboard
 * @desc    Lấy tổng quan dashboard cho teacher
 * @access  Private/Teacher
 */
exports.getDashboard = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Lấy các môn học teacher phụ trách
    const subjects = await prisma.subject.findMany({
      where: { teacherId },
      include: {
        major: {
          select: { id: true, name: true }
        },
        lessons: {
          select: { id: true }
        },
        exams: {
          select: { id: true }
        }
      }
    });

    const subjectIds = subjects.map(s => s.id);
    const lessonIds = subjects.flatMap(s => s.lessons.map(l => l.id));
    const examIds = subjects.flatMap(s => s.exams.map(e => e.id));
    const majorIds = [...new Set(subjects.map(s => s.majorId))];

    // Đếm sinh viên enrolled
    const totalEnrollments = await prisma.enrollment.count({
      where: {
        majorId: { in: majorIds },
        status: 'ACTIVE'
      }
    });

    // Đếm lessons completed
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        lessonId: { in: lessonIds },
        completed: true
      }
    });

    // Đếm exam attempts và passed
    const examStats = await prisma.examAttempt.aggregate({
      where: {
        examId: { in: examIds },
        submittedAt: { not: null }
      },
      _count: true
    });

    const passedExams = await prisma.examAttempt.count({
      where: {
        examId: { in: examIds },
        passed: true
      }
    });

    // Hoạt động gần đây (lesson progress + exam attempts)
    const recentLessonProgress = await prisma.lessonProgress.findMany({
      where: {
        lessonId: { in: lessonIds }
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        },
        lesson: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    const recentExamAttempts = await prisma.examAttempt.findMany({
      where: {
        examId: { in: examIds },
        submittedAt: { not: null }
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        },
        exam: {
          select: { id: true, name: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 10
    });

    // Merge và sort activities
    const recentActivities = [
      ...recentLessonProgress.map(p => ({
        type: 'lesson',
        user: p.user,
        item: p.lesson,
        completed: p.completed,
        timestamp: p.updatedAt
      })),
      ...recentExamAttempts.map(a => ({
        type: 'exam',
        user: a.user,
        item: a.exam,
        score: a.score,
        passed: a.passed,
        timestamp: a.submittedAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        stats: {
          totalSubjects: subjects.length,
          totalLessons: lessonIds.length,
          totalExams: examIds.length,
          totalStudents: totalEnrollments,
          completedLessons,
          totalExamAttempts: examStats._count,
          passedExams,
          examPassRate: examStats._count > 0 
            ? Math.round((passedExams / examStats._count) * 100) 
            : 0
        },
        subjects: subjects.map(s => ({
          id: s.id,
          name: s.name,
          majorName: s.major.name,
          lessonCount: s.lessons.length,
          examCount: s.exams.length
        })),
        recentActivities
      }
    });
  } catch (error) {
    console.error('Get teacher dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dashboard',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/lessons
 * @desc    Lấy tất cả bài học của các môn mà teacher phụ trách
 * @access  Private/Teacher
 */
exports.getMyLessons = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Lấy tất cả lessons của các subject mà teacher phụ trách
    const lessons = await prisma.lesson.findMany({
      where: {
        subject: {
          teacherId: teacherId
        }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            major: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        prerequisite: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { subjectId: 'asc' },
        { order: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Get my lessons error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài học',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/exams
 * @desc    Lấy tất cả bài thi của các môn mà teacher phụ trách
 * @access  Private/Teacher
 */
exports.getMyExams = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Lấy tất cả exams của các subject mà teacher phụ trách
    const exams = await prisma.exam.findMany({
      where: {
        subject: {
          teacherId: teacherId
        }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            major: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: [
        { subjectId: 'asc' },
        { order: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Get my exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bài thi',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/teacher/subjects/:subjectId/exam-results
 * @desc    Lấy tất cả kết quả thi của môn học
 * @access  Private/Teacher
 */
exports.getSubjectExamResults = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { subjectId } = req.params;
    const { examId } = req.query;

    // Kiểm tra subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        exams: {
          select: { id: true, name: true, passingScore: true }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    if (subject.teacherId !== teacherId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phụ trách môn học này'
      });
    }

    const examIds = examId ? [examId] : subject.exams.map(e => e.id);

    const attempts = await prisma.examAttempt.findMany({
      where: {
        examId: { in: examIds },
        submittedAt: { not: null }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        exam: {
          select: { id: true, name: true, passingScore: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Thống kê theo exam
    const examStats = subject.exams.map(exam => {
      const examAttempts = attempts.filter(a => a.examId === exam.id);
      const passedCount = examAttempts.filter(a => a.passed).length;
      const avgScore = examAttempts.length > 0
        ? examAttempts.reduce((sum, a) => sum + a.score, 0) / examAttempts.length
        : 0;

      return {
        examId: exam.id,
        examName: exam.name,
        passingScore: exam.passingScore,
        totalAttempts: examAttempts.length,
        passedCount,
        failedCount: examAttempts.length - passedCount,
        passRate: examAttempts.length > 0 
          ? Math.round((passedCount / examAttempts.length) * 100) 
          : 0,
        averageScore: Math.round(avgScore * 10) / 10
      };
    });

    res.json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name
        },
        examStats,
        attempts: attempts.map(a => ({
          id: a.id,
          user: a.user,
          exam: a.exam,
          score: a.score,
          passed: a.passed,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          faceVerifiedStart: a.faceVerifiedStart
        }))
      }
    });
  } catch (error) {
    console.error('Get subject exam results error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy kết quả thi',
      error: error.message
    });
  }
};

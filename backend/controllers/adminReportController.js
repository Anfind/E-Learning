const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get user report with detailed filters
// @route   GET /api/admin/reports/users
// @access  Private/Admin
exports.getUserReport = async (req, res, next) => {
  try {
    const { 
      status, 
      role, 
      registeredFrom, 
      registeredTo,
      hasEnrollments,
      hasCompletedLessons,
      format = 'json' // json or csv
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (role) where.role = role;
    
    if (registeredFrom || registeredTo) {
      where.createdAt = {};
      if (registeredFrom) where.createdAt.gte = new Date(registeredFrom);
      if (registeredTo) where.createdAt.lte = new Date(registeredTo);
    }

    if (hasEnrollments === 'true') {
      where.enrollments = { some: {} };
    } else if (hasEnrollments === 'false') {
      where.enrollments = { none: {} };
    }

    if (hasCompletedLessons === 'true') {
      where.lessonProgress = { 
        some: { completed: true } 
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        role: true,
        faceRegistered: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            lessonProgress: {
              where: { completed: true }
            },
            examAttempts: {
              where: { passed: true }
            },
            blogPosts: true,
            questions: true,
            answers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      role: user.role,
      faceRegistered: user.faceRegistered,
      enrollments: user._count.enrollments,
      completedLessons: user._count.lessonProgress,
      passedExams: user._count.examAttempts,
      blogPosts: user._count.blogPosts,
      questions: user._count.questions,
      answers: user._count.answers,
      totalActivity: user._count.lessonProgress + user._count.examAttempts + 
                     user._count.blogPosts + user._count.questions + user._count.answers,
      registeredAt: user.createdAt,
      lastUpdated: user.updatedAt
    }));

    // If CSV format requested
    if (format === 'csv') {
      const csvHeader = 'ID,Name,Email,Phone,Status,Role,Face Registered,Enrollments,Completed Lessons,Passed Exams,Blog Posts,Questions,Answers,Total Activity,Registered At\n';
      const csvRows = formattedUsers.map(u => 
        `${u.id},${u.name},"${u.email}",${u.phone || ''},${u.status},${u.role},${u.faceRegistered},${u.enrollments},${u.completedLessons},${u.passedExams},${u.blogPosts},${u.questions},${u.answers},${u.totalActivity},${u.registeredAt.toISOString()}`
      ).join('\n');
      
      const csv = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=user-report.csv');
      return res.send(csv);
    }

    res.json({
      data: formattedUsers,
      summary: {
        totalUsers: users.length,
        filters: { status, role, registeredFrom, registeredTo, hasEnrollments, hasCompletedLessons }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress report by major/subject
// @route   GET /api/admin/reports/progress
// @access  Private/Admin
exports.getProgressReport = async (req, res, next) => {
  try {
    const { majorId, subjectId, userId, format = 'json' } = req.query;

    let enrollments = [];

    if (userId) {
      // Single user progress
      const where = { userId };
      if (majorId) where.majorId = majorId;

      enrollments = await prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          major: {
            select: {
              id: true,
              name: true,
              subjects: {
                where: subjectId ? { id: subjectId } : {},
                include: {
                  lessons: true,
                  exams: true
                }
              }
            }
          }
        }
      });
    } else if (majorId) {
      // All users in a major
      enrollments = await prisma.enrollment.findMany({
        where: { majorId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          major: {
            select: {
              id: true,
              name: true,
              subjects: {
                where: subjectId ? { id: subjectId } : {},
                include: {
                  lessons: true,
                  exams: true
                }
              }
            }
          }
        }
      });
    } else {
      return res.status(400).json({ 
        message: 'Either majorId or userId is required' 
      });
    }

    const progressData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const subjects = enrollment.major.subjects;
        
        const subjectProgress = await Promise.all(
          subjects.map(async (subject) => {
            const lessonIds = subject.lessons.map(l => l.id);
            const examIds = subject.exams.map(e => e.id);

            const [completedLessons, examAttempts] = await Promise.all([
              prisma.lessonProgress.findMany({
                where: {
                  userId: enrollment.userId,
                  lessonId: { in: lessonIds },
                  completed: true
                },
                include: {
                  lesson: {
                    select: {
                      id: true,
                      name: true,
                      duration: true
                    }
                  }
                }
              }),
              prisma.examAttempt.findMany({
                where: {
                  userId: enrollment.userId,
                  examId: { in: examIds }
                },
                include: {
                  exam: {
                    select: {
                      id: true,
                      name: true,
                      passingScore: true
                    }
                  }
                },
                orderBy: {
                  createdAt: 'desc'
                }
              })
            ]);

            // Get best attempt for each exam
            const examResults = {};
            examAttempts.forEach(attempt => {
              if (!examResults[attempt.examId] || attempt.score > examResults[attempt.examId].score) {
                examResults[attempt.examId] = {
                  examId: attempt.examId,
                  examName: attempt.exam.name,
                  bestScore: attempt.score,
                  passed: attempt.passed,
                  attempts: 1,
                  passingScore: attempt.exam.passingScore
                };
              } else {
                examResults[attempt.examId].attempts++;
              }
            });

            const completionRate = subject.lessons.length + subject.exams.length > 0
              ? Math.round(((completedLessons.length + Object.values(examResults).filter(e => e.passed).length) / 
                (subject.lessons.length + subject.exams.length)) * 100)
              : 0;

            return {
              subjectId: subject.id,
              subjectName: subject.name,
              totalLessons: subject.lessons.length,
              completedLessons: completedLessons.length,
              totalExams: subject.exams.length,
              passedExams: Object.values(examResults).filter(e => e.passed).length,
              completionRate,
              lessonDetails: completedLessons.map(lp => ({
                lessonId: lp.lesson.id,
                lessonName: lp.lesson.name,
                duration: lp.lesson.duration,
                watchTime: lp.watchTime,
                completedAt: lp.completedAt
              })),
              examDetails: Object.values(examResults)
            };
          })
        );

        const overallCompletion = subjectProgress.length > 0
          ? Math.round(subjectProgress.reduce((sum, s) => sum + s.completionRate, 0) / subjectProgress.length)
          : 0;

        return {
          userId: enrollment.user.id,
          userName: enrollment.user.name,
          userEmail: enrollment.user.email,
          majorId: enrollment.major.id,
          majorName: enrollment.major.name,
          enrolledAt: enrollment.enrolledAt,
          overallCompletion,
          subjects: subjectProgress
        };
      })
    );

    // If CSV format requested
    if (format === 'csv') {
      const csvHeader = 'User ID,User Name,User Email,Major,Subject,Total Lessons,Completed Lessons,Total Exams,Passed Exams,Completion Rate,Enrolled At\n';
      const csvRows = [];
      
      progressData.forEach(pd => {
        pd.subjects.forEach(subject => {
          csvRows.push(
            `${pd.userId},${pd.userName},"${pd.userEmail}",${pd.majorName},${subject.subjectName},${subject.totalLessons},${subject.completedLessons},${subject.totalExams},${subject.passedExams},${subject.completionRate}%,${pd.enrolledAt.toISOString()}`
          );
        });
      });
      
      const csv = csvHeader + csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=progress-report.csv');
      return res.send(csv);
    }

    res.json({
      data: progressData,
      summary: {
        totalEnrollments: progressData.length,
        filters: { majorId, subjectId, userId }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get engagement report (activity timeline)
// @route   GET /api/admin/reports/engagement
// @access  Private/Admin
exports.getEngagementReport = async (req, res, next) => {
  try {
    const { days = 30, userId, majorId } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const where = {
      createdAt: { gte: daysAgo }
    };

    if (userId) where.userId = userId;

    // Get all activities
    const [
      lessonActivities,
      examActivities,
      blogActivities,
      questionActivities,
      answerActivities
    ] = await Promise.all([
      prisma.lessonProgress.findMany({
        where: {
          ...where,
          ...(majorId && {
            lesson: {
              subject: {
                majorId
              }
            }
          })
        },
        select: {
          userId: true,
          lessonId: true,
          isCompleted: true,
          createdAt: true,
          completedAt: true,
          lesson: {
            select: {
              name: true,
              subject: {
                select: {
                  name: true,
                  major: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.examAttempt.findMany({
        where: {
          ...where,
          submittedAt: { not: null },
          ...(majorId && {
            exam: {
              subject: {
                majorId
              }
            }
          })
        },
        select: {
          userId: true,
          examId: true,
          score: true,
          passed: true,
          submittedAt: true,
          exam: {
            select: {
              name: true,
              passingScore: true,
              subject: {
                select: {
                  name: true,
                  major: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      }),
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      }),
      prisma.question.findMany({
        where,
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      }),
      prisma.answer.findMany({
        where,
        select: {
          id: true,
          content: true,
          createdAt: true,
          questionId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          question: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    ]);

    // Combine and format all activities
    const activities = [
      ...lessonActivities.map(a => ({
        type: 'lesson',
        action: a.isCompleted ? 'completed' : 'started',
        timestamp: a.completedAt || a.createdAt,
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        details: {
          lessonName: a.lesson.name,
          subjectName: a.lesson.subject.name,
          majorName: a.lesson.subject.major.name
        }
      })),
      ...examActivities.map(a => ({
        type: 'exam',
        action: a.passed ? 'passed' : 'failed',
        timestamp: a.submittedAt,
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        details: {
          examName: a.exam.name,
          score: a.score,
          passingScore: a.exam.passingScore,
          subjectName: a.exam.subject.name,
          majorName: a.exam.subject.major.name
        }
      })),
      ...blogActivities.map(a => ({
        type: 'blog',
        action: 'posted',
        timestamp: a.createdAt,
        userId: a.author.id,
        userName: a.author.name,
        userEmail: a.author.email,
        details: {
          title: a.title
        }
      })),
      ...questionActivities.map(a => ({
        type: 'question',
        action: 'asked',
        timestamp: a.createdAt,
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        details: {
          title: a.title
        }
      })),
      ...answerActivities.map(a => ({
        type: 'answer',
        action: 'answered',
        timestamp: a.createdAt,
        userId: a.user.id,
        userName: a.user.name,
        userEmail: a.user.email,
        details: {
          questionTitle: a.question.title,
          content: a.content.substring(0, 100) + '...'
        }
      }))
    ];

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Activity summary by type
    const activitySummary = {
      lessons: {
        started: lessonActivities.filter(a => !a.isCompleted).length,
        completed: lessonActivities.filter(a => a.isCompleted).length
      },
      exams: {
        passed: examActivities.filter(a => a.passed).length,
        failed: examActivities.filter(a => !a.passed).length
      },
      blog: blogActivities.length,
      questions: questionActivities.length,
      answers: answerActivities.length,
      total: activities.length
    };

    res.json({
      data: {
        activities: activities.slice(0, 100), // Limit to 100 most recent
        summary: activitySummary,
        filters: { days, userId, majorId }
      }
    });
  } catch (error) {
    next(error);
  }
};

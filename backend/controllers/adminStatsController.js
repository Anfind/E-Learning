const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Get admin dashboard overview statistics
// @route   GET /api/admin/stats/overview
// @access  Private/Admin
exports.getOverviewStats = async (req, res, next) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const [
      totalUsers,
      pendingUsers,
      activeUsers,
      deactiveUsers,
      newUsersThisWeek,
      newUsersThisMonth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'DEACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: oneMonthAgo } } })
    ]);

    // Learning statistics
    const [
      totalMajors,
      activeMajors,
      totalSubjects,
      totalLessons,
      totalExams,
      totalEnrollments
    ] = await Promise.all([
      prisma.major.count(),
      prisma.major.count({ where: { isActive: true } }),
      prisma.subject.count(),
      prisma.lesson.count(),
      prisma.exam.count(),
      prisma.enrollment.count()
    ]);

    // Progress statistics
    const [
      completedLessons,
      totalExamAttempts,
      passedExamAttempts
    ] = await Promise.all([
      prisma.lessonProgress.count({ where: { completed: true } }),
      prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.examAttempt.count({ where: { passed: true } })
    ]);

    // Community statistics
    const [
      totalBlogPosts,
      totalQuestions,
      totalAnswers,
      totalComments
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.question.count(),
      prisma.answer.count(),
      prisma.comment.count()
    ]);

    // Calculate rates
    const examPassRate = totalExamAttempts > 0 
      ? Math.round((passedExamAttempts / totalExamAttempts) * 100)
      : 0;

    const userGrowthWeek = totalUsers > newUsersThisWeek
      ? Math.round((newUsersThisWeek / (totalUsers - newUsersThisWeek)) * 100)
      : 0;

    res.json({
      data: {
        users: {
          total: totalUsers,
          pending: pendingUsers,
          active: activeUsers,
          deactive: deactiveUsers,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth,
          growthWeek: userGrowthWeek
        },
        learning: {
          majors: totalMajors,
          subjects: totalSubjects,
          lessons: totalLessons,
          exams: totalExams,
          enrollments: totalEnrollments
        },
        progress: {
          completedLessons,
          examPassRate
        },
        community: {
          blogPosts: totalBlogPosts,
          questions: totalQuestions,
          answers: totalAnswers,
          comments: totalComments
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics and growth data
// @route   GET /api/admin/stats/users
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // User status distribution
    const statusDistribution = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // User role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // User growth over time (daily registrations)
    const userGrowth = await prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "User"
      WHERE "createdAt" >= ${daysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Most active users (by lesson completions)
    const mostActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        _count: {
          select: {
            lessonProgress: {
              where: { completed: true }
            },
            examAttempts: {
              where: { passed: true }
            },
            enrollments: true
          }
        }
      },
      orderBy: {
        lessonProgress: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Format most active users
    const formattedActiveUsers = mostActiveUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      completedLessons: user._count.lessonProgress,
      passedExams: user._count.examAttempts,
      enrollments: user._count.enrollments,
      totalActivity: user._count.lessonProgress + user._count.examAttempts
    }));

    res.json({
      data: {
        statusDistribution: statusDistribution.map(s => ({
          status: s.status,
          count: s._count.status
        })),
        roleDistribution: roleDistribution.map(r => ({
          role: r.role,
          count: r._count.role
        })),
        userGrowth: userGrowth.map(g => ({
          date: g.date,
          count: Number(g.count)
        })),
        mostActiveUsers: formattedActiveUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get learning analytics
// @route   GET /api/admin/stats/learning
// @access  Private/Admin
exports.getLearningStats = async (req, res, next) => {
  try {
    // Popular majors (by enrollments)
    const popularMajors = await prisma.major.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        _count: {
          select: {
            enrollments: true,
            subjects: true
          }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Popular subjects (by enrollment through major)
    const popularSubjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        major: {
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
      include: {
        major: {
          select: {
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        }
      },
      orderBy: {
        major: {
          enrollments: {
            _count: 'desc'
          }
        }
      },
      take: 10
    });

    // Format popular subjects with enrollment count
    const formattedSubjects = popularSubjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      majorName: subject.major.name,
      enrollments: subject.major._count.enrollments,
      lessons: subject._count.lessons,
      exams: subject._count.exams
    }));

    // Completion rates by major
    const majors = await prisma.major.findMany({
      include: {
        subjects: {
          include: {
            lessons: true,
            exams: true
          }
        },
        enrollments: true
      }
    });

    const completionRates = await Promise.all(
      majors.map(async (major) => {
        const totalLessons = major.subjects.reduce((sum, s) => sum + s.lessons.length, 0);
        const totalExams = major.subjects.reduce((sum, s) => sum + s.exams.length, 0);

        if (major.enrollments.length === 0) {
          return {
            majorId: major.id,
            majorName: major.name,
            enrollments: 0,
            completionRate: 0,
            averageProgress: 0
          };
        }

        let totalCompletedLessons = 0;
        let totalPassedExams = 0;

        for (const enrollment of major.enrollments) {
          const lessonIds = major.subjects.flatMap(s => s.lessons.map(l => l.id));
          const examIds = major.subjects.flatMap(s => s.exams.map(e => e.id));

          const [completedCount, passedCount] = await Promise.all([
            prisma.lessonProgress.count({
              where: {
                userId: enrollment.userId,
                lessonId: { in: lessonIds },
                completed: true
              }
            }),
            prisma.examAttempt.count({
              where: {
                userId: enrollment.userId,
                examId: { in: examIds },
                passed: true
              },
              distinct: ['examId']
            })
          ]);

          totalCompletedLessons += completedCount;
          totalPassedExams += passedCount;
        }

        const totalItems = (totalLessons + totalExams) * major.enrollments.length;
        const completedItems = totalCompletedLessons + totalPassedExams;
        const completionRate = totalItems > 0 
          ? Math.round((completedItems / totalItems) * 100)
          : 0;

        return {
          majorId: major.id,
          majorName: major.name,
          enrollments: major.enrollments.length,
          totalLessons,
          totalExams,
          completionRate,
          averageProgress: completionRate
        };
      })
    );

    // Overall completion rate
    const totalEnrollments = await prisma.enrollment.count();
    const allCompletedLessons = await prisma.lessonProgress.count({ 
      where: { completed: true } 
    });
    const allLessons = await prisma.lesson.count();
    
    const overallCompletionRate = allLessons > 0 && totalEnrollments > 0
      ? Math.round((allCompletedLessons / (allLessons * totalEnrollments)) * 100)
      : 0;

    res.json({
      data: {
        popularMajors: popularMajors.map(m => ({
          id: m.id,
          name: m.name,
          imageUrl: m.imageUrl,
          enrollments: m._count.enrollments,
          subjects: m._count.subjects
        })),
        popularSubjects: formattedSubjects,
        completionRates,
        overallCompletionRate,
        totalEnrollments
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get engagement statistics
// @route   GET /api/admin/stats/engagement
// @access  Private/Admin
exports.getEngagementStats = async (req, res, next) => {
  try {
    // Lesson engagement
    const totalLessons = await prisma.lesson.count();
    const startedLessons = await prisma.lessonProgress.count();
    const completedLessons = await prisma.lessonProgress.count({ 
      where: { completed: true } 
    });

    const lessonStartRate = totalLessons > 0
      ? Math.round((startedLessons / totalLessons) * 100)
      : 0;

    const lessonCompletionRate = startedLessons > 0
      ? Math.round((completedLessons / startedLessons) * 100)
      : 0;

    // Average watch time
    const avgWatchTime = await prisma.lessonProgress.aggregate({
      _avg: {
        watchTime: true
      }
    });

    // Exam engagement
    const totalExams = await prisma.exam.count();
    const totalAttempts = await prisma.examAttempt.count({ 
      where: { submittedAt: { not: null } } 
    });
    const passedAttempts = await prisma.examAttempt.count({ 
      where: { passed: true } 
    });

    const examPassRate = totalAttempts > 0
      ? Math.round((passedAttempts / totalAttempts) * 100)
      : 0;

    // Average exam score
    const avgScore = await prisma.examAttempt.aggregate({
      where: { submittedAt: { not: null } },
      _avg: {
        score: true
      }
    });

    // Most attempted exams
    const mostAttemptedExams = await prisma.exam.findMany({
      select: {
        id: true,
        name: true,
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
            attempts: {
              where: { submittedAt: { not: null } }
            }
          }
        }
      },
      orderBy: {
        attempts: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Lessons with highest completion rate
    const lessonsWithProgress = await prisma.lesson.findMany({
      select: {
        id: true,
        name: true,
        duration: true,
        subject: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            progress: true,
            completedProgress: {
              where: { completed: true }
            }
          }
        }
      },
      orderBy: {
        progress: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const formattedLessons = lessonsWithProgress.map(lesson => ({
      id: lesson.id,
      name: lesson.name,
      duration: lesson.duration,
      subjectName: lesson.subject.name,
      started: lesson._count.progress,
      completed: lesson._count.completedProgress,
      completionRate: lesson._count.progress > 0
        ? Math.round((lesson._count.completedProgress / lesson._count.progress) * 100)
        : 0
    }));

    res.json({
      data: {
        lessons: {
          total: totalLessons,
          started: startedLessons,
          completed: completedLessons,
          startRate: lessonStartRate,
          completionRate: lessonCompletionRate,
          avgWatchTime: Math.round(avgWatchTime._avg.watchTime || 0)
        },
        exams: {
          total: totalExams,
          attempts: totalAttempts,
          passed: passedAttempts,
          passRate: examPassRate,
          avgScore: Math.round(avgScore._avg.score || 0)
        },
        mostAttemptedExams: mostAttemptedExams.map(e => ({
          id: e.id,
          name: e.name,
          subjectName: e.subject.name,
          majorName: e.subject.major.name,
          attempts: e._count.attempts
        })),
        topLessons: formattedLessons
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get community statistics
// @route   GET /api/admin/stats/community
// @access  Private/Admin
exports.getCommunityStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Blog statistics
    const [
      totalBlogPosts,
      recentBlogPosts,
      totalBlogViews,
      totalComments
    ] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { createdAt: { gte: daysAgo } } }),
      prisma.blogPost.aggregate({ _sum: { views: true } }),
      prisma.comment.count()
    ]);

    // Q&A statistics
    const [
      totalQuestions,
      recentQuestions,
      totalAnswers,
      questionsWithAcceptedAnswer,
      totalQuestionViews
    ] = await Promise.all([
      prisma.question.count(),
      prisma.question.count({ where: { createdAt: { gte: daysAgo } } }),
      prisma.answer.count(),
      prisma.question.count({ where: { acceptedAnswerId: { not: null } } }),
      prisma.question.aggregate({ _sum: { views: true } })
    ]);

    const answerRate = totalQuestions > 0
      ? Math.round((totalAnswers / totalQuestions) * 100)
      : 0;

    const resolvedRate = totalQuestions > 0
      ? Math.round((questionsWithAcceptedAnswer / totalQuestions) * 100)
      : 0;

    // Most active blog authors
    const topBlogAuthors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        _count: {
          select: {
            blogPosts: true,
            comments: true
          }
        }
      },
      orderBy: {
        blogPosts: {
          _count: 'desc'
        }
      },
      take: 10,
      where: {
        blogPosts: {
          some: {}
        }
      }
    });

    // Most active Q&A contributors
    const topQAContributors = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        _count: {
          select: {
            questions: true,
            answers: true
          }
        }
      },
      orderBy: {
        answers: {
          _count: 'desc'
        }
      },
      take: 10,
      where: {
        OR: [
          { questions: { some: {} } },
          { answers: { some: {} } }
        ]
      }
    });

    // Most used tags
    const mostUsedTags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            blogPosts: true,
            questions: true
          }
        }
      },
      orderBy: [
        { blogPosts: { _count: 'desc' } },
        { questions: { _count: 'desc' } }
      ],
      take: 20
    });

    const formattedTags = mostUsedTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      blogCount: tag._count.blogPosts,
      questionCount: tag._count.questions,
      totalUsage: tag._count.blogPosts + tag._count.questions
    })).sort((a, b) => b.totalUsage - a.totalUsage);

    // Popular blog posts
    const popularBlogPosts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        author: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        },
        createdAt: true
      },
      orderBy: {
        views: 'desc'
      },
      take: 10
    });

    // Popular questions
    const popularQuestions = await prisma.question.findMany({
      select: {
        id: true,
        title: true,
        views: true,
        user: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        },
        acceptedAnswerId: true,
        createdAt: true
      },
      orderBy: {
        views: 'desc'
      },
      take: 10
    });

    res.json({
      data: {
        blog: {
          totalPosts: totalBlogPosts,
          recentPosts: recentBlogPosts,
          totalViews: totalBlogViews._sum.views || 0,
          totalComments,
          avgCommentsPerPost: totalBlogPosts > 0 
            ? Math.round(totalComments / totalBlogPosts) 
            : 0
        },
        qa: {
          totalQuestions,
          recentQuestions,
          totalAnswers,
          questionsWithAcceptedAnswer,
          totalViews: totalQuestionViews._sum.views || 0,
          answerRate,
          resolvedRate,
          avgAnswersPerQuestion: totalQuestions > 0
            ? Math.round(totalAnswers / totalQuestions)
            : 0
        },
        topBlogAuthors: topBlogAuthors.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          posts: u._count.blogPosts,
          comments: u._count.comments
        })),
        topQAContributors: topQAContributors.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          questions: u._count.questions,
          answers: u._count.answers,
          totalActivity: u._count.questions + u._count.answers
        })),
        mostUsedTags: formattedTags,
        popularBlogPosts: popularBlogPosts.map(p => ({
          id: p.id,
          title: p.title,
          views: p.views,
          comments: p._count.comments,
          authorName: p.author.name,
          createdAt: p.createdAt
        })),
        popularQuestions: popularQuestions.map(q => ({
          id: q.id,
          title: q.title,
          views: q.views,
          answers: q._count.answers,
          hasAcceptedAnswer: !!q.acceptedAnswerId,
          authorName: q.user.name,
          createdAt: q.createdAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

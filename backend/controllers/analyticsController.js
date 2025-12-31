/**
 * Analytics Controller
 * Handles learning analytics and progress reports
 */

const { PrismaClient } = require('@prisma/client');
const { getAIInsights, getQuickTips, isConfigured } = require('../utils/groqClient');

const prisma = new PrismaClient();

/**
 * Get overview analytics for dashboard
 * For Students: Their own progress
 * For Teachers: All students in their subjects
 */
const getOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'TEACHER') {
      return getTeacherOverview(req, res);
    }

    // Student overview
    const overview = await getStudentOverview(userId);
    res.json(overview);
  } catch (error) {
    console.error('Analytics Overview Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu phân tích' });
  }
};

/**
 * Get student's own learning overview
 */
const getStudentOverview = async (userId) => {
  // Get enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      major: {
        include: {
          subjects: {
            include: {
              lessons: true,
              exams: true
            }
          }
        }
      }
    }
  });

  // Get lesson progress
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    include: {
      lesson: {
        include: {
          subject: true
        }
      }
    }
  });

  // Get exam attempts
  const examAttempts = await prisma.examAttempt.findMany({
    where: { userId, status: 'GRADED' },
    include: {
      exam: {
        include: {
          subject: true
        }
      }
    },
    orderBy: { submittedAt: 'desc' }
  });

  // Calculate metrics
  const completedLessons = lessonProgress.filter(lp => lp.completed).length;
  const totalLessons = enrollments.reduce((sum, e) => 
    sum + e.major.subjects.reduce((s, sub) => s + sub.lessons.length, 0), 0);
  
  const totalWatchTime = lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0);
  const totalHours = Math.floor(totalWatchTime / 60);
  const totalMinutes = totalWatchTime % 60;

  const gradedExams = examAttempts.filter(ea => ea.score !== null);
  const avgScore = gradedExams.length > 0 
    ? Math.round(gradedExams.reduce((sum, ea) => sum + ea.score, 0) / gradedExams.length)
    : 0;

  // Calculate streak (simplified - consecutive days with activity)
  const streak = await calculateStreak(userId);

  // Get recent exams
  const recentExams = examAttempts.slice(0, 5).map(ea => ({
    id: ea.id,
    examName: ea.exam.name,
    subjectName: ea.exam.subject.name,
    score: ea.score,
    passed: ea.passed,
    submittedAt: ea.submittedAt
  }));

  // Subject progress
  const subjectProgress = [];
  for (const enrollment of enrollments) {
    for (const subject of enrollment.major.subjects) {
      const subjectLessons = lessonProgress.filter(lp => lp.lesson.subjectId === subject.id);
      const completed = subjectLessons.filter(lp => lp.completed).length;
      const total = subject.lessons.length;
      
      if (total > 0) {
        subjectProgress.push({
          id: subject.id,
          name: subject.name,
          majorName: enrollment.major.name,
          completedLessons: completed,
          totalLessons: total,
          progress: Math.round((completed / total) * 100)
        });
      }
    }
  }

  // Sort by progress (lowest first to highlight areas needing work)
  subjectProgress.sort((a, b) => a.progress - b.progress);

  // Find best and weakest subjects
  const subjectsWithExams = {};
  for (const attempt of examAttempts) {
    const subjectId = attempt.exam.subjectId;
    if (!subjectsWithExams[subjectId]) {
      subjectsWithExams[subjectId] = {
        name: attempt.exam.subject.name,
        scores: []
      };
    }
    if (attempt.score !== null) {
      subjectsWithExams[subjectId].scores.push(attempt.score);
    }
  }

  let bestSubject = 'Chưa có dữ liệu';
  let weakestSubject = 'Chưa có dữ liệu';
  let bestScore = 0;
  let worstScore = 100;

  for (const [, data] of Object.entries(subjectsWithExams)) {
    if (data.scores.length > 0) {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      if (avg > bestScore) {
        bestScore = avg;
        bestSubject = data.name;
      }
      if (avg < worstScore) {
        worstScore = avg;
        weakestSubject = data.name;
      }
    }
  }

  // Monthly progress (last 6 months)
  const monthlyProgress = await getMonthlyProgress(userId, 6);

  return {
    summary: {
      enrolledMajors: enrollments.length,
      completedLessons,
      totalLessons,
      lessonProgress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      totalStudyTime: { hours: totalHours, minutes: totalMinutes },
      examsTaken: gradedExams.length,
      avgScore,
      streak,
      bestSubject,
      weakestSubject
    },
    recentExams,
    subjectProgress: subjectProgress.slice(0, 6),
    monthlyProgress,
    aiConfigured: isConfigured()
  };
};

/**
 * Get teacher's overview of all students
 */
const getTeacherOverview = async (req, res) => {
  const teacherId = req.user.id;
  console.log('Teacher ID:', teacherId);

  // Get subjects taught by this teacher
  const subjects = await prisma.subject.findMany({
    where: { teacherId },
    include: {
      major: true,
      lessons: true,
      exams: true
    }
  });

  console.log('Subjects found:', subjects.length);

  if (subjects.length === 0) {
    return res.json({
      summary: {
        totalSubjects: 0,
        totalStudents: 0,
        activeStudents: 0,
        activePercent: 0,
        avgProgress: 0,
        avgExamScore: 0
      },
      subjects: [],
      students: [],
      topStudents: [],
      aiConfigured: isConfigured()
    });
  }

  const subjectIds = subjects.map(s => s.id);
  const majorIds = [...new Set(subjects.map(s => s.majorId))];

  // Get all students enrolled in these majors
  const enrollments = await prisma.enrollment.findMany({
    where: { majorId: { in: majorIds } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true
        }
      },
      major: true
    }
  });

  const studentIds = [...new Set(enrollments.map(e => e.userId))];

  // Get lesson progress for these students in teacher's subjects
  const lessonProgress = await prisma.lessonProgress.findMany({
    where: {
      userId: { in: studentIds },
      lesson: { subjectId: { in: subjectIds } }
    },
    include: {
      lesson: true,
      user: {
        select: { id: true, name: true }
      }
    }
  });

  // Get exam attempts
  const examAttempts = await prisma.examAttempt.findMany({
    where: {
      userId: { in: studentIds },
      exam: { subjectId: { in: subjectIds } },
      status: 'GRADED'
    },
    include: {
      exam: true,
      user: {
        select: { id: true, name: true }
      }
    }
  });

  // Calculate per-student metrics
  const studentMetrics = {};
  
  for (const enrollment of enrollments) {
    const studentId = enrollment.userId;
    if (!studentMetrics[studentId]) {
      studentMetrics[studentId] = {
        id: studentId,
        name: enrollment.user.name,
        email: enrollment.user.email,
        avatar: enrollment.user.avatar,
        majorName: enrollment.major.name,
        completedLessons: 0,
        totalLessons: 0,
        examScores: [],
        lastActivity: null
      };
    }
  }

  // Count lessons per student
  const totalLessonsInSubjects = subjects.reduce((sum, s) => sum + s.lessons.length, 0);
  
  for (const progress of lessonProgress) {
    const studentId = progress.userId;
    if (studentMetrics[studentId]) {
      if (progress.completed) {
        studentMetrics[studentId].completedLessons++;
      }
      if (!studentMetrics[studentId].lastActivity || 
          progress.updatedAt > studentMetrics[studentId].lastActivity) {
        studentMetrics[studentId].lastActivity = progress.updatedAt;
      }
    }
  }

  // Add exam scores
  for (const attempt of examAttempts) {
    const studentId = attempt.userId;
    if (studentMetrics[studentId] && attempt.score !== null) {
      studentMetrics[studentId].examScores.push(attempt.score);
    }
  }

  // Calculate final metrics
  const students = Object.values(studentMetrics).map(student => {
    student.totalLessons = totalLessonsInSubjects;
    student.progress = student.totalLessons > 0 
      ? Math.round((student.completedLessons / student.totalLessons) * 100) 
      : 0;
    student.avgScore = student.examScores.length > 0
      ? Math.round(student.examScores.reduce((a, b) => a + b, 0) / student.examScores.length)
      : null;
    return student;
  });

  // Sort by progress (lowest first for attention)
  students.sort((a, b) => a.progress - b.progress);

  // Calculate summary
  const activeStudents = students.filter(s => s.completedLessons > 0).length;
  const avgProgress = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
    : 0;
  
  const allScores = students.flatMap(s => s.examScores);
  const avgExamScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  // Subject stats
  const subjectStats = subjects.map(subject => {
    const subjectLessons = lessonProgress.filter(lp => lp.lesson.subjectId === subject.id);
    const completedCount = subjectLessons.filter(lp => lp.completed).length;
    const uniqueStudents = [...new Set(subjectLessons.map(lp => lp.userId))].length;
    
    return {
      id: subject.id,
      name: subject.name,
      majorName: subject.major.name,
      totalLessons: subject.lessons.length,
      totalExams: subject.exams.length,
      studentsEnrolled: uniqueStudents,
      avgProgress: uniqueStudents > 0 && subject.lessons.length > 0
        ? Math.round((completedCount / (uniqueStudents * subject.lessons.length)) * 100)
        : 0
    };
  });

  res.json({
    summary: {
      totalSubjects: subjects.length,
      totalStudents: students.length,
      activeStudents,
      activePercent: students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0,
      avgProgress,
      avgExamScore
    },
    subjects: subjectStats,
    students: students, // All students - no limit
    topStudents: [...students].sort((a, b) => b.progress - a.progress).slice(0, 10), // Top 10
    aiConfigured: isConfigured()
  });
};

/**
 * Get monthly report for a student
 */
const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.params;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get lesson progress for the month
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        updatedAt: { gte: startDate, lte: endDate }
      },
      include: {
        lesson: {
          include: { subject: true }
        }
      }
    });

    // Get exam attempts for the month
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId,
        submittedAt: { gte: startDate, lte: endDate },
        status: 'GRADED'
      },
      include: {
        exam: {
          include: { subject: true }
        }
      }
    });

    // Get previous month data for comparison
    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);
    
    const prevLessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId,
        completedAt: { gte: prevStartDate, lte: prevEndDate }
      }
    });

    const completedThisMonth = lessonProgress.filter(lp => 
      lp.completedAt && lp.completedAt >= startDate && lp.completedAt <= endDate
    ).length;
    
    const completedPrevMonth = prevLessonProgress.filter(lp => lp.completed).length;
    
    const comparison = completedPrevMonth > 0 
      ? Math.round(((completedThisMonth - completedPrevMonth) / completedPrevMonth) * 100)
      : completedThisMonth > 0 ? 100 : 0;

    const totalWatchTime = lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0);
    const avgScore = examAttempts.length > 0
      ? Math.round(examAttempts.reduce((sum, ea) => sum + (ea.score || 0), 0) / examAttempts.length)
      : 0;

    const report = {
      month: parseInt(month),
      year: parseInt(year),
      completedLessons: completedThisMonth,
      totalLessons: lessonProgress.length,
      lessonProgress: lessonProgress.length > 0 
        ? Math.round((completedThisMonth / lessonProgress.length) * 100) 
        : 0,
      totalHours: Math.floor(totalWatchTime / 60),
      totalMinutes: totalWatchTime % 60,
      examsTaken: examAttempts.length,
      avgScore,
      comparison,
      exams: examAttempts.map(ea => ({
        name: ea.exam.name,
        subject: ea.exam.subject.name,
        score: ea.score,
        passed: ea.passed,
        date: ea.submittedAt
      })),
      lessons: lessonProgress.filter(lp => lp.completed).map(lp => ({
        name: lp.lesson.name,
        subject: lp.lesson.subject.name,
        completedAt: lp.completedAt
      }))
    };

    res.json(report);
  } catch (error) {
    console.error('Monthly Report Error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo báo cáo tháng' });
  }
};

/**
 * Get exam analysis for a specific attempt
 */
const getExamAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;

    const attempt = await prisma.examAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        exam: {
          include: {
            subject: true,
            questions: {
              include: {
                stats: true
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi' });
    }

    const answers = attempt.answers ? JSON.parse(attempt.answers) : {};
    const questions = attempt.exam.questions;

    // Analyze each question
    const questionAnalysis = questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correctAnswer;
      
      // Get difficulty from stats or calculate
      let difficulty = 'MEDIUM';
      if (q.stats) {
        const rate = q.stats.totalAttempts > 0 
          ? q.stats.correctAttempts / q.stats.totalAttempts 
          : 0.5;
        difficulty = rate > 0.8 ? 'EASY' : rate < 0.5 ? 'HARD' : 'MEDIUM';
      }

      return {
        id: q.id,
        question: q.question,
        type: q.type,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        points: q.points,
        difficulty,
        options: q.options ? JSON.parse(q.options) : null
      };
    });

    // Group by difficulty
    const byDifficulty = {
      EASY: { total: 0, correct: 0 },
      MEDIUM: { total: 0, correct: 0 },
      HARD: { total: 0, correct: 0 }
    };

    const byType = {
      MULTIPLE_CHOICE: { total: 0, correct: 0 },
      TRUE_FALSE: { total: 0, correct: 0 },
      ESSAY: { total: 0, correct: 0 }
    };

    for (const q of questionAnalysis) {
      byDifficulty[q.difficulty].total++;
      if (q.isCorrect) byDifficulty[q.difficulty].correct++;
      
      byType[q.type].total++;
      if (q.isCorrect) byType[q.type].correct++;
    }

    const analysis = {
      attempt: {
        id: attempt.id,
        score: attempt.score,
        passed: attempt.passed,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt
      },
      exam: {
        id: attempt.exam.id,
        name: attempt.exam.name,
        subject: attempt.exam.subject.name,
        duration: attempt.exam.duration,
        passingScore: attempt.exam.passingScore
      },
      summary: {
        totalQuestions: questions.length,
        correctAnswers: questionAnalysis.filter(q => q.isCorrect).length,
        maxScore: questions.reduce((sum, q) => sum + q.points, 0),
        percentage: attempt.score
      },
      byDifficulty: {
        easy: {
          ...byDifficulty.EASY,
          percent: byDifficulty.EASY.total > 0 
            ? Math.round((byDifficulty.EASY.correct / byDifficulty.EASY.total) * 100) 
            : 0
        },
        medium: {
          ...byDifficulty.MEDIUM,
          percent: byDifficulty.MEDIUM.total > 0 
            ? Math.round((byDifficulty.MEDIUM.correct / byDifficulty.MEDIUM.total) * 100) 
            : 0
        },
        hard: {
          ...byDifficulty.HARD,
          percent: byDifficulty.HARD.total > 0 
            ? Math.round((byDifficulty.HARD.correct / byDifficulty.HARD.total) * 100) 
            : 0
        }
      },
      byType,
      questions: questionAnalysis,
      wrongQuestions: questionAnalysis.filter(q => !q.isCorrect)
    };

    res.json(analysis);
  } catch (error) {
    console.error('Exam Analysis Error:', error);
    res.status(500).json({ error: 'Lỗi khi phân tích bài thi' });
  }
};

/**
 * Get subject progress report
 */
const getSubjectProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.params;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        major: true,
        lessons: {
          orderBy: { order: 'asc' }
        },
        exams: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ error: 'Không tìm thấy môn học' });
    }

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
        examId: { in: subject.exams.map(e => e.id) },
        status: 'GRADED'
      },
      orderBy: { submittedAt: 'desc' }
    });

    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    const totalWatchTime = lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0);
    
    const examScores = examAttempts.map(ea => ea.score).filter(s => s !== null);
    const avgExamScore = examScores.length > 0
      ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
      : 0;

    // Find start date
    const firstProgress = lessonProgress.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    )[0];

    // Calculate lessons per week
    const startDate = firstProgress ? new Date(firstProgress.createdAt) : new Date();
    const weeksElapsed = Math.max(1, Math.ceil((new Date() - startDate) / (7 * 24 * 60 * 60 * 1000)));
    const lessonsPerWeek = (completedLessons / weeksElapsed).toFixed(1);

    const report = {
      subject: {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        majorName: subject.major.name
      },
      progress: {
        completedLessons,
        totalLessons: subject.lessons.length,
        lessonProgress: subject.lessons.length > 0 
          ? Math.round((completedLessons / subject.lessons.length) * 100) 
          : 0,
        totalHours: Math.floor(totalWatchTime / 60),
        totalMinutes: totalWatchTime % 60
      },
      exams: {
        taken: examAttempts.length,
        total: subject.exams.length,
        avgScore: avgExamScore,
        history: examAttempts.map(ea => ({
          id: ea.id,
          examId: ea.examId,
          score: ea.score,
          passed: ea.passed,
          submittedAt: ea.submittedAt
        }))
      },
      timeline: {
        startDate: firstProgress?.createdAt || null,
        lessonsPerWeek: parseFloat(lessonsPerWeek),
        estimatedCompletion: calculateEstimatedCompletion(
          completedLessons, 
          subject.lessons.length, 
          parseFloat(lessonsPerWeek)
        )
      },
      lessons: subject.lessons.map(lesson => {
        const progress = lessonProgress.find(lp => lp.lessonId === lesson.id);
        return {
          id: lesson.id,
          name: lesson.name,
          duration: lesson.duration,
          order: lesson.order,
          completed: progress?.completed || false,
          watchTime: progress?.watchTime || 0,
          completedAt: progress?.completedAt
        };
      })
    };

    res.json(report);
  } catch (error) {
    console.error('Subject Progress Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tiến độ môn học' });
  }
};

/**
 * Get AI insights for a report
 */
const getAIAnalysis = async (req, res) => {
  try {
    const { reportType, reportData } = req.body;

    if (!reportType || !reportData) {
      return res.status(400).json({ error: 'Thiếu dữ liệu báo cáo' });
    }

    const insights = await getAIInsights(reportData, reportType);
    
    res.json({ insights });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ error: 'Lỗi khi tạo phân tích AI' });
  }
};

/**
 * Get teacher's view of a specific student
 */
const getStudentProgressForTeacher = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const studentId = req.params.id;

    // Verify teacher has access to this student
    const teacherSubjects = await prisma.subject.findMany({
      where: { teacherId },
      include: { 
        major: true,
        lessons: true,
        exams: true
      }
    });

    const majorIds = [...new Set(teacherSubjects.map(s => s.majorId))];

    // Get all enrollments of this student
    const studentEnrollments = await prisma.enrollment.findMany({
      where: {
        userId: studentId,
        majorId: { in: majorIds }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, createdAt: true }
        },
        major: true
      }
    });

    if (studentEnrollments.length === 0) {
      return res.status(403).json({ error: 'Không có quyền xem học viên này' });
    }

    const studentUser = studentEnrollments[0].user;
    const subjectIds = teacherSubjects.map(s => s.id);
    const totalLessonsInSubjects = teacherSubjects.reduce((sum, s) => sum + s.lessons.length, 0);
    
    // Get lesson progress
    const lessonProgress = await prisma.lessonProgress.findMany({
      where: {
        userId: studentId,
        lesson: { subjectId: { in: subjectIds } }
      },
      include: {
        lesson: {
          include: { subject: { include: { major: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Get exam attempts with answers
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId: studentId,
        exam: { subjectId: { in: subjectIds } },
        status: 'GRADED'
      },
      include: {
        exam: {
          include: { 
            subject: true,
            questions: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Calculate metrics
    const completedLessons = lessonProgress.filter(lp => lp.completed).length;
    const totalWatchTime = lessonProgress.reduce((sum, lp) => sum + lp.watchTime, 0);
    
    const examScores = examAttempts.map(ea => ea.score).filter(s => s !== null);
    const avgScore = examScores.length > 0
      ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
      : 0;
    
    const passedExams = examAttempts.filter(ea => ea.passed).length;
    const passRate = examAttempts.length > 0
      ? Math.round((passedExams / examAttempts.length) * 100)
      : 0;

    // Subject progress
    const subjectProgress = [];
    for (const subject of teacherSubjects) {
      const subjectLessons = lessonProgress.filter(lp => lp.lesson.subjectId === subject.id);
      const completed = subjectLessons.filter(lp => lp.completed).length;
      const total = subject.lessons.length;
      
      const lastActivity = subjectLessons.length > 0 
        ? subjectLessons.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0].updatedAt
        : null;
      
      if (total > 0) {
        subjectProgress.push({
          id: subject.id,
          name: subject.name,
          majorName: subject.major.name,
          completedLessons: completed,
          totalLessons: total,
          progress: Math.round((completed / total) * 100),
          lastActivity
        });
      }
    }

    // Exam history with details
    const examHistory = examAttempts.map(ea => {
      // Parse answers JSON to count correct
      let correctAnswers = 0;
      if (ea.answers) {
        try {
          const answersObj = JSON.parse(ea.answers);
          // Count correct answers by comparing with exam questions
          for (const question of ea.exam.questions) {
            if (answersObj[question.id] === question.correctAnswer) {
              correctAnswers++;
            }
          }
        } catch (e) {
          // If parsing fails, estimate from score
          correctAnswers = Math.round((ea.score || 0) / 100 * ea.exam.questions.length);
        }
      }
      
      // Calculate timeSpent from startedAt and submittedAt
      let timeSpent = 0;
      if (ea.startedAt && ea.submittedAt) {
        timeSpent = Math.round((new Date(ea.submittedAt) - new Date(ea.startedAt)) / 60000); // minutes
      }
      return {
        id: ea.id,
        examName: ea.exam.name,
        subjectName: ea.exam.subject.name,
        score: ea.score || 0,
        totalQuestions: ea.exam.questions.length,
        correctAnswers,
        passed: ea.passed,
        submittedAt: ea.submittedAt,
        timeSpent
      };
    });

    // Monthly progress for last 6 months
    const monthlyProgress = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthLessons = lessonProgress.filter(lp => {
        const completedAt = lp.completedAt ? new Date(lp.completedAt) : null;
        return completedAt && completedAt >= date && completedAt <= endDate;
      });

      const monthExams = examAttempts.filter(ea => {
        const submittedAt = new Date(ea.submittedAt);
        return submittedAt >= date && submittedAt <= endDate;
      });

      const monthScores = monthExams.map(ea => ea.score).filter(s => s !== null);
      const monthAvgScore = monthScores.length > 0
        ? Math.round(monthScores.reduce((a, b) => a + b, 0) / monthScores.length)
        : 0;

      const monthStudyMinutes = monthLessons.reduce((sum, lp) => sum + lp.watchTime, 0);

      monthlyProgress.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: `T${date.getMonth() + 1}/${date.getFullYear()}`,
        lessonsCompleted: monthLessons.length,
        examsTaken: monthExams.length,
        avgScore: monthAvgScore,
        studyMinutes: monthStudyMinutes
      });
    }

    // Recent activity (combined lessons and exams)
    const recentActivity = [];
    
    for (const lp of lessonProgress.slice(0, 10)) {
      if (lp.completed && lp.completedAt) {
        recentActivity.push({
          type: 'lesson',
          title: lp.lesson.name,
          subjectName: lp.lesson.subject.name,
          date: lp.completedAt
        });
      }
    }
    
    for (const ea of examAttempts.slice(0, 10)) {
      recentActivity.push({
        type: 'exam',
        title: ea.exam.name,
        subjectName: ea.exam.subject.name,
        date: ea.submittedAt,
        score: ea.score,
        passed: ea.passed
      });
    }

    // Sort by date descending
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate streak
    const streak = await calculateStreak(studentId);

    res.json({
      student: {
        ...studentUser,
        createdAt: studentUser.createdAt
      },
      enrollments: studentEnrollments.map(e => ({
        majorId: e.majorId,
        majorName: e.major.name,
        enrolledAt: e.enrolledAt || e.createdAt
      })),
      summary: {
        totalLessons: totalLessonsInSubjects,
        completedLessons,
        progress: totalLessonsInSubjects > 0 
          ? Math.round((completedLessons / totalLessonsInSubjects) * 100) 
          : 0,
        totalStudyMinutes: totalWatchTime,
        examsTaken: examAttempts.length,
        avgScore,
        passRate,
        streak
      },
      subjectProgress: subjectProgress.sort((a, b) => a.progress - b.progress),
      examHistory,
      monthlyProgress,
      recentActivity: recentActivity.slice(0, 15),
      aiConfigured: isConfigured()
    });
  } catch (error) {
    console.error('Student Progress for Teacher Error:', error);
    res.status(500).json({ error: 'Lỗi khi lấy tiến độ học viên' });
  }
};

// Helper functions

async function calculateStreak(userId) {
  const recentProgress = await prisma.lessonProgress.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 100
  });

  if (recentProgress.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const activityDates = new Set(
    recentProgress.map(p => {
      const d = new Date(p.updatedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );

  while (activityDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

async function getMonthlyProgress(userId, months) {
  const result = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    
    const completed = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        completedAt: { gte: date, lte: endDate }
      }
    });

    const exams = await prisma.examAttempt.findMany({
      where: {
        userId,
        status: 'GRADED',
        submittedAt: { gte: date, lte: endDate }
      }
    });

    const avgScore = exams.length > 0
      ? Math.round(exams.reduce((sum, e) => sum + (e.score || 0), 0) / exams.length)
      : 0;

    result.push({
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      label: `T${date.getMonth() + 1}`,
      lessonsCompleted: completed,
      examsTaken: exams.length,
      avgScore
    });
  }

  return result;
}

function calculateEstimatedCompletion(completed, total, lessonsPerWeek) {
  if (lessonsPerWeek <= 0 || completed >= total) return null;
  
  const remaining = total - completed;
  const weeksNeeded = Math.ceil(remaining / lessonsPerWeek);
  
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + (weeksNeeded * 7));
  
  return estimatedDate.toISOString();
}

module.exports = {
  getOverview,
  getMonthlyReport,
  getExamAnalysis,
  getSubjectProgress,
  getAIAnalysis,
  getStudentProgressForTeacher
};

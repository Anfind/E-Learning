const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  checkLessonPrerequisite, 
  validateWatchTime 
} = require('../utils/prerequisite');

// @desc    Start a lesson (check prerequisite)
// @route   POST /api/lessons/:id/start
// @access  Private
exports.startLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        subject: {
          select: {
            id: true,
            majorId: true,
            prerequisiteId: true
          }
        },
        prerequisite: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (!lesson.isActive) {
      return res.status(400).json({ message: 'This lesson is not available' });
    }

    // Check if user is enrolled in the major
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_majorId: {
          userId,
          majorId: lesson.subject.majorId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ 
        message: 'You must enroll in this major first',
        requiresEnrollment: true
      });
    }

    // Check prerequisite lesson completion
    if (lesson.prerequisiteId) {
      const prerequisiteCompleted = await checkLessonPrerequisite(userId, lessonId);
      
      if (!prerequisiteCompleted) {
        return res.status(403).json({
          message: `You must complete "${lesson.prerequisite.name}" first`,
          prerequisite: lesson.prerequisite,
          locked: true
        });
      }
    }

    // Check if subject has prerequisite
    if (lesson.subject.prerequisiteId) {
      const subjectCompleted = await prisma.lessonProgress.count({
        where: {
          userId,
          completed: true,
          lesson: {
            subjectId: lesson.subject.prerequisiteId
          }
        }
      });

      const totalLessonsInPrereqSubject = await prisma.lesson.count({
        where: {
          subjectId: lesson.subject.prerequisiteId,
          isActive: true
        }
      });

      if (subjectCompleted < totalLessonsInPrereqSubject) {
        return res.status(403).json({
          message: 'You must complete all lessons in the prerequisite subject first',
          locked: true
        });
      }
    }

    // Create or get existing progress
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (existingProgress) {
      return res.json({
        message: 'Continue your lesson',
        data: existingProgress
      });
    }

    const progress = await prisma.lessonProgress.create({
      data: {
        userId,
        lessonId,
        watchTime: 0,
        completed: false,
        faceVerifiedBefore: true // Mark as verified when starting lesson
      }
    });

    res.json({
      message: 'Lesson started',
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update lesson progress (watch time)
// @route   PATCH /api/lessons/:id/progress
// @access  Private
exports.updateProgress = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const { watchTime } = req.body;
    const userId = req.user.id;

    if (typeof watchTime !== 'number' || watchTime < 0) {
      return res.status(400).json({ message: 'Valid watchTime (in minutes) is required' });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Validate watch time doesn't exceed lesson duration
    if (watchTime > lesson.duration) {
      return res.status(400).json({ 
        message: `Watch time cannot exceed lesson duration (${lesson.duration} minutes)` 
      });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        watchTime,
        lastWatchedAt: new Date()
      },
      create: {
        userId,
        lessonId,
        watchTime,
        completed: false
      }
    });

    // Check if meets 2/3 completion rule
    const requiredWatchTime = validateWatchTime(watchTime, lesson.duration);
    const canComplete = requiredWatchTime;

    res.json({
      message: 'Progress updated',
      data: {
        ...progress,
        canComplete,
        requiredWatchTime: Math.ceil((lesson.duration * 2) / 3),
        percentComplete: Math.round((watchTime / lesson.duration) * 100)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a lesson (validate 2/3 watch time)
// @route   POST /api/lessons/:id/complete
// @access  Private
exports.completeLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    });

    if (!progress) {
      return res.status(400).json({ message: 'You must start this lesson first' });
    }

    if (progress.completed) {
      return res.json({
        message: 'Lesson already completed',
        data: progress
      });
    }

    // Validate 2/3 watch time rule
    const meetsRequirement = validateWatchTime(progress.watchTime, lesson.duration);

    if (!meetsRequirement) {
      const requiredTime = Math.ceil((lesson.duration * 2) / 3);
      return res.status(400).json({
        message: `You must watch at least ${requiredTime} minutes (2/3 of ${lesson.duration} minutes) to complete this lesson`,
        current: progress.watchTime,
        required: requiredTime
      });
    }

    // Check face verification after 2/3
    if (!progress.faceVerifiedAfter) {
      return res.status(400).json({
        message: 'You must verify your face after watching 2/3 of the lesson before completing',
        requiresFaceVerification: true
      });
    }

    // Mark as completed
    const updatedProgress = await prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    res.json({
      message: 'Lesson completed! 🎉',
      data: updatedProgress
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark face verified after watching 2/3 of lesson
// @route   POST /api/progress/lessons/:id/verify-after
// @access  Private
exports.verifyAfterLesson = async (req, res, next) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      include: {
        lesson: {
          select: {
            duration: true
          }
        }
      }
    });

    if (!progress) {
      return res.status(404).json({ 
        message: 'Lesson progress not found. You must start this lesson first.' 
      });
    }

    // Check if watched at least 2/3
    const requiredTime = Math.ceil((progress.lesson.duration * 2) / 3);
    if (progress.watchTime < requiredTime) {
      return res.status(400).json({
        message: `You must watch at least ${requiredTime} minutes before verifying`,
        current: progress.watchTime,
        required: requiredTime
      });
    }

    // Update face verification status
    const updated = await prisma.lessonProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      data: {
        faceVerifiedAfter: true
      }
    });

    res.json({
      message: 'Face verified successfully after 2/3 watch time',
      data: updated
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get user's lesson progress
// @route   GET /api/progress/lessons
// @access  Private
exports.getMyLessonProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { subjectId } = req.query;

    const where = { userId };
    if (subjectId) {
      where.lesson = { subjectId };
    }

    const progress = await prisma.lessonProgress.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true,
            name: true,
            duration: true,
            subjectId: true,
            subject: {
              select: {
                id: true,
                name: true,
                majorId: true
              }
            }
          }
        }
      },
      orderBy: {
        lastWatchedAt: 'desc'
      }
    });

    // Add progress percentage to each item
    const progressWithPercentage = progress.map(p => ({
      ...p,
      percentComplete: Math.round((p.watchTime / p.lesson.duration) * 100),
      requiredWatchTime: Math.ceil((p.lesson.duration * 2) / 3)
    }));

    res.json({
      data: progressWithPercentage
    });
  } catch (error) {
    next(error);
  }
};

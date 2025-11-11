const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Kiểm tra xem user đã hoàn thành prerequisite subject chưa
 */
const checkSubjectPrerequisite = async (userId, subjectId) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      prerequisite: true,
      lessons: {
        include: {
          progress: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!subject) {
    throw new Error('Môn học không tồn tại');
  }

  // Nếu không có prerequisite thì OK
  if (!subject.prerequisiteId) {
    return true;
  }

  // Kiểm tra xem user đã hoàn thành tất cả bài học của prerequisite chưa
  const prerequisiteLessons = await prisma.lesson.findMany({
    where: { subjectId: subject.prerequisiteId },
    include: {
      progress: {
        where: { 
          userId,
          completed: true
        }
      }
    }
  });

  const totalLessons = prerequisiteLessons.length;
  const completedLessons = prerequisiteLessons.filter(l => l.progress.length > 0).length;

  if (completedLessons < totalLessons) {
    throw new Error(`Bạn cần hoàn thành môn học "${subject.prerequisite.name}" trước`);
  }

  return true;
};

/**
 * Kiểm tra xem user đã hoàn thành prerequisite lesson chưa
 */
const checkLessonPrerequisite = async (userId, lessonId) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      prerequisite: true
    }
  });

  if (!lesson) {
    throw new Error('Bài học không tồn tại');
  }

  // Nếu không có prerequisite thì OK
  if (!lesson.prerequisiteId) {
    return true;
  }

  // Kiểm tra xem user đã hoàn thành prerequisite lesson chưa
  const progress = await prisma.lessonProgress.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId: lesson.prerequisiteId
      }
    }
  });

  if (!progress || !progress.completed) {
    throw new Error(`Bạn cần hoàn thành bài học "${lesson.prerequisite.name}" trước`);
  }

  return true;
};

/**
 * Kiểm tra xem user có đủ điều kiện làm exam không
 * (Phải hoàn thành tất cả lessons trong subject trước exam đó)
 */
const checkExamEligibility = async (userId, examId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      subject: {
        include: {
          lessons: {
            include: {
              progress: {
                where: { userId }
              }
            }
          }
        }
      }
    }
  });

  if (!exam) {
    throw new Error('Bài thi không tồn tại');
  }

  const lessons = exam.subject.lessons;
  const completedCount = lessons.filter(l => 
    l.progress.length > 0 && l.progress[0].completed
  ).length;

  if (completedCount < lessons.length) {
    throw new Error('Bạn cần hoàn thành tất cả bài học trong môn này trước khi thi');
  }

  return true;
};

/**
 * Kiểm tra 2/3 thời gian xem video
 */
const validateWatchTime = (watchTime, duration) => {
  const requiredTime = Math.ceil((duration * 2) / 3);
  return watchTime >= requiredTime;
};

module.exports = {
  checkSubjectPrerequisite,
  checkLessonPrerequisite,
  checkExamEligibility,
  validateWatchTime
};

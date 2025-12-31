/**
 * Seed script to add realistic exam attempt data for Learning Analytics feature
 * Run after main seed.js to populate exam attempts with detailed answers
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAnalyticsData() {
  console.log('🎯 Seeding Learning Analytics demo data...\n');

  try {
    // Get existing students
    const students = await prisma.user.findMany({
      where: { role: 'USER', status: 'ACTIVE' },
      take: 20
    });

    // Get existing exams with questions
    const exams = await prisma.exam.findMany({
      include: {
        questions: true,
        subject: true
      },
      take: 10
    });

    if (students.length === 0 || exams.length === 0) {
      console.log('❌ No students or exams found. Run main seed.js first.');
      return;
    }

    console.log(`Found ${students.length} students and ${exams.length} exams`);

    // Clear existing exam attempts to recreate with detailed answers
    await prisma.examAttempt.deleteMany({});
    console.log('✓ Cleared existing exam attempts');

    let attemptCount = 0;

    // Create realistic exam attempts for students
    for (let i = 0; i < Math.min(15, students.length); i++) {
      const student = students[i];
      
      // Each student takes 2-5 exams
      const numExams = 2 + Math.floor(Math.random() * 4);
      const studentExams = shuffleArray([...exams]).slice(0, numExams);

      for (const exam of studentExams) {
        if (exam.questions.length === 0) continue;

        // Generate answers for each question
        const answers = {};
        let correctCount = 0;

        for (const eq of exam.questions) {
          const question = eq; // ExamQuestion includes question data directly
          let userAnswer = '';
          let isCorrect = false;

          if (question.type === 'MULTIPLE_CHOICE') {
            // Simulate student answering - 70% chance of correct for easy, 50% medium, 30% hard
            const difficulty = 'MEDIUM'; // Default if not specified
            const correctChance = 0.55;
            
            isCorrect = Math.random() < correctChance;
            
            if (isCorrect) {
              userAnswer = question.correctAnswer;
            } else {
              // Pick a random wrong answer from options
              const options = JSON.parse(question.options || '["A", "B", "C", "D"]');
              const wrongOptions = options.filter(o => o !== question.correctAnswer);
              userAnswer = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] || 'A';
            }
          } else if (question.type === 'TRUE_FALSE') {
            isCorrect = Math.random() < 0.6;
            userAnswer = isCorrect ? question.correctAnswer : (question.correctAnswer === 'true' ? 'false' : 'true');
          } else if (question.type === 'ESSAY') {
            // Essay - random scoring
            isCorrect = Math.random() < 0.5;
            userAnswer = 'Student essay answer here...';
          }

          answers[eq.id] = userAnswer; // Use question ID
          if (isCorrect) correctCount++;
        }

        const totalQuestions = exam.questions.length;
        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= exam.passingScore;

        // Random date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const startTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        const submitTime = new Date(startTime.getTime() + (15 + Math.random() * 45) * 60 * 1000);

        await prisma.examAttempt.create({
          data: {
            userId: student.id,
            examId: exam.id,
            answers: JSON.stringify(answers),
            score,
            passed,
            faceVerifiedStart: true,
            startedAt: startTime,
            submittedAt: submitTime
          }
        });

        attemptCount++;
      }
      
      if ((i + 1) % 5 === 0) {
        console.log(`  ✓ Created attempts for ${i + 1} students...`);
      }
    }

    console.log(`\n✓ Created ${attemptCount} detailed exam attempts`);

    // Create more lesson progress for analytics
    console.log('\n📚 Creating additional lesson progress...');

    const lessons = await prisma.lesson.findMany({ take: 30 });
    let progressCount = 0;

    for (let i = 0; i < Math.min(15, students.length); i++) {
      const student = students[i];
      
      // Each student completes 5-15 lessons
      const numLessons = 5 + Math.floor(Math.random() * 11);
      const studentLessons = shuffleArray([...lessons]).slice(0, numLessons);

      for (let j = 0; j < studentLessons.length; j++) {
        const lesson = studentLessons[j];
        
        // Check if progress already exists
        const existing = await prisma.lessonProgress.findFirst({
          where: {
            userId: student.id,
            lessonId: lesson.id
          }
        });

        if (existing) continue;

        const isCompleted = j < numLessons - 2; // Last 2 are in progress
        const daysAgo = Math.floor(Math.random() * 30);
        const completedAt = isCompleted 
          ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          : null;

        await prisma.lessonProgress.create({
          data: {
            userId: student.id,
            lessonId: lesson.id,
            watchTime: isCompleted ? 1800 + Math.floor(Math.random() * 1200) : 300 + Math.floor(Math.random() * 600),
            completed: isCompleted,
            faceVerifiedBefore: true,
            faceVerifiedAfter: isCompleted,
            createdAt: completedAt || new Date()
          }
        });

        progressCount++;
      }
    }

    console.log(`✓ Created ${progressCount} lesson progress records`);

    // Summary
    console.log('\n✅ Learning Analytics seed completed!');
    console.log('   You can now test the analytics features with real data.');

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

seedAnalyticsData();

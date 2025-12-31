/**
 * Groq AI Client for Learning Analytics
 * Provides AI-powered insights for learning progress
 */

const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

// Check if API key is configured
const isConfigured = () => {
  return !!process.env.GROQ_API_KEY;
};

/**
 * Get AI insights for learning reports
 * @param {Object} reportData - The report data to analyze
 * @param {string} reportType - Type of report: 'monthly' | 'exam' | 'subject' | 'overview'
 * @returns {Promise<string>} AI-generated insights in Vietnamese
 */
async function getAIInsights(reportData, reportType) {
  if (!isConfigured()) {
    return 'AI insights chưa được cấu hình. Vui lòng thêm GROQ_API_KEY vào file .env';
  }

  const prompts = {
    monthly: `Phân tích báo cáo học tập tháng ${reportData.month}/${reportData.year} của học viên:

Dữ liệu:
- Bài học hoàn thành: ${reportData.completedLessons}/${reportData.totalLessons} (${reportData.lessonProgress}%)
- Thời gian học: ${reportData.totalHours}h ${reportData.totalMinutes}m
- Bài thi đã làm: ${reportData.examsTaken}, Điểm TB: ${reportData.avgScore}%
- So với tháng trước: ${reportData.comparison > 0 ? '+' : ''}${reportData.comparison}%

Yêu cầu:
1. Đánh giá tổng quan tiến độ (1-2 câu)
2. Nhận xét điểm mạnh (1-2 điểm)
3. Chỉ ra điểm cần cải thiện (1-2 điểm)
4. Đề xuất mục tiêu tháng tới (cụ thể, đo lường được)
5. Tips học tập phù hợp

Trả lời ngắn gọn, súc tích, khuyến khích học viên. Dùng emoji phù hợp.`,

    exam: `Phân tích kết quả bài thi "${reportData.examName}":

Kết quả:
- Điểm: ${reportData.score}/${reportData.maxScore} (${reportData.percentage}%)
- Kết quả: ${reportData.passed ? 'ĐẬU' : 'CHƯA ĐẬU'}
- Câu đúng: ${reportData.correctAnswers}/${reportData.totalQuestions}
- Phân tích theo độ khó:
  + Dễ: ${reportData.easyCorrect}/${reportData.easyTotal} (${reportData.easyPercent}%)
  + Trung bình: ${reportData.mediumCorrect}/${reportData.mediumTotal} (${reportData.mediumPercent}%)
  + Khó: ${reportData.hardCorrect}/${reportData.hardTotal} (${reportData.hardPercent}%)

Yêu cầu:
1. Đánh giá kết quả tổng quan (1 câu)
2. Phân tích điểm yếu cụ thể dựa trên độ khó
3. Đề xuất 2-3 chủ đề cần ôn lại
4. Chiến lược cải thiện cho lần thi sau

Trả lời ngắn gọn, súc tích. Dùng emoji phù hợp.`,

    subject: `Đánh giá tiến độ học môn "${reportData.subjectName}":

Dữ liệu:
- Tiến độ bài học: ${reportData.completedLessons}/${reportData.totalLessons} (${reportData.lessonProgress}%)
- Bài thi đã làm: ${reportData.examsTaken}/${reportData.totalExams}
- Điểm TB bài thi: ${reportData.avgExamScore}%
- Thời gian học: ${reportData.totalHours}h ${reportData.totalMinutes}m
- Ngày bắt đầu: ${reportData.startDate}
- Tốc độ học: ${reportData.lessonsPerWeek} bài/tuần

Yêu cầu:
1. Đánh giá tiến độ tổng quan
2. Dự đoán thời gian hoàn thành môn học
3. Nhận xét điểm mạnh/yếu
4. Gợi ý tối ưu lộ trình học

Trả lời ngắn gọn, súc tích. Dùng emoji phù hợp.`,

    overview: `Phân tích tổng quan học tập của học viên:

Dữ liệu:
- Ngành đang học: ${reportData.enrolledMajors} ngành
- Tổng bài học hoàn thành: ${reportData.totalCompletedLessons}
- Tổng thời gian học: ${reportData.totalStudyHours}h
- Điểm TB tất cả bài thi: ${reportData.overallAvgScore}%
- Streak học tập: ${reportData.currentStreak} ngày liên tục
- Môn học tốt nhất: ${reportData.bestSubject}
- Môn cần cải thiện: ${reportData.weakestSubject}

Yêu cầu:
1. Đánh giá tổng quan (2-3 câu)
2. Điểm mạnh nổi bật
3. Lĩnh vực cần tập trung cải thiện
4. Lời khuyên cá nhân hóa

Trả lời động viên, khích lệ học viên. Dùng emoji phù hợp.`,

    teacher_overview: `Phân tích tiến độ học tập của lớp do giáo viên phụ trách:

Dữ liệu:
- Tổng số học viên: ${reportData.totalStudents}
- Số môn phụ trách: ${reportData.totalSubjects}
- Học viên hoạt động: ${reportData.activeStudents} (${reportData.activePercent}%)
- Tiến độ TB của lớp: ${reportData.avgProgress}%
- Điểm TB bài thi: ${reportData.avgExamScore}%
- Học viên xuất sắc: ${reportData.topStudents}
- Học viên cần hỗ trợ: ${reportData.needSupportStudents}

Yêu cầu:
1. Đánh giá tổng quan lớp học
2. Nhận xét về tình hình chung
3. Gợi ý hành động cho giáo viên
4. Học viên cần quan tâm đặc biệt

Trả lời chuyên nghiệp, mang tính hành động. Dùng emoji phù hợp.`
  };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý giáo dục thông minh LearnHub AI, chuyên phân tích dữ liệu học tập và đưa ra gợi ý cải thiện bằng tiếng Việt. Trả lời ngắn gọn, súc tích, và khuyến khích người học."
        },
        {
          role: "user",
          content: prompts[reportType] || prompts.overview
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    });

    return completion.choices[0]?.message?.content || 'Không thể tạo phân tích AI.';
  } catch (error) {
    console.error('Groq API Error:', error);
    return `Lỗi khi gọi AI: ${error.message}`;
  }
}

/**
 * Generate quick tips based on learning data
 * @param {Object} data - Learning metrics
 * @returns {Promise<string[]>} Array of tips
 */
async function getQuickTips(data) {
  if (!isConfigured()) {
    return [
      '💡 Hãy học đều đặn mỗi ngày để duy trì streak!',
      '📚 Xem lại các bài học trước khi làm bài thi',
      '⏰ Đặt mục tiêu nhỏ và hoàn thành từng bước'
    ];
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Bạn là trợ lý học tập. Đưa ra 3 tips ngắn gọn (mỗi tip 1 dòng, bắt đầu bằng emoji) dựa trên dữ liệu học tập."
        },
        {
          role: "user",
          content: `Dữ liệu: Tiến độ ${data.progress}%, Điểm TB ${data.avgScore}%, Streak ${data.streak} ngày. Cho 3 tips cải thiện.`
        }
      ],
      temperature: 0.8,
      max_tokens: 256
    });

    const content = completion.choices[0]?.message?.content || '';
    return content.split('\n').filter(line => line.trim()).slice(0, 3);
  } catch (error) {
    console.error('Groq Quick Tips Error:', error);
    return [
      '💡 Hãy học đều đặn mỗi ngày!',
      '📚 Ôn tập thường xuyên',
      '🎯 Đặt mục tiêu cụ thể'
    ];
  }
}

module.exports = {
  getAIInsights,
  getQuickTips,
  isConfigured
};

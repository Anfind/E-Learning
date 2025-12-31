# 📊 Learning Analytics System - Implementation Plan

## 🎯 Mục tiêu
Xây dựng hệ thống phân tích kết quả học tập cá nhân với AI insights (Groq API) để:
- Theo dõi tiến độ học tập theo tháng
- Phân tích chi tiết kết quả bài thi
- Đánh giá theo môn học
- Đưa ra gợi ý cải thiện từ AI

---

## 📋 Phân Tích Yêu Cầu Chi Tiết

### 1. Báo Cáo Cá Nhân (Monthly Personal Report)
**Dữ liệu cần thu thập:**
- Số bài học đã hoàn thành trong tháng
- Tổng thời gian học (watchTime từ LessonProgress)
- Số bài thi đã làm và điểm số
- So sánh với tháng trước (% tăng/giảm)
- Streak học tập (số ngày liên tục học)

**Metrics hiển thị:**
```
📅 Tháng 12/2025
├── 📚 Bài học: 15/20 hoàn thành (75%)
├── ⏱️ Thời gian học: 24h 30m
├── 📝 Bài thi: 5 completed, TB 78%
├── 🔥 Streak: 12 ngày liên tục
└── 📈 So với tháng trước: +15% tiến độ
```

**AI Analysis (Groq):**
- Phân tích xu hướng học tập
- Nhận diện pattern (học vào thời gian nào, môn nào học tốt)
- Đề xuất cải thiện cụ thể

---

### 2. Báo Cáo Theo Bài Thi (Exam Analysis Report)

**Dữ liệu từ ExamAttempt:**
- `answers`: JSON chứa câu trả lời của user
- `score`: Điểm đạt được
- `passed`: Đậu/rớt

**Dữ liệu từ ExamQuestion:**
- `type`: MULTIPLE_CHOICE | TRUE_FALSE | ESSAY
- `correctAnswer`: Đáp án đúng
- `points`: Điểm của câu

**Phân loại câu hỏi theo độ khó (dựa trên tỉ lệ đúng của TẤT CẢ users):**
```
🟢 Dễ (Easy):     > 80% users trả lời đúng
🟡 Trung bình:    50-80% users trả lời đúng  
🔴 Khó (Hard):    < 50% users trả lời đúng
```

**Report cho từng lần thi:**
```
📝 Bài thi: "Kiểm tra giữa kỳ - Lập trình cơ bản"
├── 🎯 Điểm: 75/100 (PASSED)
├── ✅ Câu đúng: 15/20 (75%)
├── ❌ Câu sai: 5/20
│
├── 📊 Phân tích theo độ khó:
│   ├── 🟢 Dễ: 8/8 (100%) ✓
│   ├── 🟡 Trung bình: 5/7 (71%)
│   └── 🔴 Khó: 2/5 (40%) ⚠️
│
├── 📊 Phân tích theo loại câu:
│   ├── Multiple Choice: 12/15 (80%)
│   ├── True/False: 2/3 (67%)
│   └── Essay: 1/2 (50%)
│
└── 🔍 Câu sai cần review:
    ├── Câu 5: "Vòng lặp while..." (Khó)
    ├── Câu 12: "Biến static..." (Trung bình)
    └── ...
```

**AI Analysis:**
- Nhận diện điểm yếu theo chủ đề
- So sánh với các lần thi trước
- Đề xuất bài học cần ôn lại

---

### 3. Báo Cáo Theo Môn Học (Subject Progress Report)

**Metrics:**
```
📚 Môn: "Lập trình cơ bản"
├── 📖 Tiến độ bài học: 12/15 (80%)
│   ├── ✅ Hoàn thành: 12 bài
│   ├── 🔄 Đang học: 1 bài
│   └── 🔒 Chưa mở: 2 bài
│
├── 📝 Bài thi: 2/3 hoàn thành
│   ├── Quiz 1: 85% ✓
│   ├── Quiz 2: 72% ✓
│   └── Final: Chưa thi
│
├── ⏱️ Thời gian học: 8h 45m
├── 📅 Ngày bắt đầu: 15/11/2025
├── 📅 Dự kiến hoàn thành: 15/01/2026
│
└── 🎯 Đánh giá tổng quan:
    ├── Điểm TB bài thi: 78.5%
    ├── Tốc độ học: 2.5 bài/tuần
    └── Xếp loại: Khá
```

**AI Insights:**
- Dự đoán thời gian hoàn thành
- So sánh với trung bình lớp
- Gợi ý tối ưu lộ trình học

---

## 🏗️ Kiến Trúc Hệ Thống

### Database Schema Updates (nếu cần)
```prisma
// Có thể cần thêm để cache reports
model LearningReport {
  id          String   @id @default(uuid())
  userId      String
  type        ReportType // MONTHLY | EXAM | SUBJECT
  period      String?    // "2025-12" for monthly
  referenceId String?    // examId or subjectId
  data        String     @db.LongText // JSON report data
  aiInsights  String?    @db.LongText // AI analysis
  
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  
  @@index([userId, type, period])
}

// Thêm để track question difficulty
model QuestionStats {
  id              String @id @default(uuid())
  examQuestionId  String @unique
  totalAttempts   Int    @default(0)
  correctAttempts Int    @default(0)
  difficultyLevel String // EASY | MEDIUM | HARD
  
  @@map("question_stats")
}
```

### Backend API Endpoints

```
GET  /api/analytics/monthly/:year/:month
     → Báo cáo cá nhân theo tháng

GET  /api/analytics/exam/:attemptId
     → Phân tích chi tiết 1 lần thi

GET  /api/analytics/subject/:subjectId
     → Báo cáo tiến độ môn học

GET  /api/analytics/overview
     → Tổng quan dashboard

POST /api/analytics/ai-insights
     → Gọi Groq API để lấy AI insights
```

### Frontend Pages

```
/dashboard/analytics
├── /monthly          → Báo cáo theo tháng
├── /exams            → Lịch sử & phân tích bài thi
├── /subjects         → Tiến độ từng môn
└── /insights         → AI recommendations
```

---

## 🤖 Groq API Integration

### Setup
```javascript
// backend/utils/groqClient.js
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function getAIInsights(reportData, reportType) {
  const prompts = {
    monthly: `Phân tích báo cáo học tập tháng này của học viên...`,
    exam: `Phân tích kết quả bài thi này và đưa ra gợi ý...`,
    subject: `Đánh giá tiến độ học môn này và dự đoán...`
  };
  
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Bạn là trợ lý giáo dục thông minh, phân tích dữ liệu học tập và đưa ra gợi ý cải thiện bằng tiếng Việt."
      },
      {
        role: "user",
        content: `${prompts[reportType]}\n\nDữ liệu:\n${JSON.stringify(reportData, null, 2)}`
      }
    ],
    temperature: 0.7,
    max_tokens: 1024
  });
  
  return completion.choices[0].message.content;
}
```

### AI Prompt Templates

**Monthly Report:**
```
Phân tích báo cáo học tập tháng {month}/{year} của học viên:

Dữ liệu:
- Bài học hoàn thành: {completed}/{total}
- Thời gian học: {hours}h {minutes}m
- Điểm TB bài thi: {avgScore}%
- So với tháng trước: {comparison}%

Yêu cầu:
1. Đánh giá tổng quan tiến độ (1-2 câu)
2. Nhận xét điểm mạnh (1-2 điểm)
3. Chỉ ra điểm cần cải thiện (1-2 điểm)
4. Đề xuất mục tiêu tháng tới (cụ thể, đo lường được)
5. Tips học tập phù hợp

Trả lời ngắn gọn, súc tích, khuyến khích học viên.
```

**Exam Analysis:**
```
Phân tích kết quả bài thi "{examName}":

Kết quả:
- Điểm: {score}/{maxScore} ({percentage}%)
- Câu đúng theo độ khó: Easy {easyCorrect}%, Medium {mediumCorrect}%, Hard {hardCorrect}%
- Các chủ đề sai nhiều: {weakTopics}

Yêu cầu:
1. Đánh giá kết quả (1 câu)
2. Phân tích điểm yếu cụ thể
3. Đề xuất 3 bài học cần ôn lại
4. Chiến lược cải thiện cho lần thi sau
```

---

## 📱 UI/UX Design

### Dashboard Analytics Overview
```
┌────────────────────────────────────────────────────┐
│  📊 Learning Analytics Dashboard                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │ 📚 45   │ │ ⏱️ 32h  │ │ 📝 78%  │ │ 🔥 15   │  │
│  │ Lessons │ │ Learned │ │ Avg     │ │ Streak  │  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  📈 Learning Progress (Last 6 months)        │ │
│  │  [====LINE CHART====]                        │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────┐  ┌──────────────────────┐  │
│  │ 📝 Recent Exams  │  │ 🤖 AI Insights       │  │
│  │ ┌──────────────┐ │  │ "Bạn đang học tốt   │  │
│  │ │ Quiz 1: 85%  │ │  │  môn Lập trình. Nên │  │
│  │ │ Quiz 2: 72%  │ │  │  tập trung hơn vào  │  │
│  │ │ Midterm: 78% │ │  │  phần CTDL..."      │  │
│  │ └──────────────┘ │  │                      │  │
│  └──────────────────┘  └──────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
backend/
├── controllers/
│   └── analyticsController.js    # NEW
├── routes/
│   └── analytics.js              # NEW
├── utils/
│   └── groqClient.js             # NEW
└── prisma/
    └── schema.prisma             # UPDATE (add QuestionStats, LearningReport)

frontend/src/
├── app/
│   └── dashboard/
│       └── analytics/
│           ├── page.tsx          # Overview
│           ├── monthly/
│           │   └── page.tsx      # Monthly report
│           ├── exams/
│           │   ├── page.tsx      # Exam history
│           │   └── [id]/
│           │       └── page.tsx  # Exam detail analysis
│           └── subjects/
│               ├── page.tsx      # All subjects progress
│               └── [id]/
│                   └── page.tsx  # Subject detail
├── components/
│   └── analytics/
│       ├── OverviewCard.tsx
│       ├── MonthlyChart.tsx
│       ├── ExamAnalysis.tsx
│       ├── SubjectProgress.tsx
│       ├── AIInsightCard.tsx
│       └── DifficultyBadge.tsx
└── lib/
    └── analytics.ts              # API calls
```

---

## 🔄 Implementation Phases

### Phase 1: Backend Foundation (2-3 days)
1. Update Prisma schema (QuestionStats)
2. Create analyticsController.js
3. Create analytics routes
4. Setup Groq client

### Phase 2: Core Analytics APIs (3-4 days)
1. Monthly report endpoint
2. Exam analysis endpoint
3. Subject progress endpoint
4. Question difficulty calculation

### Phase 3: AI Integration (2-3 days)
1. Groq API integration
2. Prompt engineering
3. Caching AI responses
4. Rate limiting

### Phase 4: Frontend UI (4-5 days)
1. Analytics dashboard overview
2. Monthly report page
3. Exam analysis page
4. Subject progress page
5. Charts & visualizations

### Phase 5: Polish & Testing (2 days)
1. Error handling
2. Loading states
3. Responsive design
4. Performance optimization

---

## 🔧 Tech Stack

- **Backend:** Node.js, Express, Prisma
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Frontend:** Next.js 14, React, TailwindCSS
- **Charts:** Recharts / Chart.js
- **UI Components:** shadcn/ui

---

## 📝 Notes

- Emotion detection sẽ implement sau (đã note trong enhance.txt)
- Cần seed thêm data ExamAttempt với answers để test
- Cache AI responses 24h để tiết kiệm API calls
- Rate limit: Max 10 AI requests/user/day

---

*Created: December 31, 2025*
*Last Updated: December 31, 2025*

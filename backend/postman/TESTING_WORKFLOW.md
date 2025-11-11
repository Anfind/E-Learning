# 🧪 Hướng Dẫn Testing Workflow - Learning Platform

## 📋 Tổng Quan
File này hướng dẫn thứ tự test các API endpoints để đảm bảo tất cả các test chạy thành công với seed data có sẵn.

---

## 🔐 **Phase 1: Authentication (Bắt Buộc Đầu Tiên)**

### 1.1 Login Admin
```
POST /api/auth/login
Body: {
  "email": "admin@learnhub.com",
  "password": "admin123"
}
```
✅ **Test Script tự động lưu**: `ADMIN_TOKEN`, `ADMIN_ID`

### 1.2 Login User (Student)
```
POST /api/auth/login
Body: {
  "email": "student@example.com",
  "password": "123456"
}
```
✅ **Test Script tự động lưu**: `USER_TOKEN`, `USER_ID`

### 1.3 Verify Login
- **Get Current User** - Kiểm tra user token
- **Get Current User** (với ADMIN_TOKEN) - Kiểm tra admin token

---

## 🎓 **Phase 2: Explore Learning Content (Dùng User Account)**

### 2.1 List Majors
```
GET /api/majors
```
✅ **Test Script tự động lưu**: 
- `TEST_MAJOR_ID` → "Công nghệ thông tin"
- `TEST_MAJOR_ID_2` → "Toán học"

### 2.2 Get Major Detail
```
GET /api/majors/{{TEST_MAJOR_ID}}
```
✅ **Test Script tự động lưu**: 
- `TEST_SUBJECT_ID` → "Lập trình cơ bản"
- `TEST_SUBJECT_ID_2` → "Cấu trúc dữ liệu và giải thuật"

### 2.3 Get Subject Detail
```
GET /api/subjects/{{TEST_SUBJECT_ID}}
```
✅ **Test Script tự động lưu**: 
- `TEST_LESSON_ID` → "Giới thiệu về lập trình"
- `TEST_LESSON_ID_2` → "Biến và kiểu dữ liệu"
- `TEST_LESSON_ID_3` → "Cấu trúc điều khiển"
- `TEST_EXAM_ID` → "Kiểm tra giữa kỳ"

---

## 📚 **Phase 3: Enrollment & Learning Flow**

### 3.1 Check Current Enrollments
```
GET /api/enrollments/my
```
⚠️ **Lưu ý**: `student@example.com` đã có enrollment trong seed data

### 3.2 Enroll in Major (Nếu chưa có)
```
POST /api/enrollments
Body: {
  "majorId": "{{TEST_MAJOR_ID}}"
}
```
✅ **Test Script tự động lưu**: `TEST_ENROLLMENT_ID`

⚠️ **Nếu đã enrolled**: Bỏ qua bước này hoặc dùng `student2@example.com` để test

### 3.3 Start Lesson
```
POST /api/progress/lessons/{{TEST_LESSON_ID}}/start
```
✅ **Test Script tự động lưu**: `TEST_PROGRESS_ID`

### 3.4 Update Watch Time
```
PATCH /api/progress/lessons/{{TEST_LESSON_ID}}/progress
Body: {
  "watchTime": 30
}
```

### 3.5 Complete Lesson
```
POST /api/progress/lessons/{{TEST_LESSON_ID}}/complete
```

### 3.6 Get My Progress
```
GET /api/progress/my
```

---

## 📝 **Phase 4: Exam Taking**

### 4.1 Start Exam Attempt
```
POST /api/exams/{{TEST_EXAM_ID}}/start
```
✅ **Test Script tự động lưu**: `ATTEMPT_ID`

### 4.2 Get Exam Questions
```
GET /api/exams/{{TEST_EXAM_ID}}/attempt/{{ATTEMPT_ID}}
```
📝 **Manual**: Copy question IDs từ response để answer

### 4.3 Submit Exam
```
POST /api/exams/{{TEST_EXAM_ID}}/submit
Body: {
  "attemptId": "{{ATTEMPT_ID}}",
  "answers": {
    "question-id-1": "option-1",
    "question-id-2": "option-2"
  }
}
```
✅ **Test Script tự động lưu**: `TEST_EXAM_RESULT_ID`

### 4.4 Get My Results
```
GET /api/exams/my-results
```

---

## 💬 **Phase 5: Community Features**

### 5.1 Create Blog Post
```
POST /api/blog
Body: {
  "title": "Những tips học lập trình hiệu quả cho người mới",
  "content": "Chia sẻ kinh nghiệm học lập trình...",
  "excerpt": "Kinh nghiệm học lập trình từ zero to hero",
  "tags": ["javascript", "python", "learning", "beginner"]
}
```
✅ **Test Script tự động lưu**: `TEST_BLOG_ID`

### 5.2 List Blog Posts
```
GET /api/blog
```

### 5.3 Ask Question
```
POST /api/questions
Body: {
  "title": "Sự khác biệt giữa let và var trong JavaScript là gì?",
  "content": "Mình đang học JavaScript...",
  "tags": ["javascript"]
}
```
✅ **Test Script tự động lưu**: `TEST_QUESTION_ID`

### 5.4 Post Answer
```
POST /api/questions/{{TEST_QUESTION_ID}}/answers
Body: {
  "content": "Sự khác biệt chính:\n1. Scope: var là function-scoped..."
}
```
✅ **Test Script tự động lưu**: `TEST_ANSWER_ID`

### 5.5 Vote Answer
```
POST /api/questions/{{TEST_QUESTION_ID}}/answers/{{TEST_ANSWER_ID}}/vote
Body: {
  "voteType": "UPVOTE"
}
```

---

## 👥 **Phase 6: Admin Operations (Dùng Admin Account)**

### 6.1 List All Users
```
GET /api/users?page=1&limit=20
Header: Authorization: Bearer {{ADMIN_TOKEN}}
```

### 6.2 Get Pending Users
```
GET /api/users/pending
Header: Authorization: Bearer {{ADMIN_TOKEN}}
```

### 6.3 Approve User
```
PATCH /api/users/{{PENDING_USER_ID}}/approve
Header: Authorization: Bearer {{ADMIN_TOKEN}}
```

### 6.4 Admin Dashboard Stats
```
GET /api/admin/stats
Header: Authorization: Bearer {{ADMIN_TOKEN}}
```

### 6.5 Generate Reports
```
GET /api/admin/reports/users?format=csv
Header: Authorization: Bearer {{ADMIN_TOKEN}}
```

---

## 💡 **Lưu Ý Quan Trọng**

### ✅ Prerequisites (Điều Kiện Tiên Quyết)

1. **Lesson Prerequisites**:
   - Phải hoàn thành Lesson 1 trước khi start Lesson 2
   - Phải hoàn thành Lesson 2 trước khi start Lesson 3

2. **Enrollment**:
   - Phải enroll vào major trước khi start lesson
   - `student@example.com` đã enrolled trong seed data

3. **Exam**:
   - Phải có enrollment hợp lệ
   - Chỉ được một attempt đang active

### 🔄 Auto-Save Variables

Các biến sau được **tự động lưu** bởi test scripts:

| Variable | Saved By | Used By |
|----------|----------|---------|
| `ADMIN_TOKEN` | Login Admin | Tất cả admin endpoints |
| `USER_TOKEN` | Login User | Tất cả user endpoints |
| `ADMIN_ID` | Login Admin | - |
| `USER_ID` | Login User | - |
| `TEST_MAJOR_ID` | List Majors | Enroll, Get Detail |
| `TEST_MAJOR_ID_2` | List Majors | Testing |
| `TEST_SUBJECT_ID` | Get Major Detail | Get Subject Detail |
| `TEST_SUBJECT_ID_2` | Get Major Detail | Testing |
| `TEST_LESSON_ID` | Get Subject Detail | Start/Complete Lesson |
| `TEST_LESSON_ID_2` | Get Subject Detail | Testing prerequisites |
| `TEST_LESSON_ID_3` | Get Subject Detail | Testing prerequisites |
| `TEST_EXAM_ID` | Get Subject Detail | Start/Submit Exam |
| `TEST_ENROLLMENT_ID` | Enroll in Major | - |
| `TEST_BLOG_ID` | Create Blog Post | Edit/Delete Blog |
| `TEST_QUESTION_ID` | Ask Question | Post Answer |
| `TEST_ANSWER_ID` | Post Answer | Vote, Accept Answer |
| `TEST_PROGRESS_ID` | Start Lesson | - |
| `TEST_EXAM_RESULT_ID` | Submit Exam | - |
| `ATTEMPT_ID` | Start Exam | Submit Exam |

### 📝 Manual Variables

Cần set manually trong environment:

- `API_URL`: `http://localhost:8000/api`
- `STREAM_API_KEY`: `4hwp5qfn4cqs`
- `STREAM_API_SECRET`: `mfevq6gm565482...`

### 🎯 Testing Accounts

```javascript
// Admin Account
{
  "email": "admin@learnhub.com",
  "password": "admin123",
  "role": "ADMIN",
  "status": "ACTIVE"
}

// Student Account 1 (Đã enrolled, completed lesson 1)
{
  "email": "student@example.com",
  "password": "123456",
  "role": "USER",
  "status": "ACTIVE"
}

// Student Account 2 (Chưa enrolled)
{
  "email": "student2@example.com",
  "password": "123456",
  "role": "USER",
  "status": "APPROVED"
}

// Pending Account
{
  "email": "pending@example.com",
  "password": "123456",
  "role": "USER",
  "status": "PENDING"
}
```

---

## 🚀 Quick Start Testing Flow

```
1. Login Admin → ADMIN_TOKEN saved
2. Login User → USER_TOKEN saved
3. List Majors → Major IDs saved
4. Get Major Detail → Subject IDs saved
5. Get Subject Detail → Lesson IDs + Exam ID saved
6. Start Lesson → Progress ID saved
7. Complete Lesson
8. Start Exam → Attempt ID saved
9. Submit Exam → Result ID saved
10. Create Blog Post → Blog ID saved
11. Ask Question → Question ID saved
12. Post Answer → Answer ID saved
```

---

## 🐛 Troubleshooting

### ❌ "Không có quyền truy cập"
- ✅ Check: Đã login admin/user chưa?
- ✅ Check: Token có được lưu vào environment variable không?
- ✅ Check: Request có dùng đúng token type không? (ADMIN_TOKEN vs USER_TOKEN)

### ❌ "Prerequisite not met"
- ✅ Check: Đã hoàn thành lesson trước chưa?
- ✅ Check: Đã enrolled vào major chưa?

### ❌ "Already enrolled"
- ✅ Solution: Dùng account khác (`student2@example.com`)
- ✅ Hoặc: Xóa enrollment trong database và seed lại

### ❌ Variable không được lưu
- ✅ Check: Response status code có phải 200/201 không?
- ✅ Check: Tab "Tests" có script không?
- ✅ Check: Console có hiện message "✅ ... saved" không?

---

## 📊 Expected Test Results

Sau khi chạy full flow, bạn sẽ có:

```
✅ 2 tokens (ADMIN_TOKEN, USER_TOKEN)
✅ 2 major IDs
✅ 2 subject IDs  
✅ 3 lesson IDs
✅ 1 exam ID
✅ 1 enrollment ID
✅ 1 progress record
✅ 1 exam result
✅ 1 blog post
✅ 1 Q&A with answer
```

---

**Happy Testing! 🎉**

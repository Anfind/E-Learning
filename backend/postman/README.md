# 🚀 Postman Collection - Quick Start Guide

## 📥 Import vào Postman

### Bước 1: Import Collection
1. Mở Postman
2. Click **Import** button (góc trên bên trái)
3. Chọn file: `Learning_Platform.postman_collection.json`
4. Click **Import**

### Bước 2: Import Environment
1. Click icon ⚙️ (Settings) → **Environments**
2. Click **Import**
3. Chọn file: `Learning_Platform_Local.postman_environment.json`
4. Click **Import**
5. Chọn environment **"Learning Platform - Local"** từ dropdown (góc trên bên phải)

---

## ⚡ QUAN TRỌNG: Login Trước Khi Test

### 🔐 Login là bước BẮT BUỘC đầu tiên!

**Trước khi test bất kỳ endpoint nào, bạn PHẢI login để lấy token:**

#### 1️⃣ Test Admin Endpoints → Login Admin trước
```
📂 1. Authentication
  └── 🔑 Login Admin
      Email: admin@learnhub.com
      Password: admin123
```
✅ **Test script tự động lưu**: `ADMIN_TOKEN`, `ADMIN_ID`

#### 2️⃣ Test User Endpoints → Login User trước  
```
📂 1. Authentication
  └── 🔑 Login User
      Email: student@example.com
      Password: 123456
```
✅ **Test script tự động lưu**: `USER_TOKEN`, `USER_ID`

### ⚠️ Lỗi Thường Gặp

❌ **"Không có quyền truy cập"** hoặc **"Unauthorized"**
```
Nguyên nhân: Chưa login hoặc token hết hạn
Giải pháp: 
  1. Chạy "Login Admin" hoặc "Login User" 
  2. Check tab "Tests" có console log "✅ ... logged in successfully"
  3. Check Environment có variable ADMIN_TOKEN hoặc USER_TOKEN được set
```

❌ **"List Users" báo không có quyền**
```
Nguyên nhân: Request dùng ADMIN_TOKEN nhưng chưa login admin
Giải pháp: Chạy "Login Admin" trước
```

---

## 🧪 Testing Flow Gợi Ý

### 📖 Chi tiết đầy đủ: Xem file `TESTING_WORKFLOW.md`

### Flow 1: Khởi động nhanh (Quick Start)

**1. Start Backend:**
```bash
cd backend
npm install
npm run dev
```

**2. Test theo thứ tự:**

```
✅ BẮT BUỘC: Login trước!
   ├── Login Admin → ADMIN_TOKEN saved
   └── Login User → USER_TOKEN saved

✅ Explore Content:
   ├── List Majors → TEST_MAJOR_ID saved
   ├── Get Major Detail → TEST_SUBJECT_ID saved
   └── Get Subject Detail → TEST_LESSON_ID, TEST_EXAM_ID saved

✅ Start Learning:
   ├── Enroll in Major → TEST_ENROLLMENT_ID saved
   ├── Start Lesson → TEST_PROGRESS_ID saved
   ├── Complete Lesson
   └── Get My Progress
```

---

### Flow 2: Admin Testing Flow

**Test các tính năng admin:**

```
1. Authentication → Login Admin

2. User Management
   ├── List Users
   ├── Get Pending Users
   ├── Approve User
   └── Update User Status

3. Admin Statistics
   ├── Overview Stats
   ├── User Stats
   └── Learning Stats

4. Admin Reports
   ├── Export User Report (JSON)
   └── Export User Report (CSV)
```

---

### Flow 3: Complete Learning Flow

**Test cả quy trình học từ đầu đến cuối:**

```
1. Register User → Login Admin → Approve → Login User
2. Browse Majors → Get Major Detail
3. Enroll in Major
4. Get Subject Detail
5. Start Lesson → Update Watch Time → Complete Lesson
6. Start Exam → Submit Exam → Get Result
7. Dashboard Overview (check progress)
```

---

### Flow 4: Community Features

```
1. Blog
   ├── Create Blog Post
   ├── List Blog Posts
   └── Add Comment

2. Q&A
   ├── Ask Question
   ├── List Questions
   ├── Post Answer
   └── Accept Answer
```

---

### Flow 5: Stream Chat

```
1. Generate Token (save STREAM_TOKEN)
2. Create Direct Message
3. Get User Channels
4. Create Subject Channel
```

---

## 🎯 Auto-save Variables

Collection tự động save các variables sau mỗi request:

| Request Type | Auto-saved Variable | Dùng ở đâu |
|-------------|-------------------|-----------|
| Login Admin | `ADMIN_TOKEN`, `ADMIN_ID` | Admin endpoints |
| Login User | `USER_TOKEN`, `USER_ID` | User endpoints |
| List Majors | `TEST_MAJOR_ID` | Enrollment, Progress |
| Get Major Detail | `TEST_SUBJECT_ID` | Subject-related |
| Get Subject Detail | `TEST_LESSON_ID`, `TEST_EXAM_ID` | Learning, Exam |
| Start Exam | `ATTEMPT_ID`, `EXAM_ANSWERS` | Submit Exam |
| Create Blog | `TEST_BLOG_ID` | Comments |
| Ask Question | `TEST_QUESTION_ID` | Answers |
| Generate Chat Token | `STREAM_TOKEN` | Stream Chat |

---

## 📝 Default Test Accounts (sau khi seed)

**Admin:**
```
Email: admin@learnhub.com
Password: admin123
```

**User (Active):**
```
Email: student@example.com
Password: 123456
```

**User 2 (Approved):**
```
Email: student2@example.com
Password: 123456
```

**User 3 (Pending - cần approve):**
```
Email: pending@example.com
Password: 123456
```

---

## ✅ Validation Tests

Mỗi request có built-in tests:

```javascript
✓ Response time < 2000ms
✓ Status code is successful
✓ Response structure correct
✓ Auto-save tokens and IDs
```

---

## 🔧 Troubleshooting

### Backend chưa chạy
```bash
cd backend
npm run dev
```

### Database chưa migrate
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### Token expired
- Re-run **Login Admin** hoặc **Login User**
- Token tự động refresh trong environment

### Variables không save
- Check Console log (View → Show Postman Console)
- Ensure environment được chọn đúng

---

## 🎨 Postman Tips

### 1. Run toàn bộ folder
- Right-click folder → **Run folder**
- Xem kết quả tổng hợp

### 2. Xem Console log
- **View → Show Postman Console** (Alt+Ctrl+C)
- Xem auto-saved variables

### 3. Quick test API
- Chọn request → Click **Send**
- Không cần manual copy token (auto-save rồi)

### 4. Export results
- Runner → Run collection → **Export Results**

---

## 📊 Testing Checklist

### ✅ Phase 1: Authentication
- [ ] Register user
- [ ] Login admin
- [ ] Login user
- [ ] Get current user
- [ ] Logout

### ✅ Phase 2: User Management
- [ ] List users
- [ ] Approve user
- [ ] Update status

### ✅ Phase 3: Learning Flow
- [ ] Browse majors
- [ ] Enroll in major
- [ ] Start lesson
- [ ] Complete lesson
- [ ] View dashboard

### ✅ Phase 4: Exam Flow
- [ ] Start exam
- [ ] Submit exam
- [ ] Get result

### ✅ Phase 5: Community
- [ ] Create blog post
- [ ] Add comment
- [ ] Ask question
- [ ] Post answer

### ✅ Phase 6: Chat
- [ ] Generate token
- [ ] Create DM
- [ ] Create subject channel

### ✅ Phase 7: Admin Stats
- [ ] Overview stats
- [ ] User stats
- [ ] Export reports

---

## 🚀 Next Steps

1. ✅ Import collection & environment vào Postman
2. ✅ Start backend server (`npm run dev`)
3. ✅ Run **Login Admin** để test connection
4. ✅ Follow suggested flow để test từng feature
5. ✅ Check Console để xem auto-saved variables
6. 🎯 Sẵn sàng cho Phase 7: Face Recognition!

---

**Happy Testing! 🎉**

Có bất kỳ issue gì với Postman collection, báo mình nhé! 😊

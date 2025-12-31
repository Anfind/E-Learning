
# Di chuyển vào thư mục backend
cd c:\An\E-Learning\backend

# 1. Generate Prisma Client
npx prisma generate

# 2. Migrate database (tạo tables)
npx prisma migrate dev

# 3. Seed dữ liệu mẫu
npx prisma db seed
# hoặc
npm run prisma:seed

# 4. Reset database (xóa hết + migrate + seed lại)
npx prisma migrate reset

# 5. Mở Prisma Studio (GUI xem database)
npx prisma studio
# hoặc
npm run prisma:studio

# 📚 Database Reset & Seed Guide

## 🔄 Prisma Commands Explained

### 1. `npx prisma migrate dev`
- **Mục đích**: Tạo migration mới khi bạn thay đổi schema
- **Khi nào dùng**: Sau khi sửa file `schema.prisma`
- **Làm gì**:
  - Tạo SQL migration file
  - Apply migration vào database
  - Generate Prisma Client
  - Tự động chạy seed (nếu có)

### 2. `npx prisma migrate reset`
- **Mục đích**: Reset toàn bộ database và seed lại
- **Khi nào dùng**: Muốn xóa hết data và bắt đầu lại
- **Làm gì**:
  - ⚠️ **XÓA HẾT** data trong database
  - Chạy lại TẤT CẢ migrations từ đầu
  - Tự động chạy seed script
  - Generate Prisma Client

### 3. `npx prisma db push`
- **Mục đích**: Sync schema vào DB mà không tạo migration file
- **Khi nào dùng**: Development/prototyping, không muốn tạo migration
- **Làm gì**:
  - Push schema changes trực tiếp vào DB
  - KHÔNG tạo migration history
  - Không chạy seed tự động

### 4. `npx prisma generate`
- **Mục đích**: Generate Prisma Client từ schema
- **Khi nào dùng**: Sau khi sửa schema nhưng chưa muốn migrate
- **Làm gì**:
  - Chỉ generate TypeScript types
  - Không touch database

### 5. `npm run prisma:seed`
- **Mục đích**: Chỉ chạy seed script (trong package.json)
- **Khi nào dùng**: Muốn add thêm data mà không reset DB
- **Làm gì**:
  - Chạy file seed.js
  - Database phải đã có schema

---

## 🚀 Reset & Test Database

### Bước 1: Reset database
```bash
cd backend
npx prisma migrate reset
```

**Output mong đợi:**
```
⚠️  We are about to reset your database...
✔ Are you sure? … yes

✅ Seeding completed successfully!

📊 Database Summary:
  ✓ 8 users (1 admin + 7 students)
  ✓ 6 majors (IT, Math, Data Science, Design, Business, Software Engineering)
  ✓ 15 enrollments (users enrolled in various majors)
  ✓ 10 subjects with 40 lessons
  ✓ 4 exams with 60 questions
  ✓ 12 blog posts from various users
  ✓ 12 tags
  ✓ 10 Q&A questions with answers

📝 Demo accounts (all passwords: 123456):
  👑 Admin: admin@learnhub.com / admin123
  👤 User1: student@example.com (ACTIVE, enrolled: IT + Data Science)
  👤 User2: student2@example.com (APPROVED, enrolled: Math + Design)
  ...
```

### Bước 2: Start backend server
```bash
# Ở thư mục backend
npm start
```

### Bước 3: Start frontend (terminal mới)
```bash
cd frontend
npm run dev
```

### Bước 4: Test các tính năng

---

## 🧪 Testing Checklist

### ✅ 1. Chat Friend Suggestions
- [ ] Truy cập: http://localhost:3000/chat
- [ ] Login với `student@example.com / 123456`
- [ ] Kiểm tra "Gợi ý kết bạn"
- [ ] Xem các users có **major badges** (IT, Data Science)
- [ ] User1 sẽ thấy User4, User6 (cùng enrolled IT)
- [ ] User1 sẽ thấy User5, User6 (cùng enrolled Data Science)

**Expected**: Hiện danh sách users với badges ngành học, icon GraduationCap

---

### ✅ 2. Q&A Filtering by Major → Subject
- [ ] Truy cập: http://localhost:3000/qa
- [ ] Thấy dropdown **"Chọn ngành"**
- [ ] Chọn ngành (e.g., "Công nghệ thông tin")
- [ ] Dropdown **"Chọn môn"** sẽ hiện các subjects của ngành đó
- [ ] Chọn subject → Questions sẽ filter theo subject
- [ ] Click vào 1 question → Detail page load được

**Expected**: Cascade filtering hoạt động, không có lỗi "Cannot read properties of undefined"

---

### ✅ 3. Blog Posts
- [ ] Truy cập: http://localhost:3000/blog
- [ ] Thấy 12 blog posts từ nhiều users khác nhau
- [ ] Mỗi post có tags (JavaScript, React, Python, Docker, etc.)
- [ ] Filter bằng tags
- [ ] View count tăng khi click vào post

**Expected**: Hiển thị blog posts đa dạng nội dung và tác giả

---

### ✅ 4. Q&A Questions & Answers
- [ ] Truy cập: http://localhost:3000/qa
- [ ] Thấy 10 questions với statuses khác nhau
- [ ] Click vào question có accepted answer (Question 1, 4, 5, 9)
- [ ] Accepted answer hiện **màu xanh** hoặc **checkmark**
- [ ] Question 7, 10 chưa có answer
- [ ] Question 8 có 2 answers nhưng chưa accept

**Expected**: Answers được sort theo isAccepted (accepted answer lên đầu)

---

## 👥 Test Accounts

| Email | Password | Role | Status | Majors |
|-------|----------|------|--------|--------|
| admin@learnhub.com | admin123 | ADMIN | ACTIVE | - |
| student@example.com | 123456 | STUDENT | ACTIVE | IT, Data Science |
| student2@example.com | 123456 | STUDENT | APPROVED | Math, Design |
| pending@example.com | 123456 | STUDENT | PENDING | IT |
| user4@example.com | 123456 | STUDENT | ACTIVE | IT, Software Engineering |
| user5@example.com | 123456 | STUDENT | ACTIVE | Data Science, Business |
| user6@example.com | 123456 | STUDENT | ACTIVE | IT, Data Science |
| user7@example.com | 123456 | STUDENT | ACTIVE | Design, Business |
| user8@example.com | 123456 | STUDENT | ACTIVE | Math, Software Engineering |

---

## 🎯 Chat Friend Suggestions - Expected Results

**Login as User1** (IT + Data Science):
```
Gợi ý kết bạn (5)

👤 Phạm Minh D
   🎓 Công nghệ thông tin  🎓 Kỹ thuật phần mềm

👤 Hoàng Thu E  
   🎓 Data Science  🎓 Quản trị kinh doanh

👤 Vũ Hải F
   🎓 Công nghệ thông tin  🎓 Data Science
```

**Login as User5** (Data Science + Business):
```
Gợi ý kết bạn (4)

👤 Nguyễn Văn A (User1)
   🎓 Công nghệ thông tin  🎓 Data Science

👤 Vũ Hải F (User6)
   🎓 Công nghệ thông tin  🎓 Data Science
   
👤 Đỗ Lan G (User7)
   🎓 Thiết kế đồ họa  🎓 Quản trị kinh doanh
```

---

## 🔧 Troubleshooting

### ❌ Seed fails với lỗi "Unique constraint"
```bash
# Reset lại từ đầu
npx prisma migrate reset --force
```

### ❌ "Prisma Client not found"
```bash
npx prisma generate
```

### ❌ Chat suggestions không hiện
- Check backend logs
- Kiểm tra `/api/users/suggestions` endpoint
- Verify users có enrollments

### ❌ Q&A detail page lỗi
- Check browser console
- Verify backend controller đã sửa `lesson.name` (không phải `lesson.title`)
- Verify đã remove `acceptedAnswer` include

---

## 📝 Notes

1. **Major badges** hiện tối đa 2 majors, còn lại hiện "+N"
2. **Accepted answers** luôn hiện đầu tiên (sorted by `isAccepted: 'desc'`)
3. **Enrollments** tạo nhiều overlap để test chat suggestions tốt hơn
4. **Blog posts** đa dạng topics: Programming, DevOps, Design, Data Science
5. **Questions** có 3 trạng thái: có accepted answer, có answers chưa accept, chưa có answer

---

## 🎉 Success!

Nếu tất cả checklist pass → Database đã được seed thành công!

Bạn có thể:
- Test tất cả features
- Tạo thêm users/posts/questions
- Debug với realistic data
- Demo app cho người khác

Good luck! 🚀

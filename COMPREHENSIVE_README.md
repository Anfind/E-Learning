# 🎓 AI-Powered Learning Platform with Face Recognition

## 📋 Mục lục
- [Giới thiệu](#giới-thiệu)
- [Tech Stack](#tech-stack)
- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Tính năng chính](#tính-năng-chính)
- [Cài đặt và Chạy](#cài-đặt-và-chạy)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)
- [Face Recognition Flow](#face-recognition-flow)

---

## 🌟 Giới thiệu

Hệ thống học tập trực tuyến tích hợp **AI Face Recognition** để xác thực danh tính người học trong quá trình học bài và làm bài thi, đảm bảo tính minh bạch và công bằng.

### Đặc điểm nổi bật:
- ✅ Xác thực khuôn mặt khi bắt đầu/kết thúc bài học
- ✅ Xác thực khuôn mặt trước khi làm bài thi
- ✅ Hệ thống quản lý học liệu (Major → Subject → Lesson → Exam)
- ✅ Theo dõi tiến độ học tập chi tiết
- ✅ Dashboard thống kê cho Admin/Teacher/Student
- ✅ Real-time chat (Stream Chat API)
- ✅ Blog hỏi đáp với markdown editor

---

## 🚀 Tech Stack

### **Backend**
| Technology | Version | Mục đích |
|-----------|---------|----------|
| Node.js | 18+ | Runtime environment |
| Express.js | 4.21.1 | Web framework |
| Prisma ORM | 5.22.0 | Database ORM |
| MySQL | 8.0+ | Database |
| JWT | 9.0.2 | Authentication |
| face-api.js | 1.7.15 | Face detection (Backend) |
| TensorFlow.js | 4.22.0 | Face recognition models |
| Canvas | 3.2.0 | Image processing |
| Multer | 1.4.5 | File upload |
| Sharp | 0.33.5 | Image optimization |
| Stream Chat | 8.40.0 | Real-time messaging |

### **Frontend**
| Technology | Version | Mục đích |
|-----------|---------|----------|
| Next.js | 16.0.1 | React framework (App Router) |
| React | 19.2.0 | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | Latest | UI components |
| MediaPipe | 0.10.22 | Face detection (Frontend) |
| react-webcam | 7.2.0 | Camera access |
| Lucide React | 0.553.0 | Icons |
| Sonner | 2.0.7 | Toast notifications |

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  MediaPipe   │  │ react-webcam │     │
│  │  App Router  │  │Face Detection│  │   Camera     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                    HTTPS (REST API + FormData)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth         │  │ Face API     │  │ Controllers  │     │
│  │ Middleware   │  │ (face-api.js)│  │ (Business)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Prisma ORM   │  │ File Storage │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                         MySQL Database
                              │
┌─────────────────────────────────────────────────────────────┐
│                         DATABASE                             │
│  Users, Majors, Subjects, Lessons, Exams, Progress, etc.   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Tính năng chính

### 1️⃣ **Quản lý người dùng**
- Đăng ký tài khoản với approval workflow
- Đăng ký khuôn mặt (Face Registration)
- Phân quyền: Admin, Teacher, Student
- Quản lý trạng thái: PENDING → APPROVED → ACTIVE/DEACTIVE

### 2️⃣ **Face Recognition System**
**Frontend (MediaPipe):**
- Detect face real-time từ webcam
- Auto-capture khi detect stable face
- Quality checks (brightness, sharpness)
- Crop face với padding 30%

**Backend (face-api.js):**
- TinyFaceDetector model (fast detection)
- FaceNet model (128D embeddings)
- Similarity matching (Euclidean distance < 0.49)
- Store embeddings trong MySQL

### 3️⃣ **Học tập (Learning Flow)**
```
Major (Ngành học)
  └─ Subject (Môn học) [có prerequisite]
      └─ Lesson (Bài học) [video + face verification]
          └─ Exam (Bài thi) [questions + face verification]
```

**Lesson Flow:**
1. User click "Bắt đầu học"
2. Face verification #1 (before)
3. Watch video (track progress 2/3)
4. Face verification #2 (after watching 2/3)
5. Complete lesson → unlock next lesson

**Exam Flow:**
1. User click "Bắt đầu làm bài"
2. Face verification
3. Start timer + load questions
4. Answer questions (multiple choice, true/false, essay)
5. Submit → auto grade → show results

### 4️⃣ **Dashboard & Reports**
- **Student:** Progress tracking, grades, upcoming exams
- **Teacher:** Class management, grade students, reports
- **Admin:** User management, system statistics, content moderation

### 5️⃣ **Blog & Q&A**
- Markdown editor cho bài viết
- Tag system
- Comments & Answers
- Vote system (upvote/downvote)

---

## 📦 Cài đặt và Chạy

### **Prerequisites**
```bash
Node.js >= 18.0.0
MySQL >= 8.0
npm hoặc yarn
Git
```

### **1. Clone Repository**
```bash
git clone https://github.com/LofizDev/AI-Powered-Face-Detection-for-Online-Examination-Security.git
cd v3
```

### **2. Setup Backend**

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Chỉnh sửa .env
DATABASE_URL="mysql://root:password@localhost:3306/learning_platform"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=8000

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (tạo admin user và sample data)
npm run prisma:seed

# Start development server
npm run dev
```

**Backend sẽ chạy tại:** `http://localhost:8000`

### **3. Setup Frontend**

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Chỉnh sửa .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8000

# Start development server
npm run dev
```

**Frontend sẽ chạy tại:** `http://localhost:3000`

### **4. Truy cập ứng dụng**

**Admin Account (sau khi seed):**
```
Email: admin@example.com
Password: admin123
```

**Test Accounts:**
```
Student: student@example.com / student123
Teacher: teacher@example.com / teacher123
```

---

## 📁 Cấu trúc dự án

### **Backend Structure**
```
backend/
├── controllers/          # Business logic
│   ├── authController.js
│   ├── faceController.js
│   ├── lessonController.js
│   ├── examController.js
│   └── ...
├── middleware/           # Auth, upload, error handling
├── models/              # (Sử dụng Prisma thay vì models riêng)
├── routes/              # API routes
│   ├── auth.js
│   ├── face.js
│   ├── lessons.js
│   └── ...
├── utils/               # Helper functions
│   ├── faceRecognition.js  # Core face recognition logic
│   └── ...
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.js          # Seed data
├── uploads/             # File storage
│   ├── faces/          # Face images
│   ├── avatars/        # User avatars
│   └── ...
└── server.js            # Entry point
```

### **Frontend Structure**
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── lessons/[id]/      # Lesson detail page
│   │   ├── exams/[id]/        # Exam taking page
│   │   ├── admin/             # Admin pages
│   │   └── ...
│   ├── components/
│   │   ├── face/              # Face recognition components
│   │   │   ├── FaceVerificationCamera.tsx
│   │   │   └── FaceVerificationModal.tsx
│   │   ├── layout/            # Layout components
│   │   ├── ui/                # shadcn/ui components
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx    # Auth state management
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript types
└── public/                    # Static files
```

---

## 🔌 API Documentation

### **Authentication**
```http
POST /api/auth/register          # Đăng ký
POST /api/auth/login             # Đăng nhập
POST /api/auth/logout            # Đăng xuất
GET  /api/auth/me                # Get current user
```

### **Face Recognition**
```http
POST   /api/face/register        # Đăng ký khuôn mặt
POST   /api/face/verify          # Xác thực khuôn mặt
DELETE /api/face                 # Xóa face data
GET    /api/face/check           # Kiểm tra đã đăng ký chưa
```

### **Learning**
```http
GET  /api/majors                 # Danh sách ngành học
GET  /api/subjects               # Danh sách môn học
GET  /api/lessons/:id            # Chi tiết bài học
POST /api/lessons/:id/start      # Bắt đầu học
POST /api/lessons/:id/complete   # Hoàn thành bài học
```

### **Exams**
```http
GET  /api/exams/:id              # Chi tiết bài thi
POST /api/exams/:id/start        # Bắt đầu làm bài
POST /api/exams/:id/submit       # Nộp bài
GET  /api/exams/:id/result/:attemptId  # Xem kết quả
```

### **Admin**
```http
GET    /api/users                # Danh sách users
PATCH  /api/users/:id/approve    # Duyệt user
PATCH  /api/users/:id/status     # Khóa/Mở khóa user
GET    /api/admin/stats          # Thống kê hệ thống
```

**Chi tiết API:** Xem file `backend/API_ENDPOINTS.md`

---

## 🔐 Face Recognition Flow

### **1. Face Registration (Đăng ký khuôn mặt)**

```
Frontend (MediaPipe)                    Backend (face-api.js)
     │                                         │
     ├─ 1. Open camera                         │
     ├─ 2. Detect face real-time               │
     ├─ 3. Quality checks:                     │
     │    • Brightness >= 45                   │
     │    • Sharpness >= 55                    │
     │    • Confidence >= 0.65                 │
     │    • Stable frames >= 100               │
     ├─ 4. Crop face (30% padding)             │
     ├─ 5. Capture image (JPEG 95%)            │
     │                                         │
     ├─ 6. POST /face/register ──────────────>│
     │      FormData: { image, userId }        │
     │                                         │
     │                         ┌───────────────┤
     │                         │ 7. Validate   │
     │                         │ 8. Detect face│
     │                         │    (TinyFace) │
     │                         │ 9. Extract    │
     │                         │    embedding  │
     │                         │    (128D)     │
     │                         │ 10. Store in  │
     │                         │     MySQL     │
     │                         └───────────────┤
     │<────── { success: true } ───────────────┤
     │                                         │
     ├─ 11. Show success message               │
     └─ 12. Redirect to dashboard              │
```

### **2. Face Verification (Xác thực)**

```
Frontend                                Backend
     │                                         │
     ├─ 1. User clicks "Bắt đầu học/thi"       │
     ├─ 2. Open camera modal                   │
     ├─ 3. Auto-capture với MediaPipe          │
     ├─ 4. Crop face                           │
     │                                         │
     ├─ 5. POST /face/verify ─────────────────>│
     │      FormData: { image, userId }        │
     │                                         │
     │                         ┌───────────────┤
     │                         │ 6. Load user  │
     │                         │    embedding  │
     │                         │ 7. Detect face│
     │                         │ 8. Extract new│
     │                         │    embedding  │
     │                         │ 9. Calculate  │
     │                         │    distance   │
     │                         │ 10. Compare   │
     │                         │     < 0.49?   │
     │                         └───────────────┤
     │<────── { match: true/false } ───────────┤
     │                                         │
     ├─ 11. If match: allow access             │
     └─ 12. If not: show error                 │
```

### **3. Technical Details**

**Frontend Detection (MediaPipe FaceLandmarker):**
- Model: `face_landmarker.task` (lightweight)
- Running mode: VIDEO (real-time)
- Delegate: GPU (hardware acceleration)
- Precision: float16 (optimal performance)

**Backend Detection (face-api.js):**
- Detector: TinyFaceDetector
  - Input size: 416px
  - Score threshold: 0.3
- Recognition: FaceNet
  - Output: 128D embedding vector
  - Distance metric: Euclidean
  - Threshold: 0.4899 (stricter = more secure)

**Image Processing:**
- Format: JPEG
- Quality: 95%
- Max size: 5MB
- Crop: Face + 30% padding
- Preprocessing: Grayscale, histogram equalization

---

## 🎨 UI/UX Enhancements

### **Design System**
- **Color scheme:** Blue-Purple gradient theme
- **Animations:** Tailwind animate-in utilities
- **Components:** shadcn/ui (Radix UI + Tailwind)
- **Icons:** Lucide React + Emoji
- **Dark mode:** Full support với next-themes

### **Key Features**
- ✨ Smooth animations (fade-in, slide-in, zoom-in)
- 🎨 Gradient backgrounds và borders
- 🔔 Toast notifications (Sonner)
- 📱 Fully responsive
- ⚡ Loading states với spinners
- 🎯 Hover effects trên tất cả buttons
- 📊 Progress bars với gradients

---

## 🧪 Testing

### **Backend Testing**
```bash
# Test face recognition flow
node backend/utils/test-face-flow.js

# Check embeddings
node backend/check-embeddings.js

# Postman collections
backend/postman/
```

### **Frontend Testing**
```bash
# Build production
npm run build

# Start production server
npm start
```

---

## 🔧 Troubleshooting

### **Common Issues**

**1. Face detection không hoạt động:**
- ✅ Kiểm tra camera permissions
- ✅ Đảm bảo HTTPS hoặc localhost
- ✅ Kiểm tra MediaPipe models đã load

**2. Backend errors:**
- ✅ Kiểm tra MySQL đang chạy
- ✅ Kiểm tra DATABASE_URL trong .env
- ✅ Run `prisma migrate dev`

**3. JWT errors:**
- ✅ Kiểm tra JWT_SECRET đã set
- ✅ Clear localStorage và login lại

**4. Face recognition sai:**
- ✅ Đăng ký lại với ảnh rõ hơn
- ✅ Kiểm tra lighting khi chụp
- ✅ Adjust threshold nếu cần

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [face-api.js GitHub](https://github.com/vladmandic/face-api)
- [MediaPipe Face Detection](https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 👥 Contributors

- **LofizDev** - Initial work

---

## 📝 License

MIT License - see LICENSE file for details

---

## 🚀 Deployment

### **Backend Deployment (Railway/Render)**
```bash
# Set environment variables
DATABASE_URL=mysql://...
JWT_SECRET=...
PORT=8000

# Build command
npm install && npx prisma generate && npx prisma migrate deploy

# Start command
npm start
```

### **Frontend Deployment (Vercel)**
```bash
# Environment variables
NEXT_PUBLIC_API_URL=https://your-backend.com/api
NEXT_PUBLIC_UPLOAD_URL=https://your-backend.com

# Vercel will auto-detect Next.js
```

---

**📧 Support:** [Create an issue](https://github.com/LofizDev/AI-Powered-Face-Detection-for-Online-Examination-Security/issues)

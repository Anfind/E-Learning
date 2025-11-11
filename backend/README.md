# Learning Platform Backend

Backend API cho hệ thống học tập trực tuyến với tích hợp nhận diện khuôn mặt.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer
- **Face Recognition**: (Coming soon)

## 📁 Project Structure

```
backend/
├── controllers/        # Request handlers
├── middleware/         # Auth, upload, validation
├── prisma/            # Database schema & migrations
│   ├── schema.prisma
│   └── seed.js
├── routes/            # API endpoints
├── utils/             # Helper functions
├── uploads/           # Uploaded files
├── .env              # Environment variables
├── server.js         # Entry point
└── package.json
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
copy .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/learning_platform"
JWT_SECRET="your-secret-key"
PORT=8000
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

npx prisma migrate reset --force


### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server will run on `http://localhost:8000`

## 📊 Database Schema

### Main Tables:
- **User**: Accounts with approval workflow
- **Major**: Ngành học (e.g., IT, Math)
- **Subject**: Môn học with prerequisites
- **Lesson**: Bài học with watch time tracking
- **Exam**: Bài thi with questions
- **LessonProgress**: Track user learning
- **ExamAttempt**: Track exam results
- **BlogPost**: Community blog
- **Question/Answer**: Q&A system with tags

## 🔑 Demo Accounts

| Email | Password | Role | Status |
|-------|----------|------|--------|
| admin@learnhub.com | admin123 | ADMIN | ACTIVE |
| student@example.com | 123456 | USER | ACTIVE |
| student2@example.com | 123456 | USER | APPROVED |
| pending@example.com | 123456 | USER | PENDING |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register (upload face image)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `PATCH /api/admin/users/:id/approve` - Approve user
- `PATCH /api/admin/users/:id/status` - Active/Deactive

### Learning
- `GET /api/majors` - List majors
- `GET /api/subjects` - List subjects
- `GET /api/lessons/:id` - Lesson detail
- `POST /api/lessons/:id/progress` - Update watch time

### Exams
- `POST /api/exams/:id/start` - Start exam
- `POST /api/exams/:id/submit` - Submit answers

### Community
- `GET /api/blog` - Blog posts
- `GET /api/questions` - Q&A list
- `POST /api/questions` - Ask question

## 🔄 Development Workflow

### 1. Make Schema Changes

Edit `prisma/schema.prisma`:
```prisma
model NewModel {
  id   String @id @default(uuid())
  name String
}
```

### 2. Create Migration

```bash
npx prisma migrate dev --name add_new_model
```

### 3. View Database

```bash
npm run prisma:studio
```

Opens Prisma Studio at `http://localhost:5555`

## ✅ Completed Features

- [x] User authentication (register, login)
- [x] User approval workflow
- [x] Basic API structure
- [x] Database schema design
- [x] Prerequisite logic utilities

## 🚧 TODO

- [ ] Admin CRUD APIs (Majors, Subjects, Lessons, Exams)
- [ ] User learning flow APIs
- [ ] Exam taking & grading
- [ ] Blog & Q&A APIs
- [ ] Statistics dashboard
- [ ] Stream Chat integration
- [ ] Face recognition integration

## 📝 Notes

- Face recognition features will be implemented last
- Stream Chat for messaging will be added after core features
- Use Postman/Thunder Client for API testing

## 🤝 Contributing

This is a private learning project.

## 📄 License

MIT

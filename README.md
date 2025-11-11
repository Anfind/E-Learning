# 🚀 Hướng dẫn chạy dự án Learning Platform

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.x
- **npm** hoặc **yarn**
- **MySQL**: >= 8.0
- **Git**

---

## 🔧 Setup Backend

### 1. Cài đặt dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend`:

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/learning_platform"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=8000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"

# Stream Chat (Optional - for chat feature)
STREAM_API_KEY="your_stream_api_key"
STREAM_API_SECRET="your_stream_api_secret"
```

### 3. Setup Database

```bash
# Tạo database
npx prisma db push

# Seed data mẫu (optional)
npx prisma db seed

# Mở Prisma Studio để xem database (optional)
npx prisma studio


📚 Giải thích lệnh Prisma:
npx prisma migrate dev - Tạo migration mới từ thay đổi schema
npx prisma migrate reset - XÓA toàn bộ DB, chạy lại tất cả migrations + seed
npx prisma db push - Đồng bộ schema với DB (không tạo migration file)
npx prisma generate - Generate Prisma Client
npm run prisma:seed - Chạy seed data
```

### 4. Chạy Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend sẽ chạy tại: **http://localhost:8000**

---

## 🎨 Setup Frontend

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env.local` trong thư mục `frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8000
```

### 3. Chạy Frontend

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

Frontend sẽ chạy tại: **http://localhost:3000**

---

## 👤 Tài khoản mặc định (sau khi seed)

### Admin
- **Email**: admin@example.com
- **Password**: admin123

### User
- **Email**: user@example.com
- **Password**: user123

---

## 📁 Cấu trúc dự án

```
v3/
├── backend/
│   ├── controllers/          # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, upload, etc.
│   ├── prisma/              # Database schema & migrations
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── uploads/             # Uploaded files
│   ├── utils/               # Helper functions
│   ├── server.js            # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/             # Next.js pages (App Router)
    │   │   ├── page.tsx            # Landing page
    │   │   ├── login/              # Login page
    │   │   ├── register/           # Register page
    │   │   ├── dashboard/          # User dashboard
    │   │   ├── majors/             # Majors pages
    │   │   ├── subjects/           # Subjects pages
    │   │   ├── profile/            # Profile page
    │   │   └── admin/              # Admin pages
    │   │
    │   ├── components/
    │   │   ├── layout/      # Header, Footer
    │   │   ├── ui/          # shadcn/ui components
    │   │   └── auth/        # Auth components
    │   │
    │   ├── contexts/        # React Context (Auth)
    │   ├── lib/             # Utilities (api, utils)
    │   ├── types/           # TypeScript types
    │   └── app/
    │       ├── globals.css
    │       └── layout.tsx
    │
    ├── public/              # Static files
    ├── next.config.ts       # Next.js config
    ├── tailwind.config.ts   # Tailwind config
    └── package.json
```

---

## 🎯 Workflow phát triển

### 1. Tạo tính năng mới

#### Backend:
1. Thêm model vào `prisma/schema.prisma`
2. Chạy `npx prisma db push`
3. Tạo controller trong `controllers/`
4. Tạo routes trong `routes/`
5. Import routes vào `server.js`

#### Frontend:
1. Thêm types vào `src/types/index.ts`
2. Tạo API calls trong `src/lib/api.ts` (nếu cần)
3. Tạo page trong `src/app/`
4. Tạo components trong `src/components/`

### 2. Test API với Postman

Import collection từ: `backend/postman/Learning_Platform.postman_collection.json`

### 3. Debug

#### Backend:
```bash
# Xem logs
npm run dev

# Check database
npx prisma studio
```

#### Frontend:
```bash
# Dev tools
F12 trong browser

# Console logs
console.log() trong code
```

---

## 🔥 Các lệnh hữu ích

### Backend

```bash
# Reset database
npx prisma db push --force-reset

# Generate Prisma Client
npx prisma generate

# View database
npx prisma studio

# Seed data
npx prisma db seed
```

### Frontend

```bash
# Clear cache & rebuild
rm -rf .next
npm run build

# Lint code
npm run lint

# Format code (if prettier setup)
npm run format
```

---

## 🐛 Troubleshooting

### Backend không chạy được?

1. **Check MySQL đang chạy:**
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo service mysql status
   ```

2. **Check DATABASE_URL trong .env**
   - Đúng username, password, port
   - Database đã tạo chưa

3. **Check port 8000 có bị chiếm không:**
   ```bash
   # Windows
   netstat -ano | findstr :8000
   
   # Linux/Mac
   lsof -i :8000
   ```

### Frontend không kết nối được Backend?

1. **Check NEXT_PUBLIC_API_URL trong .env.local**
2. **Check CORS trong backend/server.js**
3. **Clear browser cache và cookies**
4. **Check Network tab trong Dev Tools**

### Prisma errors?

```bash
# Reset everything
npx prisma db push --force-reset
npx prisma generate
npm run dev
```

### Upload không hoạt động?

1. **Check thư mục `backend/uploads/` tồn tại**
2. **Check quyền ghi file**
3. **Check `next.config.ts` có config images đúng không**

---

## 📚 Tài liệu tham khảo

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Express.js**: https://expressjs.com

---

## 🎨 Coding Standards

### Backend
- ✅ Use async/await
- ✅ Try-catch cho error handling
- ✅ Return consistent JSON format
- ✅ Use Prisma transactions khi cần
- ✅ Validate input data

### Frontend
- ✅ Use TypeScript strict mode
- ✅ Components trong PascalCase
- ✅ Use hooks properly
- ✅ Handle loading & error states
- ✅ Responsive design
- ✅ Accessibility (a11y)

---

## 🚀 Deployment

### Backend (Railway, Heroku, VPS)

1. Set environment variables
2. Push code to Git
3. Build & start: `npm start`

### Frontend (Vercel, Netlify)

1. Connect Git repository
2. Set environment variables
3. Deploy automatically on push

---

## 📞 Support

Nếu gặp vấn đề, hãy:
1. Check console logs
2. Check network requests
3. Check database
4. Google error message
5. Ask team members

---

**Happy Coding! 🎉**

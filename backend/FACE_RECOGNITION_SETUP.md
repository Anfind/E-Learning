# 🎯 FACE RECOGNITION SETUP GUIDE - V3 BACKEND

## 📋 ĐÃ HOÀN THÀNH

### ✅ Backend Files Created/Updated

1. **`utils/faceRecognition.js`** ✅
   - Functions: `loadModels()`, `extractFaceEmbedding()`, `compareFaces()`, `areModelsLoaded()`
   - Threshold: `0.6` for 128-D embeddings
   - Timeout: `30000ms` (30 seconds)

2. **`controllers/faceController.js`** ✅
   - `registerFace(req, res)` - POST /api/auth/register-face
   - `verifyFace(req, res)` - POST /api/face/verify
   - `getFaceStatus(req, res)` - GET /api/face/status

3. **`routes/face.js`** ✅
   - POST `/api/face/verify`
   - GET `/api/face/status`

4. **`routes/auth.js`** ✅ (UPDATED)
   - Added: POST `/api/auth/register-face`

5. **`controllers/progressController.js`** ✅ (UPDATED)
   - `startLesson()`: Sets `faceVerifiedBefore = true`
   - `verifyAfterLesson()`: Sets `faceVerifiedAfter = true` (NEW FUNCTION)
   - `completeLesson()`: Checks `faceVerifiedAfter = true` before completion

6. **`routes/progress.js`** ✅ (UPDATED)
   - Added: POST `/api/progress/lessons/:id/verify-after`

7. **`server.js`** ✅ (UPDATED)
   - Imports `loadModels()` from utils/faceRecognition
   - Loads models before starting server
   - Added route: `app.use('/api/face', faceRoutes)`
   - Graceful fallback if models fail to load

---

## ⚠️ CẦN LÀM NGAY

### 1️⃣ Copy Models Folder

**Models cần có trong `v3/backend/utils/models/`:**
```
v3/backend/utils/models/
├── tiny_face_detector_model-weights_manifest.json
├── tiny_face_detector_model-shard1
├── face_recognition_model-weights_manifest.json
├── face_recognition_model-shard1
├── face_recognition_model-shard2
├── face_landmark_68_model-weights_manifest.json
└── face_landmark_68_model-shard1
```

**Copy command (Windows PowerShell):**
```powershell
Copy-Item -Path "d:\An\Facial-Recognition-AI-main\Facial-Recognition-AI-main\backend\utils\models" -Destination "d:\An\Facial-Recognition-AI-main\Facial-Recognition-AI-main\v3\backend\utils\" -Recurse
```

**Copy command (CMD):**
```cmd
xcopy /E /I "d:\An\Facial-Recognition-AI-main\Facial-Recognition-AI-main\backend\utils\models" "d:\An\Facial-Recognition-AI-main\Facial-Recognition-AI-main\v3\backend\utils\models"
```

### 2️⃣ Install NPM Packages

```bash
cd v3/backend
npm install @vladmandic/face-api @tensorflow/tfjs-node canvas sharp
```

**Required versions:**
- `@vladmandic/face-api`: ^1.7.15
- `@tensorflow/tfjs-node`: ^4.22.0
- `canvas`: ^3.2.0
- `sharp`: ^0.34.4

---

## 🔗 API ENDPOINTS CHO FRONTEND

### **1. Register Face (Profile Page)**

**Endpoint:** `POST /api/auth/register-face`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "multipart/form-data"
}
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('image', file); // File object from camera capture
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Face registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "faceRegistered": true,
      "createdAt": "2025-11-10T...",
      "updatedAt": "2025-11-10T..."
    }
  }
}
```

**Error Responses:**
- `400`: No file uploaded, Invalid face data, No face detected
- `408`: Processing timeout (> 30s)
- `503`: Models not loaded yet

---

### **2. Verify Face (Lesson Page - 2 times)**

**Endpoint:** `POST /api/face/verify`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>",
  "Content-Type": "multipart/form-data"
}
```

**Body (FormData):**
```javascript
const formData = new FormData();
formData.append('image', file); // File object from camera capture
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Face verification successful",
  "data": {
    "verified": true,
    "confidence": "95.23",
    "user": {
      "id": "uuid",
      "name": "John Doe"
    }
  }
}
```

**Error Responses:**
- `400`: No file uploaded, User not registered face yet, No face detected
- `401`: Face does not match (distance >= 0.6)
- `408`: Processing timeout
- `503`: Models not loaded

---

### **3. Get Face Status**

**Endpoint:** `GET /api/face/status`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "faceRegistered": true
    },
    "modelsLoaded": true
  }
}
```

---

### **4. Start Lesson (Marks faceVerifiedBefore = true)**

**Endpoint:** `POST /api/progress/lessons/:id/start`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Success Response (200):**
```json
{
  "message": "Lesson started",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "lessonId": "uuid",
    "watchTime": 0,
    "completed": false,
    "faceVerifiedBefore": true,
    "faceVerifiedAfter": false,
    "createdAt": "2025-11-10T...",
    "updatedAt": "2025-11-10T..."
  }
}
```

---

### **5. Verify After 2/3 Lesson (NEW ENDPOINT)**

**Endpoint:** `POST /api/progress/lessons/:id/verify-after`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**When to call:** After user watches >= 2/3 of lesson duration AND successfully verifies face

**Success Response (200):**
```json
{
  "message": "Face verified successfully after 2/3 watch time",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "lessonId": "uuid",
    "watchTime": 120,
    "completed": false,
    "faceVerifiedBefore": true,
    "faceVerifiedAfter": true,
    "updatedAt": "2025-11-10T..."
  }
}
```

**Error Responses:**
- `400`: Watch time < 2/3 duration
- `404`: Lesson progress not found

---

### **6. Complete Lesson (Checks faceVerifiedAfter)**

**Endpoint:** `POST /api/progress/lessons/:id/complete`

**Headers:**
```javascript
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

**Success Response (200):**
```json
{
  "message": "Lesson completed! 🎉",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "lessonId": "uuid",
    "watchTime": 180,
    "completed": true,
    "completedAt": "2025-11-10T...",
    "faceVerifiedBefore": true,
    "faceVerifiedAfter": true
  }
}
```

**Error Response (400):**
```json
{
  "message": "You must verify your face after watching 2/3 of the lesson before completing",
  "requiresFaceVerification": true
}
```

---

## 🗄️ DATABASE FIELDS

### **User Model:**
```prisma
model User {
  faceImage       String?  @db.Text       // Path to uploaded image (optional)
  faceEmbedding   String?  @db.LongText   // JSON.stringify([128 floats])
  faceRegistered  Boolean  @default(false)
}
```

**Example faceEmbedding:**
```json
"[0.123, -0.456, 0.789, ..., 0.321]"  // 128 float numbers as JSON string
```

### **LessonProgress Model:**
```prisma
model LessonProgress {
  faceVerifiedBefore  Boolean @default(false)  // Set when startLesson()
  faceVerifiedAfter   Boolean @default(false)  // Set when verify-after
}
```

---

## 🎨 FRONTEND INTEGRATION NOTES

### **Flow cho Profile Page (Register Face):**

1. User click "Đăng ký khuôn mặt"
2. Open `FaceRegistrationCamera` component
3. Component tự động:
   - Bật camera
   - Detect face với MediaPipe
   - Track quality metrics (80 frames stable)
   - Auto capture khi quality > 50%
4. Upload ảnh → `POST /api/auth/register-face`
5. Backend extract embedding → Save to DB
6. Success → Update UI `faceRegistered = true`

**Component Props (FaceRegistrationCamera.tsx):**
```typescript
interface FaceRegistrationCameraProps {
  onClose: () => void;          // Close modal/dialog
  onSuccess?: () => void;       // After successful registration
}
```

**Không cần props:**
- ❌ `studentId` - Tự lấy từ `req.user.id` (JWT token)
- ❌ `studentName` - Lấy từ AuthContext

---

### **Flow cho Lesson Page (Verify 2 times):**

**Verification #1 - Before Start:**
1. User click "Bắt đầu học"
2. Show `FaceVerificationModal` (đã có sẵn)
3. User chụp ảnh → `POST /api/face/verify`
4. If success → `POST /api/progress/lessons/:id/start`
5. Video unlocks, `faceVerifiedBefore = true`

**Verification #2 - After 2/3 Watch Time:**
1. Video reaches 2/3 duration → Auto pause
2. Show `FaceVerificationModal` again
3. User chụp ảnh → `POST /api/face/verify`
4. If success → **`POST /api/progress/lessons/:id/verify-after`** ⭐ NEW!
5. Set `faceVerifiedAfter = true` → Continue video

**Complete Lesson:**
1. User click "Hoàn thành"
2. `POST /api/progress/lessons/:id/complete`
3. Backend checks:
   - ✅ `watchTime >= duration * 2/3`
   - ✅ `faceVerifiedAfter === true`
4. If both true → Mark completed

---

## 🔍 CONSTANTS & THRESHOLDS

**Backend Constants (faceController.js):**
```javascript
const FACE_VERIFICATION_THRESHOLD = 0.6;    // Distance threshold
const MAX_EXTRACTION_TIME = 30000;          // 30 seconds timeout
```

**Frontend Constants (FaceRegistrationCamera.tsx):**
```typescript
const STABLE_FRAMES_REQUIRED = 80;          // Need 80 stable frames
const CONFIDENCE_THRESHOLD = 0.6;            // Min confidence
const QUALITY_THRESHOLD = 50;                // Min quality % (was 48 in original)

// Optimal ranges
const BRIGHTNESS_OPTIMAL = { min: 100, max: 180 };
const CONTRAST_OPTIMAL = { min: 50, max: 100 };
const SHARPNESS_OPTIMAL = { min: 0.5, max: 1.0 };
const FACE_SIZE_OPTIMAL = { min: 0.25, max: 0.7 };
```

---

## 📝 API CALL EXAMPLES (Frontend)

### **Example 1: Register Face**

```typescript
// In FaceRegistrationCamera.tsx
const handleRegisterFace = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await api.postForm('/auth/register-face', formData);
    
    if (response.success) {
      console.log('✅ Face registered:', response.data.user);
      onSuccess?.();
    }
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
};
```

### **Example 2: Verify Face (Before Start)**

```typescript
// In app/lessons/[id]/page.tsx
const handleStartVerified = async () => {
  try {
    // This is called after FaceVerificationModal success
    await api.post(`/progress/lessons/${lessonId}/start`);
    
    setIsStartVerified(true);
    setPlaying(true);
    toast.success('Bắt đầu học bài');
  } catch (error) {
    toast.error('Không thể bắt đầu bài học');
  }
};
```

### **Example 3: Verify After 2/3 (NEW)**

```typescript
// In app/lessons/[id]/page.tsx
const handleEndVerified = async () => {
  try {
    // ⭐ NEW API CALL - Phải thêm vào!
    await api.post(`/progress/lessons/${lessonId}/verify-after`);
    
    setIsEndVerified(true);
    setPlaying(true);
    toast.success('Xác thực thành công! Bạn có thể hoàn thành bài học.');
  } catch (error) {
    toast.error('Không thể xác thực');
  }
};
```

---

## 🧪 TESTING CHECKLIST

### Backend API Tests:

- [ ] POST /api/auth/register-face
  - [ ] Success với ảnh khuôn mặt rõ
  - [ ] Error 400 khi không có file
  - [ ] Error 400 khi không detect được face
  - [ ] Error 408 khi timeout > 30s

- [ ] POST /api/face/verify
  - [ ] Success khi match (distance < 0.6)
  - [ ] Error 401 khi not match (distance >= 0.6)
  - [ ] Error 400 khi user chưa register face

- [ ] GET /api/face/status
  - [ ] Return faceRegistered = true/false
  - [ ] Return modelsLoaded = true/false

- [ ] POST /api/progress/lessons/:id/start
  - [ ] Set faceVerifiedBefore = true

- [ ] POST /api/progress/lessons/:id/verify-after
  - [ ] Set faceVerifiedAfter = true
  - [ ] Error 400 khi watchTime < 2/3

- [ ] POST /api/progress/lessons/:id/complete
  - [ ] Success khi faceVerifiedAfter = true
  - [ ] Error 400 khi faceVerifiedAfter = false

### Full Flow Test:

1. Register face trong Profile
2. Start lesson → Verify #1 → Video unlock
3. Watch 2/3 → Verify #2 → Continue
4. Complete lesson → Success

---

## 📦 PACKAGE.JSON DEPENDENCIES

**Thêm vào `v3/backend/package.json`:**

```json
{
  "dependencies": {
    "@vladmandic/face-api": "^1.7.15",
    "@tensorflow/tfjs-node": "^4.22.0",
    "canvas": "^3.2.0",
    "sharp": "^0.34.4"
  }
}
```

---

## 🚨 TROUBLESHOOTING

### Issue 1: Models không load được

**Lỗi:** `Error loading models: ENOENT: no such file or directory`

**Giải pháp:**
- Check folder `v3/backend/utils/models/` có đầy đủ 7 files
- Copy lại từ dự án gốc

### Issue 2: Canvas installation failed (Windows)

**Lỗi:** `node-gyp rebuild` failed

**Giải pháp:**
```bash
npm install --global --production windows-build-tools
npm install canvas
```

### Issue 3: "No face detected"

**Nguyên nhân:**
- Ánh sáng quá tối/quá sáng
- Khuôn mặt quá nhỏ trong frame
- Góc chụp không phù hợp

**Giải pháp:**
- Đảm bảo ánh sáng tốt (brightness 100-180)
- Khuôn mặt chiếm 25-70% frame
- Nhìn thẳng vào camera

---

## ✅ READY FOR FRONTEND

Sau khi hoàn thành 2 bước setup, backend sẵn sàng cho frontend:

1. ✅ Copy models folder
2. ✅ Install npm packages
3. ✅ Start server: `npm run dev`
4. ✅ Check log: "🤖 Face Recognition: ✅ READY"

**Frontend cần:**
- Component `FaceRegistrationCamera.tsx` (~700 lines)
- Update `app/profile/page.tsx`
- Update `app/lessons/[id]/page.tsx` (thêm verify-after call)

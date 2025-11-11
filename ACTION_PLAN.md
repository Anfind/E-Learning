# 🎯 Action Plan - Implementing Missing Features

## 📌 Ưu tiên Implementation

Dựa trên phân tích gap, đây là thứ tự implement được đề xuất:

---

## 🔴 **PHASE 1: Core Learning Flow (Week 1-2)**

### 1️⃣ Lesson Viewer Page - `/lessons/[id]`
**Priority: CRITICAL** ⚠️

#### Components cần tạo:
1. **LessonVideoPlayer.tsx** - Video player component
2. **FaceVerificationModal.tsx** - Camera capture & verification
3. **LessonProgress.tsx** - Progress indicator
4. **LessonNotes.tsx** - Notes section (optional)

#### Steps:
```typescript
// 1. Create page structure
src/app/lessons/[id]/page.tsx

// 2. Features:
- Fetch lesson data + progress
- Display lesson info (name, description, duration)
- Video player (react-player)
- Watch time tracking (setInterval every second)
- Progress bar (watchTime / duration)
- Face verification before (modal)
- Face verification after (modal when reach 2/3)
- Complete button
- Next lesson link
- Back to subject link

// 3. API calls:
- GET /api/lessons/:id
- POST /api/progress/lessons/:id/start
- PATCH /api/progress/lessons/:id/update (watch time)
- POST /api/progress/lessons/:id/complete
- POST /api/face/verify (face verification)
```

#### Face Verification Flow:
```
1. User clicks "Bắt đầu học"
2. Show FaceVerificationModal
3. Capture photo from webcam
4. Compare with registered face (API)
5. If match → Allow video play
6. Track watch time
7. When reach 2/3 → Show verification modal again
8. If match → Allow complete
9. Update progress → Unlock next lesson
```

#### Libraries cần install:
```bash
npm install react-player
npm install react-webcam
npm install @vladmandic/face-api
```

---

### 2️⃣ Exam Taking Page - `/exams/[id]`
**Priority: CRITICAL** ⚠️

#### Components:
1. **ExamHeader.tsx** - Timer, info
2. **QuestionCard.tsx** - Display question
3. **AnswerOptions.tsx** - MC, T/F, Essay inputs
4. **ExamProgress.tsx** - Question navigation
5. **FaceVerificationModal.tsx** - Reuse from lesson

#### Steps:
```typescript
// 1. Create page
src/app/exams/[id]/page.tsx

// 2. Features:
- Fetch exam + questions
- Face verification before start
- Timer countdown (duration minutes)
- Display questions one by one or all at once
- Save answers (auto-save or manual)
- Submit button
- Confirmation modal before submit
- Auto-submit when time expires
- Redirect to result page

// 3. API calls:
- GET /api/exams/:id/start
- PATCH /api/exams/:id/answers (save answers)
- POST /api/exams/:id/submit
```

#### Question Types Support:
```typescript
// MULTIPLE_CHOICE
- Radio buttons
- Options A, B, C, D

// TRUE_FALSE  
- Radio buttons
- True / False

// ESSAY
- Textarea
- Character limit (optional)
```

---

### 3️⃣ Exam Result Page - `/exams/[id]/result`
**Priority: CRITICAL** ⚠️

#### Features:
```typescript
- Display score (percentage)
- Pass/Fail status
- Total points earned / max points
- Question by question breakdown
  - Question text
  - User answer
  - Correct answer
  - Points earned
  - Correct/Incorrect badge
- Retry button (if failed & attempts < max)
- Back to subject button
```

#### API:
```typescript
- GET /api/exams/:id/result/:attemptId
```

---

## 🟡 **PHASE 2: Admin CRUD (Week 3-5)**

### 4️⃣ Admin - Major Management
**Priority: HIGH** ⚠️

#### Page: `/admin/majors`
```typescript
Features:
- Table view với pagination
- Search, filter
- Create button → Modal/Page
- Edit button per row
- Delete button per row (confirmation)
- Active/Inactive toggle

Create/Edit Form:
- Name (required)
- Description (textarea)
- Image upload (file input)
- Order (number)
- Active status (checkbox)
```

#### API:
```typescript
- GET /api/majors (admin view)
- POST /api/majors (create)
- PATCH /api/majors/:id (update)
- DELETE /api/majors/:id (delete)
```

---

### 5️⃣ Admin - Subject Management
**Priority: HIGH** ⚠️

#### Page: `/admin/subjects`
```typescript
Features:
- Filter by major
- Table view
- CRUD operations

Create/Edit Form:
- Name (required)
- Description (textarea)
- Major (select dropdown)
- Prerequisite subject (select dropdown - nullable)
- Image upload
- Order (number)
- Active status
```

---

### 6️⃣ Admin - Lesson Management
**Priority: HIGH** ⚠️

#### Page: `/admin/lessons`
```typescript
Features:
- Filter by subject
- Table view
- CRUD operations

Create/Edit Form:
- Name (required)
- Description (textarea)
- Subject (select)
- Video URL (input) or Upload (file)
- Duration (number - minutes)
- Prerequisite lesson (select - nullable)
- Order (number)
- Active status

Video Upload:
- Option 1: YouTube URL
- Option 2: Upload to server
- Option 3: External CDN URL
```

---

### 7️⃣ Admin - Exam & Question Management
**Priority: HIGH** ⚠️

#### Page: `/admin/exams`
```typescript
Exam List:
- Filter by subject
- Table view
- CRUD operations

Exam Form:
- Name (required)
- Description
- Subject (select)
- Duration (minutes)
- Passing score (percentage)
- Is required (checkbox)
- Active status
```

#### Page: `/admin/exams/[id]/questions`
```typescript
Question Management:
- List questions for exam
- Add question button
- Edit question inline or modal
- Delete question
- Reorder questions (drag & drop)

Question Form:
- Question text (textarea, required)
- Type (select: MC, T/F, Essay)
- Options (for MC only - 4 inputs)
- Correct answer (select for MC/TF, textarea for Essay)
- Points (number)
- Order (auto or manual)

Question Types:
1. MULTIPLE_CHOICE
   - Options: A, B, C, D
   - Correct answer: A/B/C/D
   
2. TRUE_FALSE
   - Correct answer: true/false
   
3. ESSAY
   - Sample answer (for grading reference)
```

---

## 🟢 **PHASE 3: Community Features (Week 6-7)**

### 8️⃣ Blog System

#### `/blog` - Blog List
```typescript
- Grid or list view
- Filter by date, author, views
- Search
- Pagination
- Click to detail
```

#### `/blog/[id]` - Blog Detail
```typescript
- Title, author, date, views
- Content (rich text display)
- Image
- Comments section
  - List comments
  - Add comment form
- Like button (optional)
```

#### `/blog/new` - Create Blog
```typescript
- Title input
- Rich text editor (react-quill or tiptap)
- Image upload
- Publish/Draft toggle
- Submit button
```

---

### 9️⃣ Q&A System

#### `/questions` - Q&A List
```typescript
- List questions
- Filter by:
  - Subject (dropdown)
  - Lesson (dropdown)
  - Status (OPEN, ANSWERED, CLOSED)
  - Tags (multi-select)
- Search
- Sort by: date, views, answers
- Click to detail
```

#### `/questions/[id]` - Question Detail
```typescript
- Question info (title, content, author, date)
- Tags display
- Answers list
  - Sort by votes or date
  - Accepted answer highlight
- Add answer form (rich text)
- Accept answer button (question author only)
```

#### `/questions/new` - Ask Question
```typescript
- Title input
- Content (rich text editor)
- Subject selection (dropdown)
- Lesson selection (dropdown - optional)
- Tags (multi-select or create new)
- Submit button

Tag System:
- Display existing tags
- Search tags
- Create new tag inline
```

---

## 🎨 **PHASE 4: Advanced Features (Week 8+)**

### 🔟 Face Recognition AI Implementation

#### Backend (Python microservice or Node.js library):
```python
# Option 1: Python microservice
from face_recognition import face_encodings, compare_faces
import numpy as np

def register_face(image):
    encodings = face_encodings(image)
    return encodings[0].tolist()  # Save to DB

def verify_face(image, saved_encoding):
    encodings = face_encodings(image)
    if not encodings:
        return False
    matches = compare_faces([np.array(saved_encoding)], encodings[0])
    return matches[0]
```

#### Frontend:
```typescript
// Camera capture component
import Webcam from 'react-webcam';

const FaceCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  
  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    // Send to API for verification
    verifyFace(imageSrc);
  };
  
  return <Webcam ref={webcamRef} />;
};
```

#### API Endpoints:
```typescript
- POST /api/face/register (register face encoding)
- POST /api/face/verify (verify face against saved encoding)
- POST /api/face/detect (detect if face exists in image)
```

---

### 1️⃣1️⃣ Video Player Enhancements

```typescript
Features:
- Prevent skip forward (disable seeking)
- Prevent speed change
- Detect tab switch (pause video)
- Detect if video is playing (anti-AFK)
- Fullscreen mode
- Quality selection
- Playback speed (optional)
- Captions/Subtitles
```

---

### 1️⃣2️⃣ Real-time Features

#### Chat System (using Stream Chat):
```typescript
- Real-time messaging
- Group chats for each subject
- Direct messages between users
- Online status
- Typing indicators
```

#### Notifications:
```typescript
- New answer to your question
- New comment on your blog
- Lesson/Exam unlocked
- Admin approved your account
- Badge earned (gamification)
```

---

## 📦 Libraries & Dependencies cần thêm

### Video Player:
```bash
npm install react-player
npm install video.js
npm install video-react
```

### Face Recognition:
```bash
npm install react-webcam
npm install @vladmandic/face-api
npm install @tensorflow/tfjs
```

### Rich Text Editor:
```bash
npm install react-quill
# or
npm install @tiptap/react @tiptap/starter-kit
```

### Timer/Countdown:
```bash
npm install react-countdown
```

### Drag & Drop (for question reorder):
```bash
npm install @dnd-kit/core @dnd-kit/sortable
npm install react-beautiful-dnd
```

### Charts (for analytics):
```bash
npm install recharts
npm install chart.js react-chartjs-2
```

---

## 🎯 Kết luận

### Quick Win (2 tuần):
1. ✅ Lesson Viewer (no face verification)
2. ✅ Exam Taking (no face verification)
3. ✅ Exam Result
4. ✅ Admin CRUD - Majors & Subjects

### Must Have (4 tuần):
5. ✅ Admin CRUD - Lessons & Exams
6. ✅ Basic Face Verification
7. ✅ Blog pages
8. ✅ Q&A pages

### Nice to Have (6-8 tuần):
9. ✅ Advanced Face Recognition AI
10. ✅ Video Player enhancements
11. ✅ Real-time features
12. ✅ Analytics & Reports

---

**Implementation hiện tại đã có foundation tốt (70%). Cần 2-4 tuần nữa để có MVP hoàn chỉnh, 6-8 tuần để full-featured.**

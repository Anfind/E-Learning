# Test Script - Learning Platform

## Prerequisites
- Backend running: http://localhost:8000
- Frontend running: http://localhost:3000
- Database setup completed

## Test Flow

### 1. Register & Login
```
✓ Register new user with face image
✓ Login with credentials
✓ Redirect to dashboard
```

### 2. Admin Setup (Run in DB)
```sql
UPDATE User SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'admin@example.com';
```

### 3. Admin Create Data
```
✓ Create Major (http://localhost:3000/admin/majors)
✓ Create Subject (http://localhost:3000/admin/subjects)
✓ Approve user (http://localhost:3000/admin/users)
```

### 4. User Learning Flow
```
✓ Enroll major
✓ View subjects
✓ Start lesson → Face verification → Watch video
✓ Complete lesson → Next lesson unlocked
✓ Take exam → Timer → Answer questions → Submit
✓ View result → Pass/Fail → Retry if failed
```

## Expected Results

### Dashboard
- [x] Stats cards: Enrolled majors, Completed lessons, Passed exams
- [x] Recent activities timeline
- [x] Continue learning section

### Lesson Viewer
- [x] Video player working
- [x] Progress bar updating
- [x] Watch time tracking (check browser console)
- [x] Face verification modal (UI only)
- [x] Complete button enabled after 2/3 watch time

### Exam Taking
- [x] Timer countdown visible
- [x] Questions displayed correctly
- [x] Answer selection working
- [x] Navigation between questions
- [x] Submit confirmation dialog
- [x] Auto-submit when time up

### Exam Result
- [x] Score percentage displayed
- [x] Pass/Fail badge
- [x] Detailed breakdown per question
- [x] Correct answers shown for wrong questions
- [x] Retry button (if failed)

### Admin Pages
- [x] Major CRUD operations
- [x] Subject CRUD operations
- [x] User management (approve, active/deactive)
- [x] Image upload working
- [x] Search & filter working

## Test Data

### Sample Major
```json
{
  "name": "Công nghệ thông tin",
  "description": "Ngành học về lập trình và công nghệ",
  "order": 1,
  "isActive": true
}
```

### Sample Subject
```json
{
  "name": "Lập trình C cơ bản",
  "description": "Học cơ bản về ngôn ngữ C",
  "majorId": "[major-id]",
  "order": 1,
  "isActive": true
}
```

### Sample Lesson (via API)
```json
{
  "subjectId": "[subject-id]",
  "name": "Bài 1: Giới thiệu ngôn ngữ C",
  "description": "Tìm hiểu về lịch sử và cú pháp cơ bản",
  "videoUrl": "https://www.youtube.com/watch?v=KJgsSFOSQv0",
  "duration": 30,
  "order": 1,
  "isActive": true
}
```

### Sample Exam (via API)
```json
{
  "subjectId": "[subject-id]",
  "name": "Kiểm tra giữa kỳ",
  "description": "Bài kiểm tra kiến thức cơ bản",
  "duration": 60,
  "passingScore": 70,
  "order": 1,
  "isRequired": true,
  "isActive": true
}
```

### Sample Question (via API)
```json
{
  "question": "Ngôn ngữ C được phát triển năm nào?",
  "type": "MULTIPLE_CHOICE",
  "options": ["1970", "1972", "1980", "1985"],
  "correctAnswer": "1972",
  "points": 10,
  "order": 1
}
```

## Debug Tips

### Check API calls
```javascript
// Open Browser DevTools > Network tab
// Filter by XHR/Fetch
// Check request/response
```

### Check Console Logs
```javascript
// Browser DevTools > Console
// Watch for errors or logs
// Watch time tracking logs
```

### Check LocalStorage
```javascript
// Browser DevTools > Application > Local Storage
// Check 'token' is saved after login
```

### Common Issues

**1. Can't login:**
- Check backend is running
- Check user status is ACTIVE or APPROVED
- Clear localStorage and try again

**2. Can't see lessons:**
- Make sure enrolled in major
- Check lesson isActive = true
- Check prerequisite completed

**3. Video not playing:**
- Check videoUrl is valid
- Check ReactPlayer loaded (may take a few seconds)
- Try YouTube URL format

**4. Face verification fails:**
- Expected! API not implemented yet
- Can comment out verification check temporarily
- Or click close and test other features

**5. Timer not working:**
- Check react-countdown installed
- Check exam duration > 0
- Check browser console for errors

## Performance Checklist

- [ ] Page load < 3s
- [ ] No console errors
- [ ] Images loading properly
- [ ] Smooth navigation
- [ ] Forms validation working
- [ ] Toast notifications appearing
- [ ] Responsive on mobile

## Security Checklist

- [ ] Protected routes redirect to login
- [ ] Admin routes blocked for users
- [ ] Token required for API calls
- [ ] Image upload size limited
- [ ] XSS prevention (no dangerous HTML)

## Next Steps

After testing Phase 1 & 2:
1. Complete Admin Lesson Management UI
2. Complete Admin Exam Management UI
3. Complete Admin Question Management UI
4. Implement Blog system
5. Implement Q&A system
6. Implement Face Recognition API (Python/Node.js)
7. Deploy to production

---

**Status:** Phase 1 (Core Learning) + Phase 2 (Admin CRUD) ✅ 70% Complete
**Ready for testing:** YES ✅

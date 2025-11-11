# 🧪 FACE RECOGNITION API - POSTMAN TEST GUIDE

## 📦 Files

- `Face_Recognition_Tests.postman_collection.json` - Collection với 10 test cases
- `Face_Recognition_Local.postman_environment.json` - Environment cho local testing

## 🚀 SETUP NHANH

### 1. Import vào Postman

1. Mở Postman
2. Click **Import**
3. Kéo thả 2 files JSON vào
4. Chọn environment: **Face Recognition - Local**

### 2. Chuẩn bị data

#### A. Tạo test user (nếu chưa có):
```bash
POST http://localhost:8000/api/auth/register
Body:
{
  "name": "Test Student",
  "email": "student@test.com",
  "password": "password123",
  "role": "STUDENT"
}
```

#### B. Lấy lesson ID từ database:
```sql
-- Chạy trong database
SELECT id, title FROM lessons LIMIT 1;
```

#### C. Update environment variable:
- Vào Postman → Environments → **Face Recognition - Local**
- Set `testLessonId` = ID lesson vừa lấy

### 3. Chuẩn bị ảnh test

⚠️ **QUAN TRỌNG:** Cần 3 ảnh:

1. **Ảnh đăng ký** (Request #3) - Ảnh khuôn mặt rõ ràng của bạn
2. **Ảnh verify cùng người** (Request #5) - Ảnh khác nhưng CÙNG NGƯỜI
3. **Ảnh verify người khác** (Request #6) - Ảnh NGƯỜI KHÁC (để test detection)

**Yêu cầu ảnh:**
- Format: JPG, PNG
- Khuôn mặt rõ ràng, nhìn thẳng
- Ánh sáng tốt (không quá tối/sáng)
- Kích thước: < 5MB

## ▶️ CHẠY TEST

### Test từng request (Recommended):

1. **Request #1: Login** → Lấy token tự động
2. **Request #2: Get Status Before** → Check faceRegistered = false
3. **Request #3: Register Face** → Upload ảnh #1 (ảnh đăng ký)
   - ⚠️ Thay đường dẫn ảnh trong Body → form-data → image
4. **Request #4: Get Status After** → Check faceRegistered = true
5. **Request #5: Verify Same Person** → Upload ảnh #2 (cùng người)
   - Expected: verified = true, confidence > 80%
6. **Request #6: Verify Different Person** → Upload ảnh #3 (người khác)
   - Expected: status 401, verified = false
7. **Request #7: Start Lesson** → Set faceVerifiedBefore = true
8. **Request #8: Update Watch Time** → Tăng lên 2/3 duration
9. **Request #9: Verify After 2/3** → Set faceVerifiedAfter = true (⭐ NEW API)
10. **Request #10: Complete Lesson** → Check cả 2 verifications

### Hoặc chạy toàn bộ Collection:

1. Click **Run Collection**
2. Select environment: **Face Recognition - Local**
3. Click **Run Face Recognition API Tests**

⚠️ **LƯU Ý:** Requests #3, #5, #6 cần upload file thủ công → Nên chạy từng request!

## ✅ EXPECTED RESULTS

| Request | Status | Key Checks |
|---------|--------|------------|
| #1 Login | 200 | `token` not empty |
| #2 Status Before | 200 | `faceRegistered = false` |
| #3 Register Face | 200 | `faceRegistered = true`, `faceEmbedding` not null |
| #4 Status After | 200 | `faceRegistered = true` |
| #5 Verify Same | 200 | `verified = true`, `confidence > 80%` |
| #6 Verify Different | 401 | `verified = false`, error message |
| #7 Start Lesson | 200 | `faceVerifiedBefore = true` |
| #8 Update Watch Time | 200 | `watchTime = 400` |
| #9 Verify After | 200 | `faceVerifiedAfter = true` ⭐ NEW |
| #10 Complete | 200 | `completed = true`, both verifications true |

## 🔍 KIỂM TRA DATABASE

Sau khi chạy test, check database:

```sql
-- 1. Check user face registration
SELECT id, name, email, faceRegistered, 
       LENGTH(faceEmbedding) as embedding_length
FROM users 
WHERE email = 'student@test.com';

-- Expected: faceRegistered = 1, embedding_length > 0

-- 2. Check lesson progress
SELECT id, userId, lessonId, 
       faceVerifiedBefore, faceVerifiedAfter, 
       completed, watchTime
FROM lesson_progress 
WHERE userId = (SELECT id FROM users WHERE email = 'student@test.com')
ORDER BY createdAt DESC 
LIMIT 1;

-- Expected: 
-- faceVerifiedBefore = 1
-- faceVerifiedAfter = 1
-- completed = 1
```

## 🐛 TROUBLESHOOTING

### ❌ Request #3 fails với "No face detected":
- **Nguyên nhân:** Ảnh không có khuôn mặt hoặc quá mờ
- **Giải pháp:** Dùng ảnh khác, khuôn mặt rõ hơn, ánh sáng tốt hơn

### ❌ Request #5 fails với "Khuôn mặt không khớp":
- **Nguyên nhân:** Dùng ảnh người khác hoặc góc chụp quá khác biệt
- **Giải pháp:** Upload ảnh CÙNG NGƯỜI với ảnh đăng ký

### ❌ Request #9 fails với "Watch time must be >= 2/3":
- **Nguyên nhân:** Chưa chạy Request #8 (Update Watch Time)
- **Giải pháp:** Chạy Request #8 trước, đảm bảo watchTime >= duration * 2/3

### ❌ Request #10 fails với "must verify face after 2/3":
- **Nguyên nhân:** Chưa chạy Request #9 (Verify After)
- **Giải pháp:** Chạy Request #9 trước để set faceVerifiedAfter = true

## 📊 TEST METRICS

**Face Recognition Performance:**
- Model loading: ~100ms
- Face extraction: ~500-2000ms (depends on image size)
- Face comparison: ~5ms
- Total register time: < 3s (good), 3-5s (acceptable), >5s (slow)

**Success Criteria:**
- Same person verification: Confidence > 80%
- Different person verification: Status 401
- Both face checkpoints required for lesson completion

## 🎯 NEXT STEPS

Sau khi test backend OK:

1. ✅ Xóa file test: `controllers/faceControllerTest.js`
2. 🎨 Implement frontend Phase 6-8:
   - FaceRegistrationCamera component
   - Profile page integration
   - Lesson page verify-after call
3. 🧪 Test end-to-end flow với UI

---

**Backend Status:** ✅ READY
**Face Recognition:** ✅ Models loaded in 92ms
**API Server:** 🚀 http://localhost:8000

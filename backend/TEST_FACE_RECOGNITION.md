# 🧪 TEST FACE RECOGNITION - HƯỚNG DẪN

## ❗ Vấn đề đã phát hiện và sửa

### 1. **BUG: Lưu path ảnh thay vì chỉ lưu embedding**
**File:** `v3/backend/controllers/faceController.js` (line 109)

**BEFORE (SAI):**
```javascript
const userUpdated = await prisma.user.update({
  where: { id: userId },
  data: {
    faceEmbedding: JSON.stringify(embeddingArray),
    faceRegistered: true,
    faceImage: req.file.path || null // ❌ SAI - Lưu path ảnh!
  }
});
```

**AFTER (ĐÚNG):**
```javascript
const userUpdated = await prisma.user.update({
  where: { id: userId },
  data: {
    faceEmbedding: JSON.stringify(embeddingArray),
    faceRegistered: true
    // ✅ CHỈ LƯU EMBEDDING - Giống hệ thống cũ
  }
});
```

**Lý do:** Hệ thống gốc (Kindergarten) **KHÔNG LƯU ẢNH GỐC**, chỉ lưu embedding để bảo mật và tiết kiệm dung lượng.

---

## 📋 Checklist đã kiểm tra

✅ **utils/faceRecognition.js** - Copy 100% logic từ imagine.js (bỏ custom model)
✅ **faceController.js** - Đã sửa: Không lưu faceImage, chỉ lưu embedding
✅ **FaceRegistrationCamera.tsx** - Upload đúng FormData với field 'image'
✅ **Schema Prisma** - Có faceEmbedding (LongText) và faceRegistered (Boolean)
✅ **API Routes** - POST /auth/register-face với auth + upload middleware

---

## 🚀 Cách test

### Bước 1: Chuẩn bị ảnh test
```bash
# Copy 1 ảnh khuôn mặt rõ ràng vào:
cp /path/to/face.jpg v3/backend/uploads/test-face.jpg
```

### Bước 2: Chạy test script
```bash
cd v3/backend
node utils/test-face-flow.js
```

### Bước 3: Kiểm tra kết quả
Script sẽ test:
1. ✅ Load models
2. ✅ Extract embedding từ ảnh (128 dimensions)
3. ✅ Compare cùng ảnh 2 lần (distance phải < 0.6)
4. ✅ Lưu embedding vào DB
5. ✅ Đọc lại và verify

**Expected output:**
```
✅ ALL TESTS PASSED!

Summary:
  - Models loaded: ✅
  - Embedding extraction: ✅
  - Same image comparison: ✅ (distance: 0.000000)
  - Database save/load: ✅
  - Stored vs new comparison: ✅ (distance: 0.000000)
```

---

## 🔍 Debug nếu có lỗi

### Lỗi: "Distance > 0.6"
→ Kiểm tra xem có dùng đúng options trong `extractFaceEmbedding()` không

### Lỗi: "Invalid embedding length"
→ Kiểm tra `faceRecognition.js` có giống 100% `imagine.js` không

### Lỗi: "Embedding not saved"
→ Kiểm tra `faceController.js` đã bỏ `faceImage: req.file.path` chưa

---

## 📊 So sánh với hệ thống gốc

| Feature | Kindergarten (Original) | V3 (Learning Platform) |
|---------|-------------------------|------------------------|
| Model | Teacher → Student | User → Self |
| API | `/api/imagine/register` | `/api/auth/register-face` |
| Table | `Student` | `User` |
| Embedding Field | `faceEmbedding` (LongText) | `faceEmbedding` (LongText) |
| Save Image? | ❌ NO | ❌ NO |
| Extraction | `extractFaceEmbedding(buffer)` | `extractFaceEmbedding(buffer)` |
| Dimensions | 128-D | 128-D |
| Threshold | 0.6 | 0.6 |

✅ **Logic nhận diện 100% GIỐNG NHAU**

---

## ✅ Kết luận

Sau khi sửa bug `faceImage: req.file.path`, hệ thống v3 đã **HOÀN TOÀN GIỐNG** hệ thống gốc:

1. ✅ Chỉ lưu **embedding** (128-D array)
2. ✅ KHÔNG lưu ảnh gốc
3. ✅ Dùng cùng thuật toán extract + compare
4. ✅ Cùng threshold (0.6)
5. ✅ Cùng flow: Extract → Save → Verify

**Test script ở trên sẽ verify toàn bộ flow từ đầu đến cuối!** 🚀

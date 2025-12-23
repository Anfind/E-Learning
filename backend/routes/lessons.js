const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth, requireTeacherOrAdmin, requireSubjectTeacher } = require('../middleware/auth');
const lessonController = require('../controllers/lessonController');

router.get('/', optionalAuth, lessonController.listLessons);
router.get('/:id', optionalAuth, lessonController.getLessonDetail);

// Teacher hoặc Admin có thể tạo/sửa/xóa bài học (kiểm tra quyền trong controller)
router.post('/', auth, requireTeacherOrAdmin, lessonController.createLesson);
router.patch('/:id', auth, requireTeacherOrAdmin, lessonController.updateLesson);
router.delete('/:id', auth, requireTeacherOrAdmin, lessonController.deleteLesson);

module.exports = router;

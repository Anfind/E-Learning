const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth } = require('../middleware/auth');
const lessonController = require('../controllers/lessonController');

router.get('/', optionalAuth, lessonController.listLessons);
router.get('/:id', optionalAuth, lessonController.getLessonDetail);
router.post('/', auth, requireAdmin, lessonController.createLesson);
router.patch('/:id', auth, requireAdmin, lessonController.updateLesson);
router.delete('/:id', auth, requireAdmin, lessonController.deleteLesson);

module.exports = router;

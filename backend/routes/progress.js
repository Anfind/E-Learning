const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const progressController = require('../controllers/progressController');

// Lesson progress routes
router.post('/lessons/:id/start', auth, progressController.startLesson);
router.patch('/lessons/:id/progress', auth, progressController.updateProgress);
router.post('/lessons/:id/verify-after', auth, progressController.verifyAfterLesson);
router.post('/lessons/:id/complete', auth, progressController.completeLesson);
router.get('/lessons', auth, progressController.getMyLessonProgress);

module.exports = router;

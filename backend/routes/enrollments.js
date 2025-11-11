const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const enrollmentController = require('../controllers/enrollmentController');

// User routes
router.post('/', auth, enrollmentController.enrollMajor);
router.get('/my', auth, enrollmentController.getMyEnrollments);
router.delete('/:id', auth, enrollmentController.unenrollMajor);

// Admin routes
router.get('/', auth, requireAdmin, enrollmentController.getAllEnrollments);

module.exports = router;

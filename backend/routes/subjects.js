const express = require('express');
const router = express.Router();
const { auth, requireAdmin, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const subjectController = require('../controllers/subjectController');

// @route   GET /api/subjects
// @desc    List subjects with filters (majorId, isActive)
// @access  Public
router.get('/', optionalAuth, subjectController.listSubjects);

// @route   GET /api/subjects/:id
// @desc    Get subject detail with lessons, exams, and prerequisite
// @access  Public
router.get('/:id', optionalAuth, subjectController.getSubjectDetail);

// @route   POST /api/subjects
// @desc    Create new subject (with optional prerequisite and image)
// @access  Private/Admin
router.post('/', auth, requireAdmin, upload.single('courseImage'), subjectController.createSubject);

// @route   PATCH /api/subjects/:id
// @desc    Update subject (with optional image upload)
// @access  Private/Admin
router.patch('/:id', auth, requireAdmin, upload.single('courseImage'), subjectController.updateSubject);

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (check dependencies first)
// @access  Private/Admin
router.delete('/:id', auth, requireAdmin, subjectController.deleteSubject);

module.exports = router;

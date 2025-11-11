const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { verifyFace, getFaceStatus } = require('../controllers/faceController'); // Use real controller

// Routes
router.post('/verify', auth, upload.single('image'), verifyFace);
router.get('/status', auth, getFaceStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const { uploadBlogImage } = require('../middleware/upload');
const blogController = require('../controllers/blogController');

// Blog post routes
router.post('/', auth, uploadBlogImage, blogController.createBlogPost);
router.get('/', blogController.listBlogPosts);
router.get('/tags', blogController.getAllTags);
router.get('/:id', blogController.getBlogPostDetail);
router.patch('/:id', auth, uploadBlogImage, blogController.updateBlogPost);
router.delete('/:id', auth, blogController.deleteBlogPost);

// Comment routes
router.post('/:id/comments', auth, blogController.addComment);
router.delete('/comments/:id', auth, blogController.deleteComment);

module.exports = router;

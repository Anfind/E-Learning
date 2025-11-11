const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Create blog post
// @route   POST /api/blog
// @access  Private
exports.createBlogPost = async (req, res, next) => {
  try {
    const { title, content, excerpt, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Handle image upload from multer
    const imageUrl = req.file ? `/uploads/blog/${req.file.filename}` : null;

    // Parse tags if string
    const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

    // First, ensure all tags exist
    const tagRecords = await Promise.all(
      tagArray.map(async (tagName) => {
        const tag = await prisma.tag.findUnique({
          where: { name: tagName }
        });
        if (tag) return tag;
        
        return await prisma.tag.create({
          data: { name: tagName }
        });
      })
    );

    const post = await prisma.blogPost.create({
      data: {
        title,
        content,
        imageUrl,
        userId,
        tags: {
          create: tagRecords.map(tag => ({
            tagId: tag.id
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Blog post created successfully',
      data: post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List blog posts
// @route   GET /api/blog
// @access  Public
exports.listBlogPosts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      authorId, 
      tag,
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (authorId) {
      where.authorId = authorId;
    }

    if (tag) {
      where.tags = {
        some: {
          name: tag
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: {
              comments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      data: posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get blog post detail
// @route   GET /api/blog/:id
// @access  Public
exports.getBlogPostDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment view count
    await prisma.blogPost.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    });

    res.json({
      data: {
        ...post,
        views: post.views + 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog post
// @route   PATCH /api/blog/:id
// @access  Private
exports.updateBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags } = req.body;
    const userId = req.user.id;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: { tags: true }
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check ownership (author can edit, or admin)
    if (post.authorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updateData = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt) updateData.excerpt = excerpt;
    
    // Handle image upload
    if (req.file) {
      updateData.imageUrl = `/uploads/blog/${req.file.filename}`;
    }

    // Handle tags update
    if (tags) {
      const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
      
      // Disconnect all existing tags
      await prisma.blogPost.update({
        where: { id },
        data: {
          tags: {
            set: []
          }
        }
      });

      // Connect new tags
      updateData.tags = {
        connectOrCreate: tagArray.map(tagName => ({
          where: { name: tagName },
          create: { name: tagName }
        }))
      };
    }

    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        tags: true,
        _count: {
          select: {
            comments: true
          }
        }
      }
    });

    res.json({
      message: 'Blog post updated successfully',
      data: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blog/:id
// @access  Private
exports.deleteBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Check ownership (author can delete, or admin)
    if (post.authorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete post (comments will be cascade deleted)
    await prisma.blogPost.delete({
      where: { id }
    });

    res.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to blog post
// @route   POST /api/blog/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Check if post exists
    const post = await prisma.blogPost.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId,
        postId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/blog/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check ownership (commenter can delete, or admin)
    if (comment.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({
      where: { id }
    });

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all tags
// @route   GET /api/blog/tags
// @access  Public
exports.getAllTags = async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            blogPosts: true,
            questions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

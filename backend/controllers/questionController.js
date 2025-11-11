const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// @desc    Ask a question
// @route   POST /api/questions
// @access  Private
exports.createQuestion = async (req, res, next) => {
  try {
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Parse tags if string
    const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags || [];

    const question = await prisma.question.create({
      data: {
        title,
        content,
        userId,
        tags: {
          create: tagArray.map(tagName => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: { name: tagName }
              }
            }
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
            tag: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Question posted successfully',
      data: {
        ...question,
        tags: question.tags.map(qt => qt.tag)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List questions
// @route   GET /api/questions
// @access  Public
exports.listQuestions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      tag,
      search,
      hasAcceptedAnswer,
      subjectId,
      sortBy = 'recent' // recent, popular, unanswered
    } = req.query;
    
    const skip = (page - 1) * limit;

    const where = {};
    
    if (userId) {
      where.userId = userId;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: tag
          }
        }
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (hasAcceptedAnswer !== undefined) {
      if (hasAcceptedAnswer === 'true') {
        where.acceptedAnswerId = { not: null };
      } else {
        where.acceptedAnswerId = null;
      }
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    // Sort options
    let orderBy = {};
    switch (sortBy) {
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      case 'unanswered':
        where.answers = { none: {} };
        orderBy = { createdAt: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
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
          subject: {
            select: {
              id: true,
              name: true,
              major: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          lesson: {
            select: {
              id: true,
              name: true
            }
          },
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              answers: true
            }
          }
        },
        orderBy
      }),
      prisma.question.count({ where })
    ]);

    // Format tags
    const formattedQuestions = questions.map(q => ({
      ...q,
      tags: q.tags.map(qt => qt.tag)
    }));

    res.json({
      data: formattedQuestions,
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

// @desc    Get question detail
// @route   GET /api/questions/:id
// @access  Public
exports.getQuestionDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
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
        subject: {
          select: {
            id: true,
            name: true,
            major: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        lesson: {
          select: {
            id: true,
            name: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        answers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true
              }
            }
          },
          orderBy: [
            { isAccepted: 'desc' }, // Accepted answer first
            { createdAt: 'asc' }    // Then oldest to newest
          ]
        },
        _count: {
          select: {
            answers: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Increment view count
    await prisma.question.update({
      where: { id },
      data: {
        views: { increment: 1 }
      }
    });

    res.json({
      data: {
        ...question,
        views: question.views + 1,
        tags: question.tags.map(qt => qt.tag)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PATCH /api/questions/:id
// @access  Private
exports.updateQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user.id;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check ownership (author can edit, or admin)
    if (question.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this question' });
    }

    const updateData = {};
    
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    // Handle tags update
    if (tags) {
      const tagArray = typeof tags === 'string' ? JSON.parse(tags) : tags;
      
      // Delete existing QuestionTag relations
      await prisma.questionTag.deleteMany({
        where: { questionId: id }
      });

      // Create new relations
      updateData.tags = {
        create: tagArray.map(tagName => ({
          tag: {
            connectOrCreate: {
              where: { name: tagName },
              create: { name: tagName }
            }
          }
        }))
      };
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        }
      }
    });

    res.json({
      message: 'Question updated successfully',
      data: {
        ...updatedQuestion,
        tags: updatedQuestion.tags.map(qt => qt.tag)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Check ownership (author can delete, or admin)
    if (question.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this question' });
    }

    // Delete question (answers and tags will be cascade deleted)
    await prisma.question.delete({
      where: { id }
    });

    res.json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Post an answer
// @route   POST /api/questions/:id/answers
// @access  Private
exports.createAnswer = async (req, res, next) => {
  try {
    const { id: questionId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Answer content is required' });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        userId,
        questionId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Answer posted successfully',
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update answer
// @route   PATCH /api/answers/:id
// @access  Private
exports.updateAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Answer content is required' });
    }

    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check ownership (author can edit, or admin)
    if (answer.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this answer' });
    }

    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: { content },
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

    res.json({
      message: 'Answer updated successfully',
      data: updatedAnswer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
exports.deleteAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const answer = await prisma.answer.findUnique({
      where: { id },
      include: {
        question: true
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check ownership (author can delete, or admin)
    if (answer.userId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this answer' });
    }

    // If this is the accepted answer, clear acceptedAnswerId
    if (answer.question.acceptedAnswerId === id) {
      await prisma.question.update({
        where: { id: answer.questionId },
        data: { acceptedAnswerId: null }
      });
    }

    await prisma.answer.delete({
      where: { id }
    });

    res.json({
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept an answer (mark as solution)
// @route   POST /api/answers/:id/accept
// @access  Private
exports.acceptAnswer = async (req, res, next) => {
  try {
    const { id: answerId } = req.params;
    const userId = req.user.id;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Only question author can accept answer
    if (answer.question.userId !== userId) {
      return res.status(403).json({ 
        message: 'Only the question author can accept an answer' 
      });
    }

    // Check if already accepted
    if (answer.question.acceptedAnswerId === answerId) {
      return res.json({
        message: 'This answer is already accepted',
        data: answer
      });
    }

    // Update question with accepted answer
    await prisma.question.update({
      where: { id: answer.questionId },
      data: {
        acceptedAnswerId: answerId
      }
    });

    // Mark answer as accepted
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        isAccepted: true
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

    res.json({
      message: 'Answer accepted successfully',
      data: updatedAnswer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unaccept an answer
// @route   DELETE /api/answers/:id/accept
// @access  Private
exports.unacceptAnswer = async (req, res, next) => {
  try {
    const { id: answerId } = req.params;
    const userId = req.user.id;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true
      }
    });

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Only question author can unaccept answer
    if (answer.question.userId !== userId) {
      return res.status(403).json({ 
        message: 'Only the question author can unaccept an answer' 
      });
    }

    if (!answer.isAccepted) {
      return res.json({
        message: 'This answer is not accepted',
        data: answer
      });
    }

    // Clear accepted answer from question
    await prisma.question.update({
      where: { id: answer.questionId },
      data: {
        acceptedAnswerId: null
      }
    });

    // Mark answer as not accepted
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        isAccepted: false
      }
    });

    res.json({
      message: 'Answer unaccepted',
      data: updatedAnswer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List all tags with usage count
// @route   GET /api/tags
// @access  Public
exports.listTags = async (req, res, next) => {
  try {
    const { search, limit = 50 } = req.query;

    const where = {};
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const tags = await prisma.tag.findMany({
      where,
      take: parseInt(limit),
      include: {
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

    // Format with total usage count
    const formattedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      blogPostCount: tag._count.blogPosts,
      questionCount: tag._count.questions,
      totalUsage: tag._count.blogPosts + tag._count.questions
    }));

    // Sort by total usage
    formattedTags.sort((a, b) => b.totalUsage - a.totalUsage);

    res.json({
      data: formattedTags
    });
  } catch (error) {
    next(error);
  }
};

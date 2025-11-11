const { StreamChat } = require('stream-chat');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Initialize Stream Chat client
const streamClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// @desc    Generate Stream Chat token for user
// @route   POST /api/chat/token
// @access  Private
exports.generateToken = async (req, res, next) => {
  try {
    const user = req.user;

    if (!process.env.STREAM_API_KEY || !process.env.STREAM_API_SECRET) {
      return res.status(500).json({ 
        message: 'Stream Chat not configured. Please set STREAM_API_KEY and STREAM_API_SECRET in .env file' 
      });
    }

    // Create or update user in Stream
    await streamClient.upsertUser({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      role: user.role.toLowerCase(), // 'admin' or 'user'
      status: user.status
    });

    // Proactively create all ACTIVE users in Stream Chat to prevent channel creation errors
    try {
      const activeUsers = await prisma.user.findMany({
        where: { 
          status: { in: ['ACTIVE', 'APPROVED'] }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          status: true
        },
        take: 100 // Limit to prevent overload
      });

      // Batch upsert all active users
      if (activeUsers.length > 0) {
        await streamClient.upsertUsers(
          activeUsers.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}`,
            role: u.role.toLowerCase(),
            status: u.status
          }))
        );
      }
    } catch (batchError) {
      console.error('Failed to batch create users in Stream Chat:', batchError);
      // Continue even if batch creation fails
    }

    // Generate token
    const token = streamClient.createToken(user.id);

    res.json({
      data: {
        token,
        apiKey: process.env.STREAM_API_KEY,
        userId: user.id,
        userName: user.name,
        userImage: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or get a channel
// @route   POST /api/chat/channels
// @access  Private
exports.createChannel = async (req, res, next) => {
  try {
    const { type, id, name, members, data } = req.body;
    const userId = req.user.id;

    if (!type || !id) {
      return res.status(400).json({ 
        message: 'Channel type and id are required' 
      });
    }

    // Validate channel type
    const allowedTypes = ['messaging', 'team', 'livestream', 'commerce'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ 
        message: `Invalid channel type. Allowed: ${allowedTypes.join(', ')}` 
      });
    }

    // Create channel
    const channel = streamClient.channel(type, id, {
      name: name || id,
      members: members || [userId],
      created_by_id: userId,
      ...data
    });

    await channel.create();

    res.status(201).json({
      message: 'Channel created successfully',
      data: {
        channelId: id,
        channelType: type,
        channelName: name || id
      }
    });
  } catch (error) {
    // If channel already exists, just return success
    if (error.code === 4) {
      return res.json({
        message: 'Channel already exists',
        data: {
          channelId: req.body.id,
          channelType: req.body.type
        }
      });
    }
    next(error);
  }
};

// @desc    Get user's channels
// @route   GET /api/chat/channels
// @access  Private
exports.getUserChannels = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, limit = 20, offset = 0 } = req.query;

    const filter = { members: { $in: [userId] } };
    if (type) filter.type = type;

    const sort = [{ last_message_at: -1 }];

    const channels = await streamClient.queryChannels(
      filter,
      sort,
      { 
        limit: parseInt(limit),
        offset: parseInt(offset),
        watch: false,
        state: true
      }
    );

    const formattedChannels = channels.map(channel => ({
      id: channel.id,
      type: channel.type,
      name: channel.data.name,
      image: channel.data.image,
      memberCount: channel.state.members ? Object.keys(channel.state.members).length : 0,
      lastMessageAt: channel.state.last_message_at,
      unreadCount: channel.countUnread(),
      createdBy: channel.data.created_by_id
    }));

    res.json({
      data: formattedChannels,
      total: channels.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create direct message channel between two users
// @route   POST /api/chat/dm
// @access  Private
exports.createDirectMessage = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({ message: 'recipientId is required' });
    }

    if (recipientId === senderId) {
      return res.status(400).json({ message: 'Cannot create DM with yourself' });
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, avatar: true, status: true }
    });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    if (recipient.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Recipient is not active' });
    }

    // Create channel ID (sort IDs to ensure same channel for both directions)
    const channelId = [senderId, recipientId].sort().join('-');

    // Create or get channel
    const channel = streamClient.channel('messaging', channelId, {
      members: [senderId, recipientId],
      created_by_id: senderId
    });

    await channel.create();

    res.json({
      message: 'Direct message channel created',
      data: {
        channelId,
        channelType: 'messaging',
        recipientId: recipient.id,
        recipientName: recipient.name,
        recipientAvatar: recipient.avatar
      }
    });
  } catch (error) {
    // If channel already exists, just return success
    if (error.code === 4) {
      const channelId = [req.user.id, req.body.recipientId].sort().join('-');
      return res.json({
        message: 'Channel already exists',
        data: {
          channelId,
          channelType: 'messaging'
        }
      });
    }
    next(error);
  }
};

// @desc    Create subject/lesson discussion channel
// @route   POST /api/chat/channels/subject/:subjectId
// @access  Private
exports.createSubjectChannel = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    // Check if subject exists and user is enrolled
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        major: {
          include: {
            enrollments: {
              where: { userId }
            }
          }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    if (subject.major.enrollments.length === 0) {
      return res.status(403).json({ 
        message: 'You must be enrolled in this major to join the discussion' 
      });
    }

    // Get all enrolled users in this major
    const enrolledUsers = await prisma.enrollment.findMany({
      where: { majorId: subject.majorId },
      select: { userId: true }
    });

    const memberIds = enrolledUsers.map(e => e.userId);

    // Create channel
    const channelId = `subject-${subjectId}`;
    const channel = streamClient.channel('team', channelId, {
      name: `${subject.name} Discussion`,
      image: subject.imageUrl,
      members: memberIds,
      created_by_id: userId,
      subjectId: subject.id,
      majorId: subject.majorId
    });

    await channel.create();

    res.json({
      message: 'Subject discussion channel created',
      data: {
        channelId,
        channelType: 'team',
        channelName: `${subject.name} Discussion`,
        memberCount: memberIds.length
      }
    });
  } catch (error) {
    if (error.code === 4) {
      return res.json({
        message: 'Channel already exists',
        data: {
          channelId: `subject-${req.params.subjectId}`,
          channelType: 'team'
        }
      });
    }
    next(error);
  }
};

// @desc    Delete channel (admin only)
// @route   DELETE /api/chat/channels/:type/:id
// @access  Private/Admin
exports.deleteChannel = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const channel = streamClient.channel(type, id);
    await channel.delete();

    res.json({
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add members to channel
// @route   POST /api/chat/channels/:type/:id/members
// @access  Private
exports.addMembers = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const channel = streamClient.channel(type, id);
    await channel.addMembers(userIds);

    res.json({
      message: 'Members added successfully',
      data: {
        channelId: id,
        addedUsers: userIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove members from channel
// @route   DELETE /api/chat/channels/:type/:id/members
// @access  Private
exports.removeMembers = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'userIds array is required' });
    }

    const channel = streamClient.channel(type, id);
    await channel.removeMembers(userIds);

    res.json({
      message: 'Members removed successfully',
      data: {
        channelId: id,
        removedUsers: userIds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

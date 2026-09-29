const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const StudyGroup = require('./models/StudyGroup');
const GroupMessage = require('./models/GroupMessage');
const ModerationFlag = require('./models/ModerationFlag');
const { scanContentForRisk } = require('./utils/moderation');

const initSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('name status');
      if (!user || user.status === 'dismissed') return next(new Error('Account unavailable'));

      socket.user = { id: user._id.toString(), name: user.name };
      next();
    } catch (error) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-room', async (roomId) => {
      try {
        if (!mongoose.isValidObjectId(roomId)) {
          socket.emit('group-error', 'Invalid group');
          return;
        }

        const group = await StudyGroup.findOne({ _id: roomId, 'members.user': socket.user.id }).select('_id');
        if (!group) {
          socket.emit('group-error', 'You are not a member of this group');
          return;
        }

        socket.join(roomId);
        socket.emit('room-joined', roomId);
        const history = await GroupMessage.find({ group: roomId })
          .sort({ createdAt: -1 })
          .limit(100)
          .populate('sender', 'name')
          .lean();
        socket.emit('chat-history', history.reverse().map((message) => ({
          _id: message._id,
          senderName: message.sender?.name || 'Member',
          senderId: message.sender?._id,
          text: message.text,
          createdAt: message.createdAt,
        })));
      } catch (error) {
        socket.emit('group-error', 'Unable to join this group');
      }
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('timer-sync', ({ roomId, timeLeft, isRunning, mode }) => {
      if (!socket.rooms.has(roomId)) return;
      io.to(roomId).emit('timer-update', { timeLeft, isRunning, mode });
    });

    socket.on('chat-send', async ({ roomId, text }) => {
      const normalizedText = String(text || '').trim();
      if (!socket.rooms.has(roomId) || !normalizedText || normalizedText.length > 1000) return;

      try {
        const isMember = await StudyGroup.exists({ _id: roomId, 'members.user': socket.user.id });
        if (!isMember) {
          socket.leave(roomId);
          socket.emit('group-error', 'You are no longer a member of this group');
          return;
        }

        const message = await GroupMessage.create({
          group: roomId,
          sender: socket.user.id,
          text: normalizedText,
        });
        const moderation = scanContentForRisk(normalizedText);
        if (moderation.riskScore > 30) {
          await ModerationFlag.create({
            userId: socket.user.id,
            userName: socket.user.name,
            sourceType: 'chat',
            content: normalizedText.slice(0, 500),
            reason: moderation.issues.join('; '),
            riskScore: moderation.riskScore,
            aiStatus: moderation.aiStatus,
            status: 'pending',
          });
        }

        io.to(roomId).emit('chat-message', {
          _id: message._id,
          senderName: socket.user.name,
          senderId: socket.user.id,
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (error) {
        socket.emit('group-error', 'Message could not be sent');
      }
    });

    socket.on('disconnect', () => {
      // no-op
    });
  });

  return io;
};

module.exports = initSocket;

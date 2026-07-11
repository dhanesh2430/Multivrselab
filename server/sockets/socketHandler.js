const jwt = require('jsonwebtoken');
const Group = require('../models/Group');

let io;
const onlineUsers = new Map(); // userId -> set of socketIds

/**
 * Initialize Socket.io with the HTTP server and attach middleware.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
const initSocket = (httpServer) => {
  const { Server } = require('socket.io');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Handshake JWT Middleware ─────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error: no token provided.'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token.'));
    }
  });

  // ── Connection Handler ───────────────────────────────────────────────
  io.on('connection', async (socket) => {
    console.log(`[Socket] Connected: ${socket.username} (${socket.userId})`);

    // Track online user sockets
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    // Join personal user room for direct notifications
    socket.join(`user_${socket.userId}`);
    console.log(`[Socket] ${socket.username} joined personal room: user_${socket.userId}`);

    // Broadcast user online status
    io.emit('userOnline', { userId: socket.userId, username: socket.username });

    try {
      // Automatically join all groups the user belongs to
      const groups = await Group.find({ members: socket.userId }, '_id groupName');
      for (const group of groups) {
        const roomId = group._id.toString();
        socket.join(roomId);
        console.log(`[Socket] ${socket.username} joined room: ${group.groupName} (${roomId})`);
      }
    } catch (err) {
      console.error('[Socket] Error joining group rooms:', err);
    }

    // Allow client to explicitly join a group room (e.g. after creating or joining one)
    socket.joinGroupHandler = async (groupId) => {
      try {
        const group = await Group.findById(groupId);
        if (group && group.members.map((m) => m.toString()).includes(socket.userId)) {
          socket.join(groupId);
          console.log(`[Socket] ${socket.username} joined room: ${groupId}`);
        }
      } catch (err) {
        console.error('[Socket] joinGroup error:', err);
      }
    };
    socket.on('joinGroup', socket.joinGroupHandler);

    // Typing Indicators support
    socket.on('typing', ({ groupId, isTyping }) => {
      if (groupId) {
        socket.to(groupId.toString()).emit('userTyping', {
          userId: socket.userId,
          username: socket.username,
          isTyping
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.username} (${socket.userId})`);
      
      const userSockets = onlineUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          // Broadcast user offline status
          io.emit('userOffline', { userId: socket.userId, username: socket.username });
        }
      }
    });
  });

  return io;
};

/**
 * Check if a user is currently online.
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => {
  return onlineUsers.has(userId.toString());
};

/**
 * Get the active Socket.io instance (call after initSocket).
 */
const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket first.');
  return io;
};

module.exports = { initSocket, getIO, isUserOnline };

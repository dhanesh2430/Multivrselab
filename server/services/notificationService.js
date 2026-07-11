const Notification = require('../models/Notification');
const { getIO } = require('../sockets/socketHandler');

/**
 * Create a notification in the DB and broadcast it via Socket.io.
 * @param {Object} params
 * @param {string} params.userId - Recipient of the notification
 * @param {string} params.type - enum value matching Notification model types
 * @param {string} params.message - Human readable message
 * @param {Object} [params.data] - Additional payload data
 */
const createNotification = async ({ userId, type, message, data = {} }) => {
  try {
    // 1. Create and save notification to MongoDB
    const notification = await Notification.create({
      userId,
      type,
      message,
      data
    });

    // 2. Broadcast via socket to the user's personal room
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('notification', {
        _id: notification._id,
        id: notification._id,
        userId: notification.userId,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        data: notification.data,
        timestamp: notification.createdAt || new Date().toISOString()
      });
      
      // Also emit a general unread-count update
      const unreadCount = await Notification.countDocuments({ userId, isRead: false });
      io.to(`user_${userId}`).emit('unreadCountUpdate', { unreadCount });

    } catch (socketErr) {
      console.warn(`[NotificationService] Socket emit failed for user ${userId}:`, socketErr.message);
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err);
    throw err;
  }
};

/**
 * Broadcast an activity or alert to a group.
 * @param {string} groupId - Group room ID
 * @param {string} message - Activity message
 * @param {string} [type] - Notification type
 */
const broadcastToGroup = (groupId, message, type = 'default') => {
  try {
    const io = getIO();
    io.to(groupId.toString()).emit('notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (socketErr) {
    console.warn(`[NotificationService] Group broadcast failed for group ${groupId}:`, socketErr.message);
  }
};

module.exports = {
  createNotification,
  broadcastToGroup
};

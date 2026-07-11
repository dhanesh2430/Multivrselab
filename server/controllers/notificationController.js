const Notification = require('../models/Notification');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.json({ message: 'Notification marked as read.', notification, unreadCount });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/notifications
exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'All notifications cleared.' });
  } catch (err) {
    console.error('clearNotifications error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

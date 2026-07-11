const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'friend_request',
        'friend_accepted',
        'group_invite',
        'habit_started',
        'habit_completed',
        'leaderboard_change',
        'rank_up',
        'rank_down',
        'achievement',
        'streak_milestone'
      ]
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Add index on userId for fast notification queries
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

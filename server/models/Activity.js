const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
    type: {
      type: String,
      required: true,
      enum: ['habit_started', 'habit_completed', 'group_joined', 'friend_added']
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Indexes
activitySchema.index({ groupId: 1, timestamp: -1 });
activitySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);

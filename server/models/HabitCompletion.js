const mongoose = require('mongoose');

const habitCompletionSchema = new mongoose.Schema(
  {
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    timestamp: { type: Date, default: Date.now },
    pointsEarned: { type: Number, required: true },
    consistencyScore: { type: Number, default: 0 },
    speedScore: { type: Number, default: 0 },
    difficultyMultiplier: { type: Number, default: 1.0 },
    isLate: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for habit and user analysis
habitCompletionSchema.index({ habitId: 1, timestamp: -1 });
habitCompletionSchema.index({ userId: 1, timestamp: -1 });
habitCompletionSchema.index({ groupId: 1, timestamp: -1 });

module.exports = mongoose.model('HabitCompletion', habitCompletionSchema);

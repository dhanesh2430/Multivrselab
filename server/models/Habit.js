const mongoose = require('mongoose');

const completionEntrySchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    pointsEarned: { type: Number, required: true },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'General', trim: true },
    targetType: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    dailyTarget: { type: Number, default: 1 },
    weeklyTarget: { type: Number, default: 5 },
    reminderTime: { type: String, default: '09:00' },
    deadline: { type: String, required: true }, // e.g. "20:00"
    timezone: { type: String, required: true }, // e.g. "America/New_York"
    color: { type: String, default: '#7C3AED' },
    icon: { type: String, default: 'Bolt' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
    isArchived: { type: Boolean, default: false },
    completions: [completionEntrySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Habit', habitSchema);

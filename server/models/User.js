const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: 'avatar1' },
    totalPoints: { type: Number, default: 0 },
    globalRank: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    habitsCompleted: { type: Number, default: 0 },
    groupsJoinedCount: { type: Number, default: 0 },
    friendsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

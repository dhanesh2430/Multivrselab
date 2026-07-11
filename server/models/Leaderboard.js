const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema(
  {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }, // null means global leaderboard
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    totalPoints: { type: Number, default: 0 },
    consistencyScore: { type: Number, default: 0 },
    speedScore: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },
    monthlyScore: { type: Number, default: 0 },
    rank: { type: Number, default: 1 },
    previousRank: { type: Number, default: 1 },
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' }
  },
  { timestamps: true }
);

// Indexes for fast lookup
leaderboardSchema.index({ groupId: 1, rank: 1 });
leaderboardSchema.index({ userId: 1, groupId: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);

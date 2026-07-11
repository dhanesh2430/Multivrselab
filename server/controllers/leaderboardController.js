const User = require('../models/User');
const Group = require('../models/Group');
const HabitCompletion = require('../models/HabitCompletion');
const { DateTime } = require('luxon');

// GET /api/leaderboard — global leaderboard
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'totalPoints'; // totalPoints, currentStreak, weeklyScore, monthlyScore, consistencyScore, speedScore
    const limit = parseInt(req.query.limit) || 50;

    const users = await User.find({}).select('username name email avatar totalPoints currentStreak longestStreak globalRank');

    const leaderboard = await buildLeaderboardData(users, sortBy);
    res.json({ leaderboard: leaderboard.slice(0, limit) });
  } catch (err) {
    console.error('getGlobalLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/leaderboard/group/:groupId — group leaderboard
exports.getGroupLeaderboard = async (req, res) => {
  try {
    const { groupId } = req.params;
    const sortBy = req.query.sortBy || 'totalPoints';

    const group = await Group.findById(groupId).populate('members', 'username name email avatar totalPoints currentStreak longestStreak');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const leaderboard = await buildLeaderboardData(group.members, sortBy);
    res.json({ leaderboard });
  } catch (err) {
    console.error('getGroupLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Helper to aggregate completion statistics and sort users
 */
async function buildLeaderboardData(users, sortBy) {
  const now = DateTime.now();
  const weekStart = now.startOf('week').toJSDate();
  const monthStart = now.startOf('month').toJSDate();

  const leaderboardData = await Promise.all(
    users.map(async (user) => {
      // Aggregate user stats from HabitCompletion
      const completions = await HabitCompletion.find({ userId: user._id });

      const weeklyScore = completions
        .filter(c => c.timestamp >= weekStart)
        .reduce((sum, c) => sum + c.pointsEarned, 0);

      const monthlyScore = completions
        .filter(c => c.timestamp >= monthStart)
        .reduce((sum, c) => sum + c.pointsEarned, 0);

      const consistencyScore = completions.reduce((sum, c) => sum + (c.consistencyScore || 0), 0);
      const speedScore = completions.reduce((sum, c) => sum + (c.speedScore || 0), 0);

      return {
        userId: user._id,
        username: user.username,
        name: user.name || user.username,
        avatar: user.avatar,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        totalPoints: user.totalPoints || 0,
        weeklyScore,
        monthlyScore,
        consistencyScore,
        speedScore,
      };
    })
  );

  // Define sort key mappings
  const sortKeys = {
    totalPoints: 'totalPoints',
    currentStreak: 'currentStreak',
    weeklyScore: 'weeklyScore',
    monthlyScore: 'monthlyScore',
    consistencyScore: 'consistencyScore',
    speedScore: 'speedScore'
  };

  const sortField = sortKeys[sortBy] || 'totalPoints';

  // Sort descending
  leaderboardData.sort((a, b) => b[sortField] - a[sortField]);

  // Map rank and rank movement details (simulated trend calculation or dynamic trend)
  return leaderboardData.map((entry, idx) => {
    const rank = idx + 1;
    // trend trend: can be up, down, stable based on streak or score comparison
    let trend = 'stable';
    if (entry.currentStreak > 3) trend = 'up';
    
    return {
      ...entry,
      rank,
      trend,
      rankMovement: 0 // placeholder or calculate diff if caching previous ranks
    };
  });
}

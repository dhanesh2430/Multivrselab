const { DateTime } = require('luxon');
const Habit = require('../models/Habit');
const User = require('../models/User');
const Group = require('../models/Group');
const HabitCompletion = require('../models/HabitCompletion');
const Activity = require('../models/Activity');
const { createNotification, broadcastToGroup } = require('../services/notificationService');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getDeadlineInTz = (deadline, timezone, date = DateTime.now()) => {
  const [hour, minute] = deadline.split(':').map(Number);
  const dateInTz = date.setZone(timezone);
  return dateInTz.set({ hour, minute, second: 0, millisecond: 0 });
};

// Calculate completion window start
const getWindowStart = (targetType, timezone) => {
  const nowInTz = DateTime.now().setZone(timezone);
  if (targetType === 'daily') {
    return nowInTz.startOf('day');
  } else {
    // start of week (Monday 00:00)
    return nowInTz.startOf('week');
  }
};

// Calculate points based on Consistency, Speed, and Difficulty
const calculateCompetitivePoints = (streak, deadlineStr, timezone, serverNowUTC, difficulty) => {
  // 1. Consistency Score
  const basePoints = 10;
  const streakMultiplier = Math.min(1 + streak * 0.1, 3.0);
  const consistencyScore = Math.round(basePoints * streakMultiplier);

  // 2. Speed Score
  const nowInTz = serverNowUTC.setZone(timezone);
  const deadlineTz = getDeadlineInTz(deadlineStr, timezone, nowInTz);
  
  let speedScore = 0;
  let isLate = false;

  const msRemaining = deadlineTz.toMillis() - nowInTz.toMillis();
  if (msRemaining > 0) {
    const hoursRemaining = msRemaining / 3600000;
    speedScore = Math.min(Math.floor(hoursRemaining * 5), 50); // cap at 50 pts
    isLate = false;
  } else {
    speedScore = 0;
    isLate = true;
  }

  // 3. Difficulty Multiplier
  let diffMultiplier = 1.0;
  if (difficulty === 'medium') diffMultiplier = 1.5;
  if (difficulty === 'hard') diffMultiplier = 2.0;

  // 4. Milestone Streak Bonuses (Perfect Week/Month)
  let milestoneBonus = 0;
  let milestoneMsg = '';
  if (streak > 0 && streak % 30 === 0) {
    milestoneBonus = 500;
    milestoneMsg = '⭐ Perfect Month Bonus! +500 pts';
  } else if (streak > 0 && streak % 7 === 0) {
    milestoneBonus = 100;
    milestoneMsg = '⭐ Perfect Week Bonus! +100 pts';
  }

  const subtotal = consistencyScore + speedScore;
  const total = Math.round(subtotal * diffMultiplier) + milestoneBonus;

  return {
    consistencyScore,
    speedScore,
    difficultyMultiplier: diffMultiplier,
    milestoneBonus,
    milestoneMsg,
    total,
    isLate
  };
};

// ─────────────────────────────────────────────
// Controllers
// ─────────────────────────────────────────────

// POST /api/habits
exports.createHabit = async (req, res) => {
  try {
    const {
      groupId,
      title,
      description,
      category,
      targetType,
      dailyTarget,
      weeklyTarget,
      reminderTime,
      deadline,
      timezone,
      color,
      icon,
      difficulty
    } = req.body;

    if (!groupId || !title || !deadline || !timezone) {
      return res.status(400).json({ message: 'groupId, title, deadline, and timezone are required.' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (!group.members.map((m) => m.toString()).includes(req.user.id)) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    const habit = await Habit.create({
      groupId,
      userId: req.user.id,
      title,
      description: description || '',
      category: category || 'General',
      targetType: targetType || 'daily',
      dailyTarget: dailyTarget || 1,
      weeklyTarget: weeklyTarget || 5,
      reminderTime: reminderTime || '09:00',
      deadline,
      timezone,
      color: color || '#7C3AED',
      icon: icon || 'Bolt',
      difficulty: difficulty || 'easy',
      isArchived: false,
      completions: []
    });

    // Log activity
    await Activity.create({
      userId: req.user.id,
      groupId,
      habitId: habit._id,
      type: 'habit_started',
      message: `⚡ ${req.user.username} started habit "${title}"!`
    });

    // Socket emission
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      io.to(groupId.toString()).emit('notification', {
        message: `⚡ ${req.user.username} started habit "${title}"!`,
        type: 'default',
        timestamp: new Date().toISOString()
      });
      io.to(groupId.toString()).emit('habitStarted', habit);
    } catch (socketErr) {
      console.warn('Socket creation notification failed:', socketErr.message);
    }

    res.status(201).json({ habit });
  } catch (err) {
    console.error('createHabit error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/habits
exports.getHabits = async (req, res) => {
  try {
    const { groupId } = req.query;
    const filter = { userId: req.user.id, isArchived: false };
    if (groupId) filter.groupId = groupId;

    // Self-correct user streaks lazily
    await exports.verifyAndResetStreak(req.user.id);

    const habits = await Habit.find(filter).sort({ createdAt: -1 });
    res.json({ habits });
  } catch (err) {
    console.error('getHabits error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/habits/:id
exports.editHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const habit = await Habit.findById(id);
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });

    if (habit.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    // List of allowed update fields
    const allowed = [
      'title', 'description', 'category', 'targetType',
      'dailyTarget', 'weeklyTarget', 'reminderTime', 'deadline',
      'timezone', 'color', 'icon', 'difficulty', 'isArchived'
    ];

    allowed.forEach(f => {
      if (updates[f] !== undefined) habit[f] = updates[f];
    });

    await habit.save();

    // Socket updates
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      io.to(habit.groupId.toString()).emit('habitUpdated', habit);
    } catch (sErr) {}

    res.json({ message: 'Habit updated successfully!', habit });
  } catch (err) {
    console.error('editHabit error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/habits/:id
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });
    if (habit.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized.' });

    const groupIdStr = habit.groupId.toString();
    const habitTitle = habit.title;
    await habit.deleteOne();

    // Clean up habit completions
    await HabitCompletion.deleteMany({ habitId: req.params.id });

    // Socket update
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      io.to(groupIdStr).emit('habitDeleted', { habitId: req.params.id });
      io.to(groupIdStr).emit('notification', {
        message: `❌ ${req.user.username} deleted the habit "${habitTitle}"`,
        type: 'default',
        timestamp: new Date().toISOString()
      });
    } catch (sErr) {}

    res.json({ message: 'Habit and completions deleted.' });
  } catch (err) {
    console.error('deleteHabit error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/habits/:id/start — trigger start activity
exports.startHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });
    if (habit.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your habit.' });

    // Broadcast start notification
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      io.to(habit.groupId.toString()).emit('notification', {
        message: `⚡ ${req.user.username} started working on "${habit.title}"!`,
        type: 'default',
        timestamp: new Date().toISOString(),
      });
    } catch (socketErr) {
      console.warn('Socket start broadcast failed:', socketErr.message);
    }

    res.json({ message: 'Started working on habit!' });
  } catch (err) {
    console.error('startHabit error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/habits/:id/complete
exports.completeHabit = async (req, res) => {
  try {
    const serverNowUTC = DateTime.utc();
    const habit = await Habit.findById(req.params.id);

    if (!habit) return res.status(404).json({ message: 'Habit not found.' });
    if (habit.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not your habit.' });

    // 1. Calculate Timezone Completion Windows
    const nowInTz = serverNowUTC.setZone(habit.timezone);
    const windowStart = getWindowStart(habit.targetType, habit.timezone).toJSDate();

    // 2. Concurrency Safe / Idempotent Check: Check if completion exists in current window
    const existingCompletion = await HabitCompletion.findOne({
      habitId: habit._id,
      userId: req.user.id,
      timestamp: { $gte: windowStart }
    });

    if (existingCompletion) {
      return res.status(409).json({ message: 'Habit already completed for this period.' });
    }

    // 3. Calculate Streaks (Daily or Weekly)
    let isStreakMaintained = false;
    let prevWindowStart, prevWindowEnd;

    if (habit.targetType === 'daily') {
      prevWindowStart = DateTime.fromJSDate(windowStart).minus({ days: 1 }).toJSDate();
      prevWindowEnd = windowStart;
    } else {
      prevWindowStart = DateTime.fromJSDate(windowStart).minus({ weeks: 1 }).toJSDate();
      prevWindowEnd = windowStart;
    }

    // Check if user completed this habit in the previous window
    const hadPrevCompletion = await HabitCompletion.findOne({
      habitId: habit._id,
      userId: req.user.id,
      timestamp: { $gte: prevWindowStart, $lt: prevWindowEnd }
    });

    const user = await User.findById(req.user.id);
    let newStreak = 1;

    // If completed yesterday/last week, increment user streak.
    // If not, but last completion was today (double complete shouldn't happen due to check above), keep it.
    // If no recent completion, reset to 1.
    if (hadPrevCompletion) {
      newStreak = user.currentStreak + 1;
      isStreakMaintained = true;
    } else {
      // Check if user has already completed ANY habit today.
      // If yes, their streak is already active/incremented today.
      // If no other completions yesterday, their streak is reset.
      const hasOtherCompletionYesterday = await HabitCompletion.findOne({
        userId: req.user.id,
        timestamp: { $gte: prevWindowStart, $lt: prevWindowEnd }
      });
      if (hasOtherCompletionYesterday) {
        newStreak = user.currentStreak; // keep current streak
      } else {
        newStreak = 1; // reset streak
      }
    }

    // 4. Calculate Scores (Consistency, Speed, Difficulty, and Bonuses)
    const pointsData = calculateCompetitivePoints(
      newStreak,
      habit.deadline,
      habit.timezone,
      serverNowUTC,
      habit.difficulty
    );

    // 5. Atomic DB Writes
    // Create new HabitCompletion document
    const completion = await HabitCompletion.create({
      habitId: habit._id,
      userId: req.user.id,
      groupId: habit.groupId,
      timestamp: serverNowUTC.toJSDate(),
      pointsEarned: pointsData.total,
      consistencyScore: pointsData.consistencyScore,
      speedScore: pointsData.speedScore,
      difficultyMultiplier: pointsData.difficultyMultiplier,
      isLate: pointsData.isLate
    });

    // Push completion summary inside Habit subdocument
    habit.completions.push({
      timestamp: serverNowUTC.toJSDate(),
      pointsEarned: pointsData.total
    });
    await habit.save();

    // Update User Profile cache (totalPoints, currentStreak, longestStreak, habitsCompleted)
    const longestStreak = Math.max(user.longestStreak || 0, newStreak);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $inc: { totalPoints: pointsData.total, habitsCompleted: 1 },
        $set: { currentStreak: newStreak, longestStreak }
      },
      { new: true }
    );

    // 6. Global Rank updates
    const globalRank = await User.countDocuments({ totalPoints: { $gt: updatedUser.totalPoints } }) + 1;
    await User.updateOne({ _id: req.user.id }, { $set: { globalRank } });
    updatedUser.globalRank = globalRank;

    // 7. Write Activity Log
    const completionMsg = `🏆 ${user.username} completed "${habit.title}"! +${pointsData.total} pts (🔥 ${newStreak}-day streak)`;
    await Activity.create({
      userId: req.user.id,
      groupId: habit.groupId,
      habitId: habit._id,
      type: 'habit_completed',
      message: completionMsg
    });

    // 8. Dynamic Overtake & Socket Notification Emits
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      const groupIdStr = habit.groupId.toString();

      // Broadcast new standings to group room
      const groupUpdated = await Group.findById(habit.groupId).populate('members', 'username totalPoints currentStreak longestStreak avatar');
      const leaderboard = groupUpdated.members
        .map((m) => ({
          userId: m._id,
          username: m.username,
          avatar: m.avatar,
          totalPoints: m.totalPoints,
          currentStreak: m.currentStreak,
          longestStreak: m.longestStreak
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

      io.to(groupIdStr).emit('leaderboardUpdate', leaderboard);

      // Emit primary completion notification
      io.to(groupIdStr).emit('notification', {
        message: completionMsg,
        type: 'completion',
        timestamp: serverNowUTC.toISOString(),
      });

      // Send milestone notification if bonus was applied
      if (pointsData.milestoneBonus > 0) {
        // Persistent Notification for milestone
        await createNotification({
          userId: req.user.id,
          type: 'streak_milestone',
          message: `🔥 Milestone! Reached a ${newStreak}-day streak on "${habit.title}"! Earned ${pointsData.milestoneMsg}`,
          data: { habitId: habit._id, streak: newStreak }
        });
        
        io.to(groupIdStr).emit('notification', {
          message: `🔥 ${user.username} reached a ${newStreak}-day streak on "${habit.title}"! ${pointsData.milestoneMsg}`,
          type: 'default',
          timestamp: serverNowUTC.toISOString(),
        });
      }

    } catch (socketErr) {
      console.warn('Socket completeHabit emission failed:', socketErr.message);
    }

    res.json({
      message: 'Habit completed successfully!',
      pointsBreakdown: {
        total: pointsData.total,
        consistencyScore: pointsData.consistencyScore,
        speedBonus: pointsData.speedScore,
        difficultyMultiplier: pointsData.difficultyMultiplier,
        milestoneBonus: pointsData.milestoneBonus,
        isLate: pointsData.isLate,
        newStreak
      },
      totalPoints: updatedUser.totalPoints,
      globalRank
    });
  } catch (err) {
    console.error('completeHabit error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Helper: check user's streak lazily, reset if they missed the completion window
exports.verifyAndResetStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.currentStreak === 0) return;

    // Get user's last habit completion
    const lastCompletion = await HabitCompletion.findOne({ userId }).sort({ timestamp: -1 });
    if (!lastCompletion) {
      await User.updateOne({ _id: userId }, { $set: { currentStreak: 0 } });
      return;
    }

    // Get time elapsed in user local zone
    const now = DateTime.now();
    const lastTime = DateTime.fromJSDate(lastCompletion.timestamp);
    const diffDays = now.diff(lastTime, 'days').days;

    // If more than 1.5 days have elapsed (meaning yesterday and today up to now have been completely missed), reset streak
    if (diffDays > 1.8) {
      await User.updateOne({ _id: userId }, { $set: { currentStreak: 0 } });
    }
  } catch (err) {
    console.error('verifyAndResetStreak error:', err);
  }
};

// GET /api/habits/:id/history — detailed calendar history of completions
exports.getHabitHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const habit = await Habit.findById(id);
    if (!habit) return res.status(404).json({ message: 'Habit not found.' });

    const isMember = habit.userId.toString() === req.user.id;
    if (!isMember) {
      // Check if user is in the same group to view completions
      const group = await Group.findOne({ _id: habit.groupId, members: req.user.id });
      if (!group) return res.status(403).json({ message: 'Not authorized.' });
    }

    const completions = await HabitCompletion.find({ habitId: id }).sort({ timestamp: -1 });

    res.json({ completions });
  } catch (err) {
    console.error('getHabitHistory error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

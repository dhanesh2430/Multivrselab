const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Habit = require('../models/Habit');
const Group = require('../models/Group');
const FriendRequest = require('../models/FriendRequest');
const HabitCompletion = require('../models/HabitCompletion');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/**
 * Calculate user's rank relative to all users by total points.
 */
const getGlobalRank = async (totalPoints) => {
  const count = await User.countDocuments({ totalPoints: { $gt: totalPoints } });
  return count + 1;
};

/**
 * Aggregate stats helper for user profile
 */
const getUserStats = async (userId) => {
  const [friendsCount, groupsJoinedCount, habitsCompleted] = await Promise.all([
    FriendRequest.countDocuments({
      $or: [
        { requesterId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' }
      ]
    }),
    Group.countDocuments({ members: userId }),
    HabitCompletion.countDocuments({ userId })
  ]);
  return { friendsCount, groupsJoinedCount, habitsCompleted };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields are required.' });

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser)
      return res.status(409).json({ message: 'Username or email already in use.' });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      email,
      name: name || username,
      passwordHash: hashedPassword,
      avatar: 'avatar1'
    });
    
    const token = signToken(user);
    const globalRank = await getGlobalRank(0);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        globalRank,
        friendsCount: 0,
        groupsJoinedCount: 0,
        habitsCompleted: 0
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = signToken(user);
    const globalRank = await getGlobalRank(user.totalPoints);
    const stats = await getUserStats(user._id);

    // Sync stats caches on login
    user.friendsCount = stats.friendsCount;
    user.groupsJoinedCount = stats.groupsJoinedCount;
    user.habitsCompleted = stats.habitsCompleted;
    user.globalRank = globalRank;
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        globalRank,
        ...stats
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'User not found, authorization denied.' });
    
    const globalRank = await getGlobalRank(user.totalPoints);
    const stats = await getUserStats(user._id);

    // Sync stats caches in DB atomically to avoid validation errors on excluded fields like passwordHash
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          friendsCount: stats.friendsCount,
          groupsJoinedCount: stats.groupsJoinedCount,
          habitsCompleted: stats.habitsCompleted,
          globalRank: globalRank
        }
      }
    );

    // Keep the in-memory object in sync
    user.friendsCount = stats.friendsCount;
    user.groupsJoinedCount = stats.groupsJoinedCount;
    user.habitsCompleted = stats.habitsCompleted;
    user.globalRank = globalRank;

    const userObj = user.toObject();
    userObj.id = user._id;
    userObj.globalRank = globalRank;
    userObj.friendsCount = stats.friendsCount;
    userObj.groupsJoinedCount = stats.groupsJoinedCount;
    userObj.habitsCompleted = stats.habitsCompleted;

    res.json({ user: userObj });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/auth/profile/:id
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const globalRank = await getGlobalRank(user.totalPoints);
    const stats = await getUserStats(user._id);

    const userObj = user.toObject();
    userObj.id = user._id;
    userObj.globalRank = globalRank;
    userObj.friendsCount = stats.friendsCount;
    userObj.groupsJoinedCount = stats.groupsJoinedCount;
    userObj.habitsCompleted = stats.habitsCompleted;

    const isSelf = req.user.id === id;
    if (!isSelf) {
      delete userObj.email;
    }

    // Fetch user's active habits
    const habits = await Habit.find({ userId: id, isArchived: false }).sort({ createdAt: -1 });

    // Fetch user's groups
    const groups = await Group.find({ members: id }).select('groupName inviteCode description creatorId');

    res.json({
      user: userObj,
      habits,
      groups,
      isSelf,
    });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, username, email, avatar } = req.body;
    const userId = req.user.id;

    // Check username or email clash if they are being updated
    if (username || email) {
      const query = { _id: { $ne: userId } };
      const conditions = [];
      if (username) conditions.push({ username });
      if (email) conditions.push({ email });
      query.$or = conditions;

      const clash = await User.findOne(query);
      if (clash) {
        return res.status(409).json({ message: 'Username or email already in use.' });
      }
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (avatar !== undefined) updates.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(401).json({ message: 'User not found, authorization denied.' });
    }

    const globalRank = await getGlobalRank(updatedUser.totalPoints);
    const stats = await getUserStats(updatedUser._id);

    const userObj = updatedUser.toObject();
    userObj.id = updatedUser._id;
    userObj.globalRank = globalRank;
    userObj.friendsCount = stats.friendsCount;
    userObj.groupsJoinedCount = stats.groupsJoinedCount;
    userObj.habitsCompleted = stats.habitsCompleted;

    res.json({ message: 'Profile updated successfully! 👤', user: userObj });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Server error during profile update.' });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'User not found, authorization denied.' });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully! 🔑' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Server error during password update.' });
  }
};

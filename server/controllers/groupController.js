const Group = require('../models/Group');
const User = require('../models/User');
const Habit = require('../models/Habit');
const HabitCompletion = require('../models/HabitCompletion');
const Activity = require('../models/Activity');
const { createNotification, broadcastToGroup } = require('../services/notificationService');

// Generate unique 6-character alphanumeric invite code
const generateInviteCode = async () => {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Ensure code length is 6 characters
    if (code.length !== 6) continue;
    const existing = await Group.findOne({ inviteCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

// POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { groupName, description } = req.body;
    if (!groupName) return res.status(400).json({ message: 'Group name is required.' });

    const inviteCode = await generateInviteCode();

    const group = await Group.create({
      groupName,
      description: description || '',
      creatorId: req.user.id,
      members: [req.user.id],
      inviteCode
    });

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      groupId: group._id,
      type: 'group_joined',
      message: `🏆 ${req.user.username} created the group "${groupName}"!`
    });

    res.status(201).json({ message: 'Group created successfully! 🏆', group });
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/groups/join
exports.joinGroupByCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required.' });

    const group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!group) return res.status(404).json({ message: 'Group with this invite code not found.' });

    // Check if user is already a member
    const isMember = group.members.map(m => m.toString()).includes(req.user.id);
    if (isMember) {
      return res.status(409).json({ message: 'You are already a member of this group.', group });
    }

    group.members.push(req.user.id);
    await group.save();

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      groupId: group._id,
      type: 'group_joined',
      message: `⚡ ${req.user.username} joined the group!`
    });

    // Notify other group members via Socket
    broadcastToGroup(group._id, `⚡ ${req.user.username} joined the group!`, 'default');

    res.json({ message: `Successfully joined "${group.groupName}"! 🎉`, group });
  } catch (err) {
    console.error('joinGroupByCode error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/groups/:id/invite
exports.inviteToGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ message: 'User identifier is required.' });
    }

    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.map(m => m.toString()).includes(req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to invite others.' });
    }

    // Find invitee
    let invitee = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(userInput)) {
      invitee = await User.findById(userInput);
    }
    if (!invitee) {
      invitee = await User.findOne({
        $or: [
          { username: { $regex: `^${userInput}$`, $options: 'i' } },
          { email: userInput.toLowerCase() },
        ],
      });
    }

    if (!invitee) return res.status(404).json({ message: `No user found matching "${userInput}".` });

    const alreadyMember = group.members.map(m => m.toString()).includes(invitee._id.toString());
    if (alreadyMember) {
      return res.status(409).json({ message: `${invitee.username} is already a member.` });
    }

    // Direct add for simplicity (as in earlier version) or send a pending invite
    // Direct add is fine, let's keep direct add to match the previous socket trigger,
    // but also create a persistent notification in their feed!
    group.members.push(invitee._id);
    await group.save();

    // Create Notification for the invitee
    await createNotification({
      userId: invitee._id,
      type: 'group_invite',
      message: `👥 ${req.user.username} added you to the group "${group.groupName}"!`,
      data: { groupId: group._id }
    });

    // Log Activity
    await Activity.create({
      userId: invitee._id,
      groupId: group._id,
      type: 'group_joined',
      message: `⚡ ${invitee.username} was added to the group by ${req.user.username}!`
    });

    // Emit socket event to the group
    broadcastToGroup(group._id, `⚡ ${invitee.username} joined the group!`, 'default');

    res.json({ message: `${invitee.username} added to group successfully! 🎉`, group });
  } catch (err) {
    console.error('inviteToGroup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/groups/:id/regenerate-code
exports.regenerateInviteCode = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Only creator can regenerate code
    if (group.creatorId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the group creator can regenerate the invite code.' });
    }

    const newCode = await generateInviteCode();
    group.inviteCode = newCode;
    await group.save();

    res.json({ message: 'Invite code regenerated successfully! 🔄', inviteCode: newCode });
  } catch (err) {
    console.error('regenerateInviteCode error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/groups/:id/leave
exports.leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.map(m => m.toString()).includes(req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this group.' });
    }

    // Remove member
    group.members = group.members.filter(m => m.toString() !== req.user.id);

    // If no members left, delete the group
    if (group.members.length === 0) {
      await group.deleteOne();
      // Archive or delete group habits
      await Habit.updateMany({ groupId: id }, { $set: { isArchived: true } });
      return res.json({ message: 'Left the group. Group was deleted as there were no members left.' });
    }

    // If user is creator, re-assign creatorId to another member
    if (group.creatorId.toString() === req.user.id) {
      group.creatorId = group.members[0];
    }

    await group.save();

    // Log Activity
    await Activity.create({
      userId: req.user.id,
      groupId: group._id,
      type: 'group_joined',
      message: `🚪 ${req.user.username} left the group.`
    });

    broadcastToGroup(group._id, `🚪 ${req.user.username} left the group.`, 'default');

    res.json({ message: 'Successfully left the group.' });
  } catch (err) {
    console.error('leaveGroup error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/groups — get all groups the current user belongs to
exports.getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'username email name avatar totalPoints currentStreak')
      .populate('creatorId', 'username name');

    res.json({ groups });
  } catch (err) {
    console.error('getMyGroups error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/groups/:id/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate(
      'members',
      'username email name avatar totalPoints currentStreak longestStreak'
    );
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    // Dynamic leaderboard sorted by points
    const leaderboard = group.members
      .map((m) => ({
        userId: m._id,
        username: m.username,
        name: m.name || m.username,
        avatar: m.avatar,
        totalPoints: m.totalPoints,
        currentStreak: m.currentStreak,
        longestStreak: m.longestStreak
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    res.json({ leaderboard });
  } catch (err) {
    console.error('getLeaderboard error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/groups/:id/details — detailed view of group and statistics
exports.getGroupDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findById(id)
      .populate('members', 'username email name avatar totalPoints currentStreak longestStreak')
      .populate('creatorId', 'username name');
      
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const isMember = group.members.map(m => m._id.toString()).includes(req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this group.' });
    }

    // Fetch active habits inside group
    const habits = await Habit.find({ groupId: id, isArchived: false })
      .populate('userId', 'username name avatar');

    // Fetch recent completions in group
    const completions = await HabitCompletion.find({ groupId: id })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'username name avatar')
      .populate('habitId', 'title');

    // Fetch group activity logs
    const activities = await Activity.find({ groupId: id })
      .sort({ timestamp: -1 })
      .limit(30)
      .populate('userId', 'username name avatar');

    // Calculate group statistics
    const totalPointsEarned = completions.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const averageStreak = Math.round(
      group.members.reduce((acc, curr) => acc + curr.currentStreak, 0) / group.members.length
    );

    res.json({
      group,
      habits,
      recentCompletions: completions,
      activities,
      statistics: {
        totalCompletionsCount: completions.length,
        totalPointsEarned,
        averageStreak,
        membersCount: group.members.length
      }
    });
  } catch (err) {
    console.error('getGroupDetails error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

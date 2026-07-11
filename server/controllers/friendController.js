const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// GET /api/friends/search?q=username
exports.searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2)
      return res.status(400).json({ message: 'Search query must be at least 2 characters.' });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
      _id: { $ne: req.user.id }, // exclude self
    }).select('username email name avatar totalPoints currentStreak').limit(10);

    // For each user, retrieve the friendship status relative to the current user
    const usersWithStatus = await Promise.all(
      users.map(async (u) => {
        const uObj = u.toObject();
        const relationship = await FriendRequest.findOne({
          $or: [
            { requesterId: req.user.id, recipientId: u._id },
            { requesterId: u._id, recipientId: req.user.id }
          ]
        });
        uObj.friendStatus = relationship ? relationship.status : 'none';
        uObj.isRequester = relationship ? relationship.requesterId.toString() === req.user.id : false;
        uObj.friendshipId = relationship ? relationship._id : null;
        return uObj;
      })
    );

    res.json({ users: usersWithStatus });
  } catch (err) {
    console.error('searchUsers error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/friends/request
exports.sendRequest = async (req, res) => {
  try {
    const { recipient: recipientInput } = req.body;
    const requesterId = req.user.id;

    if (!recipientInput)
      return res.status(400).json({ message: 'Recipient username, email, or ID is required.' });

    let recipient = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(recipientInput)) {
      recipient = await User.findById(recipientInput);
    }
    if (!recipient) {
      recipient = await User.findOne({
        $or: [
          { username: { $regex: `^${recipientInput}$`, $options: 'i' } },
          { email: recipientInput.toLowerCase() },
        ],
      });
    }

    if (!recipient)
      return res.status(404).json({ message: `No user found matching "${recipientInput}".` });

    const recipientId = recipient._id.toString();
    if (requesterId === recipientId)
      return res.status(400).json({ message: 'Cannot send a friend request to yourself.' });

    // Check existing
    let existing = await FriendRequest.findOne({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ message: `You are already friends with ${recipient.username}.` });
      }
      if (existing.status === 'pending') {
        if (existing.requesterId.toString() === requesterId) {
          return res.status(400).json({ message: 'Friend request is already pending.' });
        } else {
          // The other user had already sent a request to us, so let's accept it instead!
          existing.status = 'accepted';
          await existing.save();
          
          // Send notification
          await createNotification({
            userId: recipientId,
            type: 'friend_accepted',
            message: `🤝 ${req.user.username} accepted your friend request!`,
            data: { requesterId }
          });

          return res.status(200).json({
            message: `You accepted ${recipient.username}'s pending friend request! 🎉`,
            friendship: existing,
            status: 'accepted'
          });
        }
      }
      // If cancelled or declined, we can revive it
      existing.requesterId = requesterId;
      existing.recipientId = recipientId;
      existing.status = 'pending';
      await existing.save();
    } else {
      existing = await FriendRequest.create({ requesterId, recipientId });
    }

    // Send real-time notification
    await createNotification({
      userId: recipientId,
      type: 'friend_request',
      message: `✉️ ${req.user.username} sent you a friend request.`,
      data: { requesterId }
    });

    res.status(201).json({
      message: `Friend request sent to ${recipient.username}! ✉️`,
      friendship: existing,
      status: 'pending'
    });
  } catch (err) {
    console.error('sendRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/friends/respond
exports.respondToRequest = async (req, res) => {
  try {
    const { friendshipId, status } = req.body;
    if (!['accepted', 'declined'].includes(status))
      return res.status(400).json({ message: 'Status must be "accepted" or "declined".' });

    const request = await FriendRequest.findById(friendshipId);
    if (!request) return res.status(404).json({ message: 'Friend request not found.' });

    if (request.recipientId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized to respond to this request.' });

    if (status === 'accepted') {
      request.status = 'accepted';
      await request.save();

      // Send accepted notification to the requester
      await createNotification({
        userId: request.requesterId,
        type: 'friend_accepted',
        message: `🤝 ${req.user.username} accepted your friend request!`,
        data: { recipientId: req.user.id }
      });
      
      res.json({ message: 'Friend request accepted! 🎉', friendship: request });
    } else {
      // If declined, delete the document to allow sending request again in the future
      await request.deleteOne();
      res.json({ message: 'Friend request declined.' });
    }
  } catch (err) {
    console.error('respondToRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/friends/request/:id — Cancel pending request
exports.cancelRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findOne({
      _id: req.params.id,
      requesterId: req.user.id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ message: 'Pending request not found or not created by you.' });
    }

    await request.deleteOne();
    res.json({ message: 'Friend request cancelled successfully.' });
  } catch (err) {
    console.error('cancelRequest error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/friends/:id — Remove friend
exports.removeFriend = async (req, res) => {
  try {
    const friendship = await FriendRequest.findOne({
      _id: req.params.id,
      status: 'accepted',
      $or: [
        { requesterId: req.user.id },
        { recipientId: req.user.id }
      ]
    });

    if (!friendship) {
      return res.status(404).json({ message: 'Friend connection not found.' });
    }

    const otherUserId = friendship.requesterId.toString() === req.user.id 
      ? friendship.recipientId 
      : friendship.requesterId;

    await friendship.deleteOne();

    // Notify the other user (informal status update)
    try {
      const { getIO } = require('../sockets/socketHandler');
      const io = getIO();
      io.to(`user_${otherUserId}`).emit('friendRemoved', { friendId: req.user.id });
    } catch (socketErr) {
      console.warn('Socket alert failed for removeFriend:', socketErr.message);
    }

    res.json({ message: 'Friend removed successfully.' });
  } catch (err) {
    console.error('removeFriend error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/friends — get all accepted friends
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendships = await FriendRequest.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: 'accepted',
    })
      .populate('requesterId', 'username email name avatar totalPoints currentStreak')
      .populate('recipientId', 'username email name avatar totalPoints currentStreak');

    const friends = friendships.map((f) => {
      const other = f.requesterId._id.toString() === userId ? f.recipientId : f.requesterId;
      const otherObj = other.toObject();
      otherObj.friendshipId = f._id;
      return otherObj;
    });

    res.json({ friends });
  } catch (err) {
    console.error('getFriends error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/friends/pending — get received pending requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      recipientId: req.user.id,
      status: 'pending',
    }).populate('requesterId', 'username email name avatar totalPoints currentStreak');

    res.json({ requests });
  } catch (err) {
    console.error('getPendingRequests error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/friends/sent — get sent pending requests
exports.getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      requesterId: req.user.id,
      status: 'pending',
    }).populate('recipientId', 'username email name avatar totalPoints currentStreak');

    res.json({ requests });
  } catch (err) {
    console.error('getSentRequests error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

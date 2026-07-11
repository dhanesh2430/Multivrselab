const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index to prevent duplicate combinations
friendRequestSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

module.exports = mongoose.model('FriendRequest', friendRequestSchema);

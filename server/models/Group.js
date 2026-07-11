const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    groupName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    inviteCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Group', groupSchema);

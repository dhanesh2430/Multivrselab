const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createGroup,
  joinGroupByCode,
  inviteToGroup,
  regenerateInviteCode,
  leaveGroup,
  getMyGroups,
  getLeaderboard,
  getGroupDetails
} = require('../controllers/groupController');
const { groupValidator } = require('../validators/inputValidators');

router.post('/', auth, groupValidator, createGroup);
router.post('/join', auth, joinGroupByCode);
router.post('/:id/invite', auth, inviteToGroup);
router.post('/:id/regenerate-code', auth, regenerateInviteCode);
router.post('/:id/leave', auth, leaveGroup);
router.get('/', auth, getMyGroups);
router.get('/:id/leaderboard', auth, getLeaderboard);
router.get('/:id/details', auth, getGroupDetails);

module.exports = router;

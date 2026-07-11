const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getGlobalLeaderboard, getGroupLeaderboard } = require('../controllers/leaderboardController');

router.get('/', auth, getGlobalLeaderboard);
router.get('/group/:groupId', auth, getGroupLeaderboard);

module.exports = router;

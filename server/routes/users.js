const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for users by username
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Username or partial username to search for
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       totalPoints:
 *                         type: number
 *                       currentStreak:
 *                         type: number
 */
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim().length === 0) {
      return res.status(400).json({ message: 'Username query parameter is required.' });
    }

    const searchTerm = username.trim();

    // Query database with performant case-insensitive regex match
    // Only select the required fields (_id is returned as id)
    // Avoid returning any sensitive information (passwordHash, email, name, avatar, etc.)
    const users = await User.find({
      username: { $regex: searchTerm, $options: 'i' }
    })
    .select('username totalPoints currentStreak')
    .limit(20);

    const safeUsers = users.map(user => ({
      id: user._id,
      username: user.username,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak
    }));

    res.json({ users: safeUsers });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ message: 'Server error during user search.' });
  }
});

module.exports = router;

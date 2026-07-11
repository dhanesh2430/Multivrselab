const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendRequest,
  respondToRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  searchUsers,
  cancelRequest,
  removeFriend
} = require('../controllers/friendController');

router.get('/search', auth, searchUsers);
router.post('/request', auth, sendRequest);
router.put('/respond', auth, respondToRequest);
router.get('/', auth, getFriends);
router.get('/pending', auth, getPendingRequests);
router.get('/sent', auth, getSentRequests);
router.delete('/request/:id', auth, cancelRequest);
router.delete('/:id', auth, removeFriend);

module.exports = router;

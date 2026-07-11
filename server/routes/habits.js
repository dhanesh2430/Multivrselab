const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createHabit,
  getHabits,
  editHabit,
  deleteHabit,
  startHabit,
  completeHabit,
  getHabitHistory
} = require('../controllers/habitController');
const { habitValidator } = require('../validators/inputValidators');

router.post('/', auth, habitValidator, createHabit);
router.get('/', auth, getHabits);
router.put('/:id', auth, habitValidator, editHabit);
router.delete('/:id', auth, deleteHabit);
router.post('/:id/start', auth, startHabit);
router.post('/:id/complete', auth, completeHabit);
router.get('/:id/history', auth, getHabitHistory);

module.exports = router;

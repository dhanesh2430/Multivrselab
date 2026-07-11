const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  profileUpdateValidator,
  changePasswordValidator
} = require('../validators/inputValidators');

router.post('/register', registerValidator, register);
router.post('/signup', registerValidator, register);
router.post('/login', loginValidator, login);
router.get('/me', auth, getMe);
router.get('/profile/:id', auth, getProfile);
router.put('/profile', auth, profileUpdateValidator, updateProfile);
router.put('/password', auth, changePasswordValidator, changePassword);

module.exports = router;

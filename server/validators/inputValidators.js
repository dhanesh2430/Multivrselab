const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginValidator = [
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

const profileUpdateValidator = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
    .isAlphanumeric().withMessage('Username must be alphanumeric'),
  body('email')
    .optional()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('avatar')
    .optional()
    .trim(),
  validate
];

const changePasswordValidator = [
  body('oldPassword')
    .notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validate
];

const habitValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('category')
    .optional()
    .trim(),
  body('targetType')
    .optional()
    .isIn(['daily', 'weekly']).withMessage('Target type must be daily or weekly'),
  body('dailyTarget')
    .optional()
    .isInt({ min: 1 }).withMessage('Daily target must be at least 1'),
  body('weeklyTarget')
    .optional()
    .isInt({ min: 1 }).withMessage('Weekly target must be at least 1'),
  body('reminderTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Reminder time must be in HH:MM format'),
  body('deadline')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Deadline must be in HH:MM format'),
  body('timezone')
    .notEmpty().withMessage('Timezone is required'),
  body('color')
    .optional()
    .matches(/^#([0-9a-f]{3}){1,2}$/i).withMessage('Color must be a valid hex code'),
  body('icon')
    .optional()
    .trim(),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
  validate
];

const groupValidator = [
  body('groupName')
    .trim()
    .notEmpty().withMessage('Group name is required')
    .isLength({ min: 3, max: 50 }).withMessage('Group name must be between 3 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  profileUpdateValidator,
  changePasswordValidator,
  habitValidator,
  groupValidator
};

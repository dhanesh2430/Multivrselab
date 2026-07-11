const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LeaderHabit API Documentation',
      version: '1.0.0',
      description: 'API documentation for the LeaderHabit gamified group habit tracker. Learn and test authentication, social, group lobby, and gamified habit tracking endpoints.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Type "Bearer <token>" to authenticate requests.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            totalPoints: { type: 'number' },
            currentStreak: { type: 'number' },
          },
        },
        Habit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            groupId: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            deadline: { type: 'string' },
            timezone: { type: 'string' },
            completions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', format: 'date-time' },
                  pointsEarned: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js', './swagger.js'], // Scan routes and this config file
};

// We will document all routes right here using JSDoc tags to make it clean,
// because swagger-jsdoc parses files for Swagger JSDoc comments.

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [username, email, password]
 *             properties:
 *               username: { type: 'string' }
 *               email: { type: 'string' }
 *               password: { type: 'string' }
 *     responses:
 *       201:
 *         description: User registered successfully, returns token
 *       409:
 *         description: Username or email already in use
 *
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [email, password]
 *             properties:
 *               email: { type: 'string' }
 *               password: { type: 'string' }
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user details
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized
 *
 * /api/friends:
 *   get:
 *     summary: List all accepted friends
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of friends
 *
 * /api/friends/pending:
 *   get:
 *     summary: Get pending friend requests
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of pending requests
 *
 * /api/friends/search:
 *   get:
 *     summary: Search users by username or email
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query (username or email)
 *     responses:
 *       200:
 *         description: Array of matching users
 *
 * /api/friends/request:
 *   post:
 *     summary: Send a friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [recipient]
 *             properties:
 *               recipient: { type: 'string', description: 'Username, Email, or User ID' }
 *     responses:
 *       201:
 *         description: Request sent
 *
 * /api/friends/respond:
 *   put:
 *     summary: Accept or decline a friend request
 *     tags: [Friends]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [friendshipId, status]
 *             properties:
 *               friendshipId: { type: 'string' }
 *               status: { type: 'string', enum: [accepted, declined] }
 *     responses:
 *       200:
 *         description: Action processed
 *
 * /api/groups:
 *   get:
 *     summary: Get user groups
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User groups
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [groupName]
 *             properties:
 *               groupName: { type: 'string' }
 *     responses:
 *       201:
 *         description: Group created
 *
 * /api/groups/{id}/invite:
 *   post:
 *     summary: Invite a user to a group
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [userId]
 *             properties:
 *               userId: { type: 'string', description: 'Username, Email, or User ID' }
 *     responses:
 *       200:
 *         description: User invited

 *
 * /api/groups/{id}/leaderboard:
 *   get:
 *     summary: Get group leaderboard
 *     tags: [Groups]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Leaderboard entries sorted by points
 *
 * /api/habits:
 *   get:
 *     summary: Get habits
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema: { type: 'string' }
 *         description: Group ID (optional filter)
 *     responses:
 *       200:
 *         description: Habits list
 *   post:
 *     summary: Create a new habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             required: [groupId, title, deadline, timezone]
 *             properties:
 *               groupId: { type: 'string' }
 *               title: { type: 'string' }
 *               deadline: { type: 'string', example: '20:00' }
 *               timezone: { type: 'string', example: 'America/New_York' }
 *     responses:
 *       201:
 *         description: Habit created
 *
 * /api/habits/{id}/start:
 *   post:
 *     summary: Broadcast that a user has started working on a habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Start notification broadcasted successfully
 *
 * /api/habits/{id}/complete:
 *   post:
 *     summary: Mark a habit completed (triggers gamified logic & streaks)
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Habit completed with point breakdown
 *
 * /api/habits/{id}:
 *   delete:
 *     summary: Delete a habit
 *     tags: [Habits]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Habit deleted
 */

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  // Serve interactive UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('[Swagger] Docs ready at http://localhost:5000/docs');
};

module.exports = setupSwagger;

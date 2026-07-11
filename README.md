# HabitForge 🔥

A **real-time, gamified group habit tracker** with live leaderboards, streak scoring, speed bonuses, difficulty multipliers, and social accountability — built with React 19 + Vite + Material UI v9 on the frontend and Node.js + Express + MongoDB + Socket.io on the backend.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material UI v9 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | bcryptjs + JSON Web Tokens |
| Real-Time | Socket.io |
| Timezone Math | Luxon |

---

## Project Structure

```
Multivrselab/
├── client/          ← React 19 + Vite frontend
│   └── src/
│       ├── api/          axios.js
│       ├── components/   Navbar, HabitTracker, Leaderboard,
│       │                 NotificationFeed, FriendManager,
│       │                 GroupManager, CreateHabitDialog
│       ├── context/      AuthContext, SocketContext
│       ├── pages/        LoginPage, RegisterPage, DashboardPage, GroupPage, HabitDetailsPage
│       ├── App.jsx
│       ├── main.jsx
│       └── theme.js
└── server/          ← Node.js + Express backend
    ├── controllers/  authController, friendController,
    │                 groupController, habitController, notificationController, leaderboardController
    ├── middleware/   auth.js (JWT guard)
    ├── models/       User, FriendRequest, Group, Habit, Notification, HabitCompletion, Leaderboard, Activity
    ├── routes/       auth, friends, groups, habits, notifications, leaderboard
    ├── sockets/      socketHandler.js
    ├── validators/   inputValidators.js
    ├── .env
    └── index.js
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on `mongodb://localhost:27017` (The server fallback uses an in-memory MongoDB runner automatically if local Mongo is unavailable!)

### 1. Start the Backend

```bash
cd server
npm install
npm run dev   # starts with nodemon on port 5000
```

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev   # starts Vite on port 5173
```

Open **http://localhost:5173** in your browser.

---

## Point Scoring Formula

Our competitive scoring model evaluates consistency, completion speed, difficulty, and milestone streaks:

### 1. Consistency Score (C)
- Base: **10 pts** per completion.
- Streak multiplier: `1 + (streak × 0.1)`, capped at **3.0×**.

### 2. Speed Score (S)
- Bonus for completing **before** your local deadline.
- `speedBonus = min(hoursRemaining × 5, 50 pts)`.
- If completed after deadline (late check-in), speed score is `0` (streak is kept).

### 3. Difficulty Multiplier (D)
- `easy` (1.0x points subtotal)
- `medium` (1.5x points subtotal)
- `hard` (2.0x points subtotal)

### 4. Milestone Bonuses
- **Perfect Week Bonus:** reaching a 7-day streak milestone awards **+100 pts**.
- **Perfect Month Bonus:** reaching a 30-day streak milestone awards **+500 pts**.

**Total Score Formula:**
$$\text{Total Points} = \text{round}( ( \text{Consistency Score} + \text{Speed Score} ) \times \text{Difficulty Multiplier} ) + \text{Milestone Bonus}$$

---

## REST API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | ✓ | Get current user |
| GET | `/api/auth/profile/:id` | ✓ | Retrieve player profile stats |
| PUT | `/api/auth/profile` | ✓ | Update name, username, email, emoji avatar |
| PUT | `/api/auth/password` | ✓ | Change user password securely |
| GET | `/api/friends` | ✓ | List accepted friends |
| GET | `/api/friends/pending` | ✓ | List received pending friend invites |
| GET | `/api/friends/sent` | ✓ | List sent pending friend requests |
| POST | `/api/friends/request` | ✓ | Send a friend request |
| PUT | `/api/friends/respond` | ✓ | Accept or decline request |
| DELETE | `/api/friends/request/:id` | ✓ | Cancel a sent request |
| DELETE | `/api/friends/:id` | ✓ | Remove an accepted friend |
| POST | `/api/groups` | ✓ | Create habit lobby |
| POST | `/api/groups/join` | ✓ | Join group via invite code |
| POST | `/api/groups/:id/invite` | ✓ | Add user directly to group |
| POST | `/api/groups/:id/regenerate-code` | ✓ | Regenerate group code (creator only) |
| POST | `/api/groups/:id/leave` | ✓ | Leave a group |
| GET | `/api/groups` | ✓ | Get user's groups |
| GET | `/api/groups/:id/details` | ✓ | Fetch detailed group stats/timeline |
| POST | `/api/habits` | ✓ | Create habit |
| GET | `/api/habits` | ✓ | Fetch user's habits |
| PUT | `/api/habits/:id` | ✓ | Edit habit details |
| DELETE | `/api/habits/:id` | ✓ | Delete habit & completions history |
| POST | `/api/habits/:id/start` | ✓ | Broadcast start action to lobby |
| POST | `/api/habits/:id/complete` | ✓ | Check-in habit completion (gamified) |
| GET | `/api/habits/:id/history` | ✓ | Get 30-day calendar completion list |
| GET | `/api/notifications` | ✓ | Get all user notifications |
| PUT | `/api/notifications/:id/read` | ✓ | Mark notification as read |
| PUT | `/api/notifications/read-all` | ✓ | Mark all notifications as read |
| DELETE | `/api/notifications` | ✓ | Clear notification feed |
| GET | `/api/leaderboard` | ✓ | Get global leaderboards |
| GET | `/api/leaderboard/group/:groupId` | ✓ | Get group rankings |

---

## Socket.io Events Reference

| Event | Direction | Description |
|-------|-----------|-------------|
| `joinGroup` | Client → Server | Joins the room for group timeline feeds |
| `typing` | Client → Server | Notifies group members user is composing |
| `userTyping` | Server → Client | Renders live group typing indicator |
| `userOnline` | Server → Client | Broadcasts user online status indicator |
| `userOffline` | Server → Client | Broadcasts user offline status |
| `notification` | Server → Client | Real-time notifications and feed messages |
| `unreadCountUpdate` | Server → Client | Real-time updates to unread badge indicator |
| `leaderboardUpdate` | Server → Client | Live re-sorted points array |

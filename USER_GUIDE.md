# HabitForge 🔥 — User & Operations Guide

Welcome to **HabitForge**! This document provides instructions on how to navigate the application, configure your habits, manage social lobbies, and master the competitive scoring mechanics.

---

## Table of Contents
1. [Registering & Customizing Your Profile](#1-registering--customizing-your-profile)
2. [Managing Lobbies (Groups)](#2-managing-lobbies-groups)
3. [Configuring & Tracking Habits](#3-configuring--tracking-habits)
4. [Mastering the Competitive Scoring Model](#4-mastering-the-competitive-scoring-model)
5. [The Social & Friendship System](#5-the-social--friendship-system)
6. [Real-Time Socket Alerts & Notifications](#6-real-time-socket-alerts--notifications)

---

## 1. Registering & Customizing Your Profile

### Creating an Account
1. Open the application in your browser (defaults to `http://localhost:5173`).
2. Click **Sign Up** to create a new profile. Enter your chosen username, email, display name, and password.
3. Upon registration, you are automatically logged in and start at **0 points** with a global rank of `#1`.

### Customizing Your Profile & Avatar Presets
1. Click the User Avatar icon in the top-right corner of the navigation bar and select **My Profile** (or navigate to `/profile/<your-id>`).
2. On your Profile Page, you'll see a performance dashboard containing your **Current Streak**, **Longest Streak**, **Total Completions**, and **Global Rank**.
3. Click **Edit Profile** to change your display name, username, or email.
4. **Choose Your Avatar Emoji:** Select one of the preset avatar emojis to personalize your presence across all leaderboards and activity streams:
   * 🦊 (Fox)
   * 🐱 (Cat)
   * 🐨 (Koala)
   * 🦁 (Lion)
   * 🐼 (Panda)
   * 🐸 (Frog)
5. Click **Change Password** to update your password securely.

---

## 2. Managing Lobbies (Groups)

HabitForge centers around "Lobbies" (Groups). Lobbies allow you to compete directly with friends on shared challenges.

### Creating a Lobby
1. On the main Dashboard page, click the **Groups & Friends** button to open the slide-out Manager Drawer.
2. In the **Groups** tab, enter a name (e.g. *Morning Routine*) in the **New group name** field and click **Create**.
3. The lobby is created, and you are assigned as the Owner. A unique 6-character **Invite Code** (e.g., `A9B8C7`) is generated automatically.

### Inviting Friends
* **Invite Code:** Copy your unique invite code and send it to your friends.
* **Direct Add:** From the Lobby Manager, enter your friend's username in the **Add user directly** input field and click **Add** to add them to the group instantly.

### Joining a Lobby
1. Open the **Groups & Friends** drawer.
2. Under the Groups tab, paste the 6-character code into the **Enter Invite Code** field and click **Join**.
3. You will immediately join the lobby and appear on the group's Live Leaderboard.

### Checking Group Details
1. Select a group in the drawer, and click **Lobby Info** on the dashboard.
2. This opens the dedicated **Group Page** (`/group/<id>`) containing:
   * Live group leaderboards.
   * Group performance aggregates (Total points scored by members, average streak).
   * A live **Lobby Activity Log** timeline stream.
   * Recent completed habit check-ins.

---

## 3. Configuring & Tracking Habits

### Creating a Habit
1. Select your active group lobby on the dashboard.
2. Click the **Add Habit** button.
3. Fill out the habit parameters:
   * **Title & Description:** Specify what you need to do (e.g. *100 Push-ups*).
   * **Category:** Group habits under categories (e.g. *Fitness, Health, Learning, Productive, Social, Mind*).
   * **Difficulty:** Choose `easy`, `medium`, or `hard`. Harder difficulty habits apply a **2.0x points multiplier**!
   * **Target Period:** Set whether the habit is checked **Daily** or **Weekly**.
   * **Timezone:** Ensure the timezone matches your current location for correct deadline evaluations.
   * **Deadline Time (HH:MM):** The local 24-hour time cutoff (e.g., `20:00` for 8 PM) on that day/week.
   * **Reminder Time (HH:MM):** Receive standard notification reminders.
   * **Theme Color:** Pick a color preset to highlight the habit card.

### Tracking Work in Real Time
1. **Starting work:** Before completing, click the **Start** button on the habit card. This broadcasts a live event: `⚡ <Username> started working on "<Habit Title>"!` to all online lobby members.
2. **Completing a Habit:** Click the **Check Circle icon** (checkmark) on the habit card.
   * The app will check if you have checked in within the current day/week window to prevent duplicates.
   * Points are awarded instantly based on the [Competitive Scoring Model](#4-mastering-the-competitive-scoring-model).
   * A visual float animation (e.g. `+56`) displays the points earned.
   * An activity is logged to the lobby feed: `🏆 <Username> completed "<Habit Title>"! +56 pts (🔥 3-day streak)`.
3. **Tracking History:** Click the information icon on the habit card or go to the habit details page (`/habit/<id>`) to view:
   * An interactive **30-Day Consistency Grid Map** (days you checked in are filled with your chosen theme color).
   * A detailed history logs table displaying exact timestamps and point breakdowns.

---

## 4. Mastering the Competitive Scoring Model

HabitForge uses a scoring formula designed to reward consistency, speed, and challenge:

### Point Breakdown Formula
$$\text{Total Points} = \text{round}( ( \text{Consistency Points} + \text{Speed Bonus} ) \times \text{Difficulty Multiplier} ) + \text{Milestone Bonus}$$

1. **Consistency Score (Base 10):**
   * Multiplier starts at `1.0x` and increases by `0.1x` for every consecutive day in your streak, capped at `3.0x` (at a 20-day streak).
   * *Formula:* $\text{Consistency Points} = \text{round}(10 \times \min(1 + \text{streak} \times 0.1, 3.0))$
2. **Speed Bonus (Up to +50 points):**
   * Rewarded for completing habits *before* your set deadline.
   * Earn **+5 points** for each hour remaining before the deadline.
   * If completed after the deadline (late check-in), speed score is `0`, but your streak remains active.
3. **Difficulty Multipliers:**
   * **Easy:** `1.0x` multiplier
   * **Medium:** `1.5x` multiplier
   * **Hard:** `2.0x` multiplier
4. **Streak Milestones:**
   * **Perfect Week Bonus:** Reaching a streak that is a multiple of 7 (7, 14, 21, etc.) awards **+100 bonus points**.
   * **Perfect Month Bonus:** Reaching a streak that is a multiple of 30 awards **+500 bonus points**.

---

## 5. The Social & Friendship System

Open the **Groups & Friends** drawer and click the **Friends** tab to access the social panel.

### Inviting Friends
1. Search for players by typing their username or email into the search bar.
2. Results display the player's name, points, and friendship status:
   * Click **Add** to send a friend request.
   * If a user is already pending or a friend, appropriate badges are shown.
3. In the friends list:
   * **Pending Invites Received:** Accept (`✓`) or decline (`✗`) incoming requests.
   * **Pending Sent Invites:** Review requests you sent and cancel them if needed.

### Live Online Registries
* A **live green status dot** is displayed next to avatars on all group page tables and profile headers if the player is currently online.
* Real-time events trigger online/offline status updates dynamically.

---

## 6. Real-Time Socket Alerts & Notifications

The header navigation bar features a **Bell Icon** representing your personal notifications feed.

### Notification Types
* **Friend Requests:** Received when someone invites you.
* **Friend Accepted:** Received when a request is accepted.
* **Group Invites:** Received when someone adds you to a lobby group.
* **Milestones:** Received when you hit a streak milestone (Perfect Week/Month).

### Management Actions
* Clicking a notification automatically routes you to the relevant page (e.g. friend profile or dashboard lobby) and marks it as read.
* Click the checkmark icon in the header popover to mark all notifications read.
* Click the trash icon to clear all notifications.

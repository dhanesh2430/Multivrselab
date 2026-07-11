# LeaderHabit Deployment Guide

This guide outlines how to deploy the **LeaderHabit** application. Because the application utilizes stateful WebSockets (`socket.io`), the backend server must be hosted on a platform that supports persistent socket connections (like Render, Railway, or Fly.io). The frontend React application can be hosted on Vercel.

---

## 1. Prepare Your GitHub Repository

1. Initialize Git in the project root, add your files, and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit — prepared for deployment"
   ```
2. Create a new repository on your GitHub account.
3. Link your local repository to GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Deploy Backend Server (Render / Railway)

Choose one of the hosting services below.

### Option A: Render (Free Tier)
1. Sign up/Log in to [Render](https://render.com/).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure the service settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
5. Under **Environment Variables**, add:
   - `PORT`: `5000` (or leave default, Render sets this dynamically)
   - `JWT_SECRET`: `your_super_secret_jwt_key`
   - `CLIENT_URL`: `https://your-frontend-app.vercel.app` (You can update this after deploying to Vercel)
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/leaderhabit?retryWrites=true&w=majority` *(Recommended: create a free MongoDB database on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for persistent data storage. If not specified, the backend will automatically spin up a temporary in-memory database, but data will be lost on server restart)*
6. Click **Deploy Web Service**.
7. Copy the backend service URL (e.g. `https://leaderhabit-backend.onrender.com`).

---

## 3. Deploy Frontend Client (Vercel)

1. Sign up/Log in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Select your GitHub repository.
4. Configure the Vercel project settings:
   - **Root Directory**: `client` (Select `client` as the directory to compile and deploy)
   - **Framework Preset**: `Vite` (Detected automatically)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - `VITE_API_URL`: `https://leaderhabit-backend.onrender.com` (Paste your deployed backend URL from Step 2, without a trailing slash)
6. Click **Deploy**.
7. Vercel will build and deploy your frontend. Once completed, Vercel will provide your live deployment URL (e.g., `https://your-frontend-app.vercel.app`).
8. **Important Step**: Go back to your backend hosting settings (e.g., on Render) and update the `CLIENT_URL` environment variable to match your live Vercel URL, then redeploy/restart the server so that CORS allows client socket connections.

---

## Technical Details

- **Single Page App Routing**: We have included `client/vercel.json` to handle client-side React Router navigation redirects in production.
- **WebSocket Configuration**: The client uses the dynamic `VITE_API_URL` variable to connect to socket.io. If not provided, it falls back to `http://localhost:5000`.
- **CORS Config**: The server dynamically reads `process.env.CLIENT_URL` to restrict socket.io and Express HTTP origins to your secure Vercel deployment.

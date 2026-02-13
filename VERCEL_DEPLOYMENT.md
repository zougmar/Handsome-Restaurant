# Vercel Deployment Guide

This guide will help you deploy the Handsome Restaurant frontend to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. A GitHub account (recommended) or GitLab/Bitbucket
3. Your backend deployed (see Backend Deployment section below)
4. MongoDB Atlas account (or your MongoDB connection string)

## Step 1: Prepare Your Repository

1. Make sure your code is committed to a Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to GitHub/GitLab/Bitbucket:
   ```bash
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## Step 2: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (or `npm run vercel-build`)
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

5. Add Environment Variables (click "Environment Variables"):
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_SOCKET_URL=https://your-backend-url.com
   ```
   Replace `your-backend-url.com` with your actual backend URL (see Backend Deployment below)

6. Click **"Deploy"**

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to project root:
   ```bash
   cd "C:\Users\zougm\Desktop\my projects\Handsome Restaurant"
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? (select your account)
   - Link to existing project? **No**
   - Project name? (press Enter for default)
   - Directory? **frontend**
   - Override settings? **No**

6. Set environment variables:
   ```bash
   vercel env add REACT_APP_API_URL
   # Enter: https://your-backend-url.com
   
   vercel env add REACT_APP_SOCKET_URL
   # Enter: https://your-backend-url.com
   ```

7. Redeploy with environment variables:
   ```bash
   vercel --prod
   ```

## Step 3: Deploy Backend (Required for Full Functionality)

**Important**: Vercel serverless functions don't support Socket.io persistent connections. You need to deploy the backend separately.

### Recommended: Railway (Easiest)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Add environment variables:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=your-secret-key
   PORT=5000
   NODE_ENV=production
   ```
5. Set root directory to `backend`
6. Railway will auto-detect Node.js and deploy

### Alternative: Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your repository
4. Configure:
   - **Name**: handsome-restaurant-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Add environment variables (same as Railway)
6. Click **"Create Web Service"**

### Alternative: Fly.io

1. Install Fly CLI: `npm install -g @fly/cli`
2. Login: `fly auth login`
3. Initialize: `fly launch` (in backend directory)
4. Deploy: `fly deploy`

## Step 4: Update CORS Settings

After deploying your backend, update `backend/server.js` to allow your Vercel domain:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      "https://your-vercel-app.vercel.app",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "https://your-vercel-app.vercel.app",
    "http://localhost:3000"
  ],
  credentials: true
}));
```

## Step 5: Update Environment Variables

After deploying both frontend and backend:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   REACT_APP_SOCKET_URL=https://your-backend-url.railway.app
   ```
4. Redeploy your frontend

## Step 6: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Test all interfaces:
   - Customer Interface
   - Waiter Interface
   - Kitchen Interface
   - Admin Dashboard

## Troubleshooting

### Images not loading
- Ensure backend is serving static files correctly
- Check that image URLs use the full backend URL
- Verify CORS settings allow image requests

### Socket.io not connecting
- Check that backend URL is correct in environment variables
- Verify backend CORS allows your Vercel domain
- Ensure backend is running and accessible

### API calls failing
- Verify `REACT_APP_API_URL` is set correctly
- Check backend logs for errors
- Ensure MongoDB connection is working

### Build fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)
- Check build logs in Vercel dashboard

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls
```

## Environment Variables Reference

### Frontend (Vercel)
- `REACT_APP_API_URL` - Your backend API URL
- `REACT_APP_SOCKET_URL` - Your backend Socket.io URL

### Backend (Railway/Render/Fly.io)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (usually 5000)
- `NODE_ENV` - Set to `production`

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check backend server logs
3. Verify all environment variables are set
4. Ensure MongoDB is accessible from your backend host

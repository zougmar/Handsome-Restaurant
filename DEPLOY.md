# Quick Deployment Guide

## 🚀 Deploy to Vercel (Frontend)

### Method 1: Vercel Dashboard (Easiest)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your repository

3. **Configure Project**
   - Framework: **Create React App**
   - Root Directory: **`frontend`**
   - Build Command: **`npm run build`**
   - Output Directory: **`build`**

4. **Add Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_SOCKET_URL=https://your-backend-url.com
   ```

5. **Click Deploy** 🎉

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel

# Add environment variables
vercel env add REACT_APP_API_URL
vercel env add REACT_APP_SOCKET_URL

# Deploy to production
vercel --prod
```

## 🔧 Deploy Backend (Required)

**Vercel doesn't support Socket.io**, so deploy backend separately:

### Option 1: Railway (Recommended - Free Tier Available)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repo
4. Set Root Directory: **`backend`**
5. Add Environment Variables:
   ```
   MONGODB_URI=your-mongodb-uri
   JWT_SECRET=your-secret-key
   PORT=5000
   ```
6. Deploy automatically starts!

### Option 2: Render

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Root Directory: **`backend`**
   - Build: `npm install`
   - Start: `node server.js`
5. Add same environment variables
6. Deploy!

## 📝 Update CORS

After deploying, update `backend/server.js`:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      "https://your-app.vercel.app",  // Your Vercel URL
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});
```

## ✅ Test

1. Visit your Vercel URL
2. Test all interfaces
3. Check browser console for errors

## 🆘 Need Help?

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

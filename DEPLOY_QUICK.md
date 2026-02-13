# ⚡ Quick Vercel Deployment

## 🎯 3-Step Deployment

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel"
git push origin main
```

### Step 2: Deploy Frontend (Vercel)

**Option A: Via Dashboard (Easiest)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.com
   REACT_APP_SOCKET_URL=https://your-backend-url.com
   ```
5. Click **Deploy** ✅

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
cd frontend
vercel
# Follow prompts, then:
vercel env add REACT_APP_API_URL
vercel env add REACT_APP_SOCKET_URL
vercel --prod
```

### Step 3: Deploy Backend (Railway - Free)

1. Go to [railway.app/new](https://railway.app/new)
2. **Deploy from GitHub repo**
3. Select your repository
4. Settings:
   - **Root Directory**: `backend`
5. Add Environment Variables:
   ```
   MONGODB_URI=your-mongodb-connection-string
   JWT_SECRET=any-random-secret-key
   PORT=5000
   ```
6. Copy your Railway URL (e.g., `https://your-app.railway.app`)
7. Go back to Vercel → Settings → Environment Variables
8. Update `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` with Railway URL
9. Redeploy Vercel

## ✅ Done!

Your app is live! Visit your Vercel URL to test.

## 🔧 Update CORS (Important!)

After deployment, update `backend/server.js`:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      "https://your-vercel-app.vercel.app",  // Your Vercel URL
      "http://localhost:3000"
    ],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: [
    "https://your-vercel-app.vercel.app",
    "http://localhost:3000"
  ]
}));
```

Then redeploy backend.

## 🆘 Troubleshooting

- **Images not loading?** Check backend static file serving
- **Socket.io not working?** Verify backend URL in env vars
- **CORS errors?** Update CORS settings in backend

See `VERCEL_DEPLOYMENT.md` for detailed help.

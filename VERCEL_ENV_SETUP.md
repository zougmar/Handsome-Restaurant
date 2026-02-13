# 🔧 Vercel Environment Variables Setup Guide

This guide will help you connect your frontend (deployed on Vercel) to your backend using environment variables.

## 📋 Prerequisites

1. **Backend deployed** on one of these platforms:
   - Railway (recommended): `https://your-app.railway.app`
   - Render: `https://your-app.onrender.com`
   - Fly.io: `https://your-app.fly.dev`
   - Heroku: `https://your-app.herokuapp.com`
   - Or any other hosting service

2. **Vercel account** with your project deployed

## 🚀 Step-by-Step Setup

### Step 1: Get Your Backend URL

1. Deploy your backend to your chosen platform
2. Note your backend URL (e.g., `https://handsome-restaurant-backend.railway.app`)
3. Make sure your backend is accessible and CORS is configured to allow your Vercel domain

### Step 2: Add Environment Variables in Vercel

1. Go to your Vercel project dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: **Handsome-Restaurant**
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** (left sidebar)

### Step 3: Add Required Variables

Add the following environment variables:

#### Required Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-backend-url.com` | Your backend API base URL |
| `REACT_APP_SOCKET_URL` | `https://your-backend-url.com` | Your Socket.io server URL (usually same as API URL) |

#### Example Values:

```
REACT_APP_API_URL=https://handsome-restaurant-backend.railway.app
REACT_APP_SOCKET_URL=https://handsome-restaurant-backend.railway.app
```

### Step 4: Configure Environment Scope

For each variable, select the environments where it should be available:

- ✅ **Production** - For production deployments
- ✅ **Preview** - For preview deployments (pull requests, branches)
- ✅ **Development** - For local development (optional)

**Recommended**: Enable for **Production** and **Preview** at minimum.

### Step 5: Save and Redeploy

1. Click **Save** after adding all variables
2. Go to **Deployments** tab
3. Click the **⋯** (three dots) menu on your latest deployment
4. Click **Redeploy**
5. Or push a new commit to trigger a new deployment

## 🔍 How It Works

### Frontend Code

The frontend uses these environment variables in:

1. **`frontend/src/utils/api.js`**:
   ```javascript
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

2. **`frontend/src/utils/socket.js`**:
   ```javascript
   const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
   ```

### Environment Variable Naming

- **React apps require `REACT_APP_` prefix** for environment variables to be accessible in the browser
- Variables without this prefix are **not available** in the frontend code
- These variables are embedded at **build time**, not runtime

## 🧪 Testing Your Setup

### 1. Check Environment Variables Are Loaded

After deployment, check the browser console:
```javascript
console.log('API URL:', process.env.REACT_APP_API_URL);
console.log('Socket URL:', process.env.REACT_APP_SOCKET_URL);
```

### 2. Test API Connection

1. Open your deployed Vercel app
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Try to use the app (login, load menu, etc.)
5. Check if API requests go to your backend URL

### 3. Test Socket Connection

1. Open browser DevTools Console
2. Look for Socket.io connection messages
3. Check for any connection errors

## 🔧 Troubleshooting

### Problem: API calls still go to localhost

**Solution**: 
- Make sure you **redeployed** after adding environment variables
- Environment variables are embedded at **build time**, so you need a new build
- Check that variable names start with `REACT_APP_`

### Problem: CORS errors

**Solution**: Update your backend CORS settings to include your Vercel domain:

```javascript
// backend/server.js
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-app-git-main.vercel.app', // Preview deployments
    'http://localhost:3000' // Local development
  ],
  credentials: true
}));
```

### Problem: Socket.io not connecting

**Solution**:
1. Verify `REACT_APP_SOCKET_URL` is set correctly
2. Check backend Socket.io CORS settings
3. Ensure backend supports WebSocket connections
4. Check browser console for connection errors

### Problem: Environment variables not showing in build

**Solution**:
1. Verify variable names start with `REACT_APP_`
2. Check that variables are saved in Vercel dashboard
3. Ensure you selected the correct environment (Production/Preview)
4. Redeploy after adding variables

## 📝 Quick Reference

### Vercel Dashboard Path:
```
Project → Settings → Environment Variables
```

### Required Variables:
```
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_SOCKET_URL=https://your-backend-url.com
```

### After Adding Variables:
1. ✅ Save in Vercel dashboard
2. ✅ Redeploy your project
3. ✅ Test the connection

## 🎯 Example Configuration

### For Railway Backend:
```
REACT_APP_API_URL=https://handsome-restaurant-production.up.railway.app
REACT_APP_SOCKET_URL=https://handsome-restaurant-production.up.railway.app
```

### For Render Backend:
```
REACT_APP_API_URL=https://handsome-restaurant-backend.onrender.com
REACT_APP_SOCKET_URL=https://handsome-restaurant-backend.onrender.com
```

### For Custom Domain:
```
REACT_APP_API_URL=https://api.handsome-restaurant.com
REACT_APP_SOCKET_URL=https://api.handsome-restaurant.com
```

## ✅ Verification Checklist

- [ ] Backend is deployed and accessible
- [ ] Backend CORS allows your Vercel domain
- [ ] Environment variables added in Vercel dashboard
- [ ] Variables enabled for Production and Preview
- [ ] Project redeployed after adding variables
- [ ] API calls work in deployed app
- [ ] Socket.io connects successfully
- [ ] No CORS errors in browser console

## 🆘 Need Help?

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify backend is running and accessible
4. Test backend URL directly in browser
5. Check CORS configuration on backend

---

**Note**: Environment variables are case-sensitive. Make sure to use exact names: `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`

# 🔧 Fixing Black Screen on Vercel

If you're seeing a black screen on your deployed Vercel app, here's how to fix it.

## 🔍 Common Causes

1. **Missing API Endpoints** - Frontend trying to fetch data from endpoints that don't exist
2. **Socket.io Errors** - Socket.io doesn't work in serverless, causing crashes
3. **JavaScript Errors** - Unhandled errors preventing the app from rendering
4. **Routing Issues** - Vercel not properly routing to index.html

## ✅ Solutions Applied

### 1. Fixed Vercel Routing

Updated `vercel.json` to properly handle API routes and SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Fixed Socket.io for Serverless

Updated `frontend/src/utils/socket.js` to use a mock socket in serverless environments, preventing crashes.

### 3. Added Error Handling

Updated `CustomerInterface.js` to gracefully handle API errors without crashing.

### 4. Created Missing API Endpoints

Created:
- `api/menu/index.js` - GET /api/menu
- `api/menu/categories.js` - GET /api/menu/categories

## 🚀 Next Steps

### 1. Check Browser Console

1. Open your deployed app
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for any red error messages

### 2. Check Network Tab

1. Open **Network** tab in DevTools
2. Refresh the page
3. Look for failed requests (red)
4. Check what endpoints are failing

### 3. Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

- ✅ `MONGODB_URI` is set
- ✅ `JWT_SECRET` is set
- ✅ `NODE_ENV=production`
- ❌ `REACT_APP_API_URL` should be **empty** (or not set)

### 4. Redeploy

After making changes:

1. Commit and push to GitHub
2. Vercel will auto-deploy
3. Or manually trigger: Vercel Dashboard → Deployments → Redeploy

## 🐛 Debugging Steps

### Step 1: Check if App Loads

Open browser console and check for:
- `✅ React app loaded` (if you add this log)
- Any error messages
- Network request failures

### Step 2: Test API Endpoints

Test directly in browser:
- `https://your-app.vercel.app/api/menu`
- `https://your-app.vercel.app/api/auth/login`

Should return JSON or error message, not 404.

### Step 3: Check Build Logs

1. Go to Vercel Dashboard
2. Click on latest deployment
3. Check **Build Logs** for errors
4. Check **Function Logs** for API errors

### Step 4: Test Locally

1. Set environment variables locally
2. Run `npm run build` in frontend
3. Test the build locally
4. Check for any build errors

## 🔧 Common Fixes

### Fix 1: Add Error Boundary

Create `frontend/src/components/ErrorBoundary.js`:

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-restaurant-dark text-white">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-restaurant-gold text-black px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

Then wrap your App:

```javascript
// frontend/src/index.js
import ErrorBoundary from './components/ErrorBoundary';

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

### Fix 2: Check for Missing Dependencies

Ensure all imports are correct and dependencies are installed:

```bash
cd frontend
npm install
npm run build
```

### Fix 3: Verify Build Output

Check that `frontend/build` directory has:
- `index.html`
- `static/` folder with JS and CSS files

## 📝 Checklist

- [ ] Vercel routing configured correctly
- [ ] API endpoints created
- [ ] Socket.io handled gracefully
- [ ] Error handling added
- [ ] Environment variables set
- [ ] Build succeeds without errors
- [ ] Browser console shows no critical errors
- [ ] Network requests succeed

## 🆘 Still Not Working?

1. **Check Vercel Function Logs**:
   - Dashboard → Deployments → Functions tab
   - Look for error messages

2. **Test API Endpoints Directly**:
   - Use Postman or curl
   - Verify endpoints return data

3. **Check MongoDB Connection**:
   - Verify `MONGODB_URI` is correct
   - Test connection in MongoDB Atlas

4. **Review Build Output**:
   - Check for warnings or errors
   - Verify all files are built correctly

---

**After applying these fixes, your app should load correctly!** 🎉

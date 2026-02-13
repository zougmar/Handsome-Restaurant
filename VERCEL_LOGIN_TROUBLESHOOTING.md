# 🔍 Troubleshooting "Login Failed" on Vercel

If you're seeing "Login failed" after deploying to Vercel, follow these steps to diagnose and fix the issue.

## 🚨 Quick Checklist

- [ ] Environment variables are set in Vercel
- [ ] Backend is deployed and accessible
- [ ] CORS is configured on backend
- [ ] Environment variables are enabled for Production
- [ ] Project was redeployed after adding variables

## 🔍 Step 1: Check Environment Variables

### In Vercel Dashboard:

1. Go to your project → **Settings** → **Environment Variables**
2. Verify these variables exist:
   - `REACT_APP_API_URL` = `https://your-backend-url.com`
   - `REACT_APP_SOCKET_URL` = `https://your-backend-url.com`
3. Make sure they're enabled for **Production** environment
4. Check that the URLs are correct (no trailing slashes)

### Common Issues:

❌ **Variable not set**: If `REACT_APP_API_URL` is not set, the app defaults to `http://localhost:5000`, which won't work in production.

✅ **Solution**: Add the environment variable in Vercel dashboard.

---

## 🔍 Step 2: Verify Backend is Accessible

### Test Your Backend URL:

1. Open your browser
2. Go to: `https://your-backend-url.com/api/menu` (or any public endpoint)
3. You should see a JSON response or an error message

### If Backend is Not Accessible:

- Check if backend is deployed and running
- Verify the URL is correct
- Check backend logs for errors
- Ensure backend is not down or sleeping (free tiers may sleep)

---

## 🔍 Step 3: Check Browser Console

### Open Browser DevTools:

1. Open your Vercel app in browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Try to login
5. Look for error messages

### Common Console Errors:

#### Error: "Cannot connect to server at http://localhost:5000"
**Problem**: `REACT_APP_API_URL` is not set or not loaded  
**Solution**: 
- Add `REACT_APP_API_URL` in Vercel environment variables
- Redeploy the project

#### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Problem**: Backend CORS doesn't allow your Vercel domain  
**Solution**: Update backend CORS settings (see Step 4)

#### Error: "Network Error" or "ECONNREFUSED"
**Problem**: Backend URL is incorrect or backend is down  
**Solution**: 
- Verify backend URL is correct
- Check backend is running
- Test backend URL directly in browser

---

## 🔍 Step 4: Fix CORS on Backend

Your backend must allow requests from your Vercel domain.

### Update Backend CORS Settings:

In `backend/server.js`, update CORS configuration:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-app.vercel.app',           // Production
    'https://your-app-git-main.vercel.app',  // Preview deployments
    'https://your-app-*.vercel.app',          // All preview deployments
    'http://localhost:3000'                   // Local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### For Socket.io:

```javascript
const io = socketIo(server, {
  cors: {
    origin: [
      'https://your-app.vercel.app',
      'https://your-app-*.vercel.app',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

**Important**: Replace `your-app` with your actual Vercel app name.

---

## 🔍 Step 5: Check Network Tab

### Inspect the Login Request:

1. Open DevTools → **Network** tab
2. Try to login
3. Look for the `/api/auth/login` request
4. Check:
   - **Request URL**: Should be `https://your-backend-url.com/api/auth/login`
   - **Status**: Should be 200 (success) or 401 (wrong credentials)
   - **Response**: Check the response body

### If Request URL is Wrong:

- Shows `http://localhost:5000` → Environment variable not set
- Shows wrong domain → Environment variable has wrong value
- **Solution**: Fix environment variable and redeploy

### If Status is 401:

- Check credentials are correct
- Verify user exists in database
- Check backend logs for authentication errors

### If Status is 500:

- Backend server error
- Check backend logs
- Verify MongoDB connection
- Check JWT_SECRET is set

---

## 🔍 Step 6: Verify Backend Endpoint

### Test Login Endpoint Directly:

Use curl or Postman to test:

```bash
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@handsome.com","password":"admin123"}'
```

### Expected Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin",
    "email": "admin@handsome.com",
    "role": "admin"
  }
}
```

### If Endpoint Doesn't Work:

- Backend might not be deployed
- Route might be incorrect
- Backend might have errors
- Check backend deployment logs

---

## 🔍 Step 7: Debug Environment Variables

### Add Debug Logging (Temporary):

Add this to `frontend/src/utils/api.js` temporarily:

```javascript
console.log('API Base URL:', process.env.REACT_APP_API_URL || 'NOT SET - using default localhost:5000');
```

After deployment, check browser console to see what URL is being used.

**Remember**: Remove debug logs after fixing the issue.

---

## 🔍 Step 8: Common Issues & Solutions

### Issue 1: Environment Variable Not Loading

**Symptoms**: 
- API calls go to `localhost:5000`
- Console shows default URL

**Solution**:
1. Verify variable name is exactly `REACT_APP_API_URL` (case-sensitive)
2. Ensure it's enabled for Production environment
3. Redeploy after adding variable
4. Clear browser cache

### Issue 2: Backend URL Has Trailing Slash

**Symptoms**: 
- CORS errors
- 404 errors

**Solution**:
- Remove trailing slash: `https://backend.com` ✅
- Not: `https://backend.com/` ❌

### Issue 3: Backend is Sleeping (Free Tier)

**Symptoms**:
- First request fails
- Subsequent requests work
- Long delay on first request

**Solution**:
- Upgrade to paid tier, or
- Use a service that doesn't sleep (Railway, Fly.io)
- Or accept the cold start delay

### Issue 4: Wrong Backend URL

**Symptoms**:
- Network errors
- 404 errors
- Connection refused

**Solution**:
- Verify backend URL is correct
- Test backend URL in browser
- Check backend deployment status

---

## ✅ Verification Steps

After fixing, verify:

1. ✅ Environment variables are set in Vercel
2. ✅ Backend is accessible (test in browser)
3. ✅ CORS allows Vercel domain
4. ✅ Project was redeployed
5. ✅ Browser console shows correct API URL
6. ✅ Network tab shows requests to backend
7. ✅ Login works successfully

---

## 🆘 Still Not Working?

### Get More Information:

1. **Check Vercel Build Logs**:
   - Go to Vercel dashboard → Deployments
   - Click on latest deployment
   - Check build logs for errors

2. **Check Backend Logs**:
   - Go to your backend hosting platform
   - Check server logs
   - Look for incoming requests

3. **Test Locally**:
   - Set environment variables locally
   - Test if it works locally
   - This helps isolate the issue

4. **Check Browser Console**:
   - Look for detailed error messages
   - Check network requests
   - Verify API URL being used

---

## 📝 Quick Fix Checklist

If login still fails, verify each item:

```
□ REACT_APP_API_URL is set in Vercel
□ Variable is enabled for Production
□ Backend URL is correct (no trailing slash)
□ Backend is deployed and running
□ Backend CORS allows Vercel domain
□ Project was redeployed after adding variables
□ Browser console shows correct API URL
□ Network tab shows request to backend
□ Backend endpoint responds correctly
```

---

**Need more help?** Check the error message in browser console and match it with the solutions above.

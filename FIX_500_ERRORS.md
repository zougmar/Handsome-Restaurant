# 🔧 Fixing 500 Internal Server Errors

## 🔍 Understanding the Errors

### Error Messages:
- `GET /api/menu/categories 500 (Internal Server Error)`
- `GET /api/menu 500 (Internal Server Error)`

These 500 errors mean the serverless functions are being called but failing internally.

## ✅ Fixes Applied

### 1. Model Path Resolution
- Created `api/_lib/models.js` with smart model loading
- Handles different path resolutions in Vercel serverless environment
- Falls back to inline schema creation if model files can't be found

### 2. Better Error Handling
- Added detailed error logging
- Returns error stack in development mode
- More descriptive error messages

## 🔍 Common Causes of 500 Errors

### 1. MongoDB Connection Issue

**Symptoms**: 
- 500 error on all endpoints
- Error message mentions MongoDB

**Check**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `MONGODB_URI` is set correctly
3. Check MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)

**Solution**:
- Verify connection string format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`
- Test connection string in MongoDB Atlas
- Ensure database user has read/write permissions

### 2. Model Not Found

**Symptoms**:
- 500 error with "Cannot find module" or "Model not found"

**Solution**:
- The new `api/_lib/models.js` handles this automatically
- Models are loaded with fallback to inline schemas

### 3. Missing Dependencies

**Symptoms**:
- 500 error with module not found errors

**Check**:
- Ensure `package.json` in root has all required dependencies
- Vercel installs from root `package.json` for serverless functions

**Solution**:
- Verify root `package.json` includes:
  ```json
  {
    "dependencies": {
      "mongoose": "^8.0.3",
      "express-validator": "^7.0.1",
      "jsonwebtoken": "^9.0.2",
      "bcryptjs": "^2.4.3"
    }
  }
  ```

### 4. Environment Variables Not Set

**Symptoms**:
- 500 error with "MONGODB_URI environment variable is not set"

**Solution**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = random secret key
   - `NODE_ENV` = production
3. Enable for **Production** environment
4. **Redeploy** after adding variables

## 🧪 Testing the Fix

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Click **"Functions"** tab
4. Click on `/api/menu` function
5. View logs for specific error messages

### Step 2: Test Endpoints Directly

Open in browser:
- `https://handsome-restaurant.vercel.app/api/menu`
- `https://handsome-restaurant.vercel.app/api/menu/categories`

Should return JSON, not 500 error.

### Step 3: Check Browser Console

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for detailed error messages
4. Check **Network** tab for response body (may contain error details)

## 🔧 Debugging Steps

### 1. Verify MongoDB Connection

Test your MongoDB URI:
```bash
# In MongoDB Atlas, test the connection
# Or use a MongoDB client to verify connection works
```

### 2. Check Function Logs

Vercel function logs will show:
- Connection attempts
- Error messages
- Stack traces

### 3. Test Locally (Optional)

1. Set environment variables locally
2. Run function locally:
   ```bash
   cd api/menu
   node index.js
   ```
3. Check for errors

## 📝 Quick Checklist

- [ ] `MONGODB_URI` environment variable is set in Vercel
- [ ] MongoDB connection string is correct
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Database user has proper permissions
- [ ] Root `package.json` has all dependencies
- [ ] Project was redeployed after adding environment variables
- [ ] Check Vercel function logs for specific errors

## 🆘 Still Getting 500 Errors?

### Check Vercel Function Logs:

1. **Go to**: Vercel Dashboard → Deployments → Latest → Functions
2. **Click on**: `/api/menu` or `/api/menu/categories`
3. **View logs**: Look for specific error messages
4. **Common errors**:
   - "MONGODB_URI not set" → Add environment variable
   - "Connection timeout" → Check MongoDB Atlas settings
   - "Model not found" → Should be fixed with new model loader
   - "Module not found" → Check dependencies in package.json

### Get More Details:

The updated functions now return more detailed error messages. Check:
- Browser Network tab → Response body
- Vercel function logs
- Browser console for error details

## ✅ After Fixing

Once fixed, you should see:
- ✅ Menu loads at `/customer`
- ✅ Categories load correctly
- ✅ No 500 errors in console
- ✅ API endpoints return JSON data

---

**The model loading issue should now be fixed. Redeploy and test!**

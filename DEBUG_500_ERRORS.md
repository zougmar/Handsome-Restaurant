# 🐛 Debugging 500 Errors - Step by Step

## 🔍 Current Issue

Getting `[object Object]` error suggests an error object is being stringified incorrectly.

## ✅ Fixes Applied

1. **Better Error Serialization**: Fixed error responses to properly stringify error messages
2. **Enhanced Logging**: Added detailed error logging with all error properties
3. **Model Loading Logs**: Added console logs to track model loading process
4. **Test Endpoint**: Created `/api/menu/test` to verify basic functionality

## 🧪 Debugging Steps

### Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → **Deployments**
2. Click on **latest deployment**
3. Click **"Functions"** tab
4. Click on `/api/menu` or `/api/menu/categories`
5. **View logs** - Look for:
   - Error messages
   - "MongoDB Connected" or connection errors
   - Model loading messages
   - Stack traces

### Step 2: Test Basic Endpoint

Visit in browser:
```
https://handsome-restaurant.vercel.app/api/menu/test
```

Should return JSON with connection info. If this fails, the issue is with basic setup.

### Step 3: Check Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

Verify these are set:
- ✅ `MONGODB_URI` - Should be a long connection string
- ✅ `JWT_SECRET` - Any random string
- ✅ `NODE_ENV` - Should be `production`

### Step 4: Test MongoDB Connection

The logs should show:
- `✅ MongoDB Connected` - Connection successful
- `❌ MongoDB Connection Error: ...` - Connection failed

If connection fails, check:
1. MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)
2. Connection string format
3. Database user permissions

### Step 5: Check Model Loading

Look for these log messages:
- `✅ Menu model loaded successfully` - Model file found
- `⚠️ Could not load Menu model from file` - Using inline model
- `✅ Created new Menu model` - Inline model created

## 🔧 Common Issues & Solutions

### Issue 1: MongoDB Connection Fails

**Error in logs**: `MongoDB Connection Error`

**Solutions**:
1. Verify `MONGODB_URI` is set correctly
2. Check MongoDB Atlas:
   - Network Access → Add IP `0.0.0.0/0`
   - Database Access → User has read/write permissions
3. Test connection string format

### Issue 2: Model Not Found

**Error in logs**: `Model Menu not found`

**Solution**:
- The code now creates inline models automatically
- Check logs for "Creating Menu model inline"
- Should work even if model files aren't found

### Issue 3: Module Not Found

**Error in logs**: `Cannot find module`

**Solution**:
- Verify root `package.json` has all dependencies
- Check that Vercel installs from root directory
- Dependencies should be in root, not just frontend

### Issue 4: Timeout

**Error in logs**: `Function execution timeout`

**Solution**:
- MongoDB connection might be slow
- Check MongoDB Atlas cluster status
- Consider upgrading MongoDB Atlas tier

## 📋 What to Check in Logs

Look for these specific messages:

### Success Indicators:
- ✅ `MongoDB Connected`
- ✅ `Menu model loaded successfully` OR `Created new Menu model`
- ✅ Function returns 200 status

### Error Indicators:
- ❌ `MongoDB Connection Error`
- ❌ `Model not found`
- ❌ `Cannot find module`
- ❌ `Function execution timeout`

## 🎯 Next Steps

1. **Redeploy** after fixes
2. **Check Vercel logs** for specific error messages
3. **Test endpoints**:
   - `/api/menu/test` - Basic test
   - `/api/menu` - Full menu endpoint
   - `/api/menu/categories` - Categories endpoint
4. **Share error details** from Vercel logs if still failing

## 📝 Error Response Format

Now errors return:
```json
{
  "message": "Server error",
  "error": "Actual error message here",
  "details": {
    "name": "ErrorName",
    "code": "ErrorCode",
    "stack": "Stack trace (dev only)"
  }
}
```

This should help identify the exact issue!

---

**Check Vercel function logs to see the actual error message now!**

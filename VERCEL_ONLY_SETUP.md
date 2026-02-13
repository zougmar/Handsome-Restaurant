# ✅ Vercel-Only Deployment (Quick Setup)

This is a simplified guide for deploying everything on Vercel without Railway or other services.

## 🎯 What's Set Up

✅ **Frontend**: React app deployed as static site  
✅ **Backend**: Serverless functions in `api/` directory  
✅ **Database**: MongoDB Atlas (free tier)  
✅ **API Routes**: `/api/auth/login` and `/api/auth/me` are ready

## 📋 Quick Setup Steps

### 1. Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create cluster
3. Click **"Connect"** → **"Connect your application"**
4. Copy connection string
5. Replace `<password>` with your password

### 2. Deploy to Vercel

1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Setup Vercel serverless functions"
   git push origin main
   ```

2. **Go to [vercel.com/new](https://vercel.com/new)**
3. **Import your repository**
4. **Settings**:
   - Root Directory: `./` (project root)
   - Framework: Other
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/build`

### 3. Add Environment Variables

In Vercel → **Settings** → **Environment Variables**:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handsome-restaurant?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
NODE_ENV=production
```

**Important**: 
- Don't set `REACT_APP_API_URL` - leave it empty so frontend uses same domain
- Enable variables for **Production** environment

### 4. Deploy

Click **"Deploy"** and wait for build to complete.

### 5. Create Admin User

After deployment, create an admin user. You can:

**Option A**: Use MongoDB Atlas UI
- Go to Collections → `users` → Insert Document
- Use a password hasher tool to hash your password

**Option B**: Create via API (recommended)

Create a temporary function `api/create-admin.js`:

```javascript
const { connectToDatabase } = require('../_lib/mongodb');
const User = require('../../../backend/models/User');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@handsome.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    await admin.save();
    return res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
```

Then call: `POST https://your-app.vercel.app/api/create-admin`

**After creating admin, delete this function for security!**

## ✅ Test Your Deployment

1. Visit: `https://your-app.vercel.app`
2. Go to admin login
3. Login with:
   - Email: `admin@handsome.com`
   - Password: `admin123` (or whatever you set)

## 🔧 How It Works

- **Frontend**: Serves from `frontend/build`
- **API Requests**: Go to `/api/*` → Routed to `api/*` serverless functions
- **Database**: MongoDB Atlas (cloud)
- **Authentication**: JWT tokens stored in localStorage

## 📝 Adding More Endpoints

To add more API endpoints, create files in `api/` directory:

```
api/
├── menu/
│   └── index.js          → GET /api/menu
├── orders/
│   └── index.js          → GET /api/orders
│   └── [id]/
│       └── index.js      → GET /api/orders/:id
```

See `VERCEL_FULL_DEPLOY.md` for detailed examples.

## ⚠️ Important Notes

1. **Socket.io**: Not supported in serverless. Use polling for real-time updates.
2. **File Uploads**: Use Cloudinary, Imgur, or AWS S3.
3. **Cold Starts**: First request may be slower (~1-2 seconds).
4. **Function Timeout**: 10 seconds (free tier), 60 seconds (pro).

## 🆘 Troubleshooting

### Login fails?
- Check MongoDB connection string
- Verify environment variables are set
- Check Vercel function logs
- Ensure admin user exists

### API returns 404?
- Check `vercel.json` has correct rewrites
- Verify function files are in `api/` directory
- Check function exports default handler

### CORS errors?
- Functions already include CORS headers
- Check browser console for specific error

## 📚 Next Steps

1. Add more API endpoints (menu, orders, etc.)
2. Set up image upload service (Cloudinary)
3. Implement polling for real-time updates
4. Add error monitoring (Sentry)

---

**Your app is now fully deployed on Vercel! 🎉**

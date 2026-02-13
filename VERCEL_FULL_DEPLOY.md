# 🚀 Complete Vercel Deployment Guide (Frontend + Backend)

This guide will help you deploy **both frontend and backend** entirely on Vercel using serverless functions.

## ⚠️ Important Limitations

- **Socket.io**: Vercel serverless functions don't support persistent WebSocket connections. Real-time features will need polling or alternative solutions.
- **File Uploads**: Use external services like Cloudinary, Imgur, or AWS S3 for image uploads.
- **Cold Starts**: First request after inactivity may be slower (serverless limitation).

## 📋 Prerequisites

1. **MongoDB Atlas Account** (free tier available)
   - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

2. **GitHub Account** with your code pushed

3. **Vercel Account** (free tier available)

## 🚀 Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Click **"Connect"** → **"Connect your application"**
5. Copy your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
6. Replace `<password>` with your database password
7. Add your IP address to the whitelist (or use `0.0.0.0/0` for all IPs in development)

### Step 2: Deploy to Vercel

1. **Go to [vercel.com/new](https://vercel.com/new)**
2. **Import your GitHub repository**
3. **Configure Project Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (project root)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install && cd frontend && npm install`

### Step 3: Add Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

#### Required Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handsome-restaurant?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
```

#### Optional (for API URL):

```
REACT_APP_API_URL=
```
**Leave this empty** - the frontend will use relative URLs (same domain)

### Step 4: Enable Environment Variables

For each variable:
- ✅ **Production** - Enable
- ✅ **Preview** - Enable (optional)
- ❌ **Development** - Not needed

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete
3. Your app will be live at `https://your-app.vercel.app`

## 🔧 How It Works

### Project Structure:

```
./
├── api/                    # Vercel Serverless Functions
│   ├── _lib/              # Shared utilities (MongoDB, Auth)
│   ├── auth/              # Auth endpoints
│   │   ├── login.js       # POST /api/auth/login
│   │   └── me.js          # GET /api/auth/me
│   ├── menu/              # Menu endpoints
│   ├── orders/            # Order endpoints
│   └── ...
├── backend/               # Original backend (not used in Vercel)
├── frontend/              # React app
└── vercel.json            # Vercel configuration
```

### API Routing:

- Frontend requests to `/api/*` are routed to `api/*` serverless functions
- Example: `POST /api/auth/login` → `api/auth/login.js`
- All functions share the same MongoDB connection (cached)

### Frontend API Configuration:

The frontend uses **relative URLs** when `REACT_APP_API_URL` is not set:
- Production: Requests go to same Vercel domain
- Development: Falls back to `http://localhost:5000`

## 📝 Adding More API Endpoints

To add more serverless functions:

1. **Create function file** in `api/` directory:
   ```javascript
   // api/menu/index.js
   const { connectToDatabase } = require('../_lib/mongodb');
   const Menu = require('../../../backend/models/Menu');

   module.exports = async (req, res) => {
     // CORS headers
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

     if (req.method === 'OPTIONS') {
       return res.status(200).end();
     }

     try {
       await connectToDatabase();
       
       if (req.method === 'GET') {
         const menu = await Menu.find();
         return res.status(200).json(menu);
       }
       
       // Handle other methods...
     } catch (error) {
       return res.status(500).json({ message: error.message });
     }
   };
   ```

2. **Access via**: `GET /api/menu`

## 🔐 Create Admin User

After deployment, you need to create an admin user. You have two options:

### Option 1: Use MongoDB Atlas UI

1. Go to MongoDB Atlas → **Collections**
2. Find your database → `users` collection
3. Click **"Insert Document"**
4. Add:
   ```json
   {
     "name": "Admin",
     "email": "admin@handsome.com",
     "password": "$2a$10$...", // Hashed password
     "role": "admin",
     "isActive": true,
     "createdAt": "2024-01-01T00:00:00.000Z"
   }
   ```
5. Generate password hash using: `bcrypt.hash('admin123', 10)`

### Option 2: Create Seed Script (Recommended)

Create `api/seed.js` and call it once via Vercel function or local script.

## 🧪 Testing Your Deployment

1. **Visit your Vercel URL**: `https://your-app.vercel.app`
2. **Test Login**: Use admin credentials
3. **Check Browser Console**: Look for any errors
4. **Check Network Tab**: Verify API requests go to `/api/*`

## 🔍 Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution**:
- Verify `MONGODB_URI` is set correctly in Vercel
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string format

### Issue: "Login failed"

**Solution**:
- Check browser console for specific error
- Verify environment variables are set
- Ensure MongoDB connection is working
- Check Vercel function logs

### Issue: API endpoints return 404

**Solution**:
- Verify `vercel.json` has correct rewrites
- Check function files are in `api/` directory
- Ensure function exports default handler

### Issue: CORS errors

**Solution**:
- Verify CORS headers in serverless functions
- Check `Access-Control-Allow-Origin` header
- Ensure OPTIONS method is handled

## 📊 Monitoring

### View Function Logs:

1. Go to Vercel Dashboard → **Deployments**
2. Click on a deployment
3. Click **"Functions"** tab
4. View logs for each function

### View Build Logs:

1. Go to Vercel Dashboard → **Deployments**
2. Click on a deployment
3. View build output

## 🔄 Updating Your Deployment

1. **Make changes** to your code
2. **Commit and push** to GitHub
3. **Vercel automatically redeploys** (if connected to GitHub)
4. Or manually trigger: Vercel Dashboard → **Deployments** → **Redeploy**

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Create admin user
4. ✅ Test login
5. ✅ Add more API endpoints as needed

## 📚 Additional Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

---

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] Project deployed to Vercel
- [ ] Environment variables set
- [ ] Admin user created
- [ ] Login works
- [ ] API endpoints respond correctly

---

**Note**: For production, consider:
- Using a custom domain
- Setting up proper error monitoring
- Implementing rate limiting
- Using a CDN for static assets
- Setting up database backups

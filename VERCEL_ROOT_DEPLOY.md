# 🚀 Vercel Deployment from Root Directory

Your project is configured to deploy from the **root directory (`./`)** on Vercel.

## ✅ Configuration

- **Root Directory**: `./` (project root)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install && cd frontend && npm install`

## 📋 Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure for root directory deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `zougmar/Handsome-Restaurant`
3. **Important Settings**:
   - **Root Directory**: `./` (leave empty or set to `./`)
   - **Framework Preset**: Other
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install && cd frontend && npm install`

### 3. Environment Variables

Add these in Vercel → Settings → Environment Variables:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

### 4. Deploy

Click **Deploy** and wait for the build to complete.

## 📁 Project Structure

```
./
├── api/                    # Serverless functions
│   ├── _lib/              # Shared utilities
│   ├── auth/              # Auth endpoints
│   ├── menu/              # Menu endpoints
│   ├── orders/            # Order endpoints
│   ├── tables/            # Table endpoints
│   ├── users/             # User endpoints
│   └── reports/           # Report endpoints
├── backend/               # Original backend (not used in Vercel)
├── frontend/              # React app
│   ├── src/
│   ├── public/
│   └── package.json
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## 🔧 How It Works

1. **Install**: Vercel installs dependencies from both root and frontend
2. **Build**: Builds the React app in `frontend/` directory
3. **Deploy**: 
   - Frontend static files from `frontend/build`
   - API serverless functions from `api/` directory

## ⚠️ Important Notes

- **Socket.io**: Not supported in serverless functions. Use polling instead.
- **File Uploads**: Use external image URLs (Cloudinary, Imgur, etc.)
- **MongoDB**: Use MongoDB Atlas (cloud) for production

## ✅ Success!

Once deployed, your app will be live at `https://your-app.vercel.app`

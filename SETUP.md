# 🚀 Setup Guide - Handsome Restaurant Management System

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
npm run install-all
```

This will install dependencies for both backend and frontend.

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/handsome-restaurant
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handsome-restaurant
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas (cloud) - no local installation needed**

### 4. Seed the Database

Run the seed script to create sample data:

```bash
npm run seed
```

This will create:
- Admin user: `admin@handsome.com` / `admin123`
- Sample waiter: `waiter@handsome.com` / `waiter123`
- Sample kitchen user: `kitchen@handsome.com` / `waiter123`
- Sample menu items
- 12 tables

**Or create only an admin user:**
```bash
npm run create-admin
# Or with custom credentials:
npm run create-admin your-email@example.com your-password Admin Name
```

### 5. Start the Application

**Development mode (runs both backend and frontend):**
```bash
npm run dev
```

**Or run separately:**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

## Access Points

Once running, access the system at:

- **Customer Interface**: http://localhost:3000/customer
- **Waiter Interface**: http://localhost:3000/waiter
- **Kitchen Interface**: http://localhost:3000/kitchen
- **Admin Dashboard**: http://localhost:3000/admin/login

## Default Login Credentials

After seeding:
- **Email**: admin@handsome.com
- **Password**: admin123

## Network Setup for Tablets

### Option 1: Local WiFi Network

1. Connect all tablets to the same WiFi network
2. Find your computer's local IP address:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
3. Update frontend API URL:
   - Edit `frontend/src/utils/api.js`
   - Change `API_BASE_URL` to `http://YOUR_IP:5000`
   - Edit `frontend/src/utils/socket.js`
   - Change `SOCKET_URL` to `http://YOUR_IP:5000`
4. Rebuild frontend: `cd frontend && npm run build`
5. Access from tablets: `http://YOUR_IP:3000/customer` (or waiter/kitchen)

### Option 2: Cloud Deployment

Deploy backend to:
- Heroku
- AWS
- DigitalOcean
- Railway
- Render

Update frontend environment variables with your cloud server URL.

## Production Build

### Backend
```bash
# Set NODE_ENV=production in .env
npm run server
```

### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in `.env`
- For Atlas, verify network access settings

### Port Already in Use
- Change PORT in `.env`
- Or kill the process using the port

### Socket.io Connection Issues
- Check firewall settings
- Ensure CORS is configured correctly
- Verify WebSocket support in browser

### Frontend Not Loading
- Clear browser cache
- Check console for errors
- Verify API URL configuration

## Features Overview

### Customer Interface
- Browse menu by category
- Add items to cart
- Place orders
- Real-time order tracking

### Waiter Interface
- View table status
- Manage orders
- Mark orders as paid
- Print receipts

### Kitchen Interface
- View incoming orders
- Update order status
- Sound alerts for new orders
- Order timers

### Admin Dashboard
- User management
- Menu management
- Table management
- Reports & analytics

## Support

For issues or questions, check the README.md or contact the development team.

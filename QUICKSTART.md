# ⚡ Quick Start Guide

Get the Handsome Restaurant Management System running in 5 minutes!

## 1. Install Dependencies

```bash
npm run install-all
```

## 2. Set Up Environment

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/handsome-restaurant
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## 3. Start MongoDB

**Option A: Local MongoDB**
```bash
mongod
```

**Option B: MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string
- Update `MONGODB_URI` in `.env`

## 4. Seed Database

```bash
npm run seed
```

This creates:
- Admin: `admin@handsome.com` / `admin123`
- Sample menu items
- 12 tables

## 5. Start the App

```bash
npm run dev
```

## 6. Access the System

Open your browser:

- **Customer Menu**: http://localhost:3000/customer
- **Waiter Panel**: http://localhost:3000/waiter  
- **Kitchen Display**: http://localhost:3000/kitchen
- **Admin Dashboard**: http://localhost:3000/admin/login

Login with: `admin@handsome.com` / `admin123`

## 🎉 You're Ready!

The system is now running. All interfaces sync in real-time via WebSocket.

For detailed setup instructions, see [SETUP.md](./SETUP.md)

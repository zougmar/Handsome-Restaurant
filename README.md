# 🍽️ Handsome Restaurant Management System

A modern, real-time Restaurant Management System with synchronized tablet interfaces and an Admin Dashboard.

## 🚀 Features

### 📱 Customer Tablet Interface
- Browse digital menu with categories
- Add items to cart
- Place orders
- Real-time order tracking (Pending → Preparing → Ready → Served)

### 👨‍💼 Waiter Tablet Interface
- Table grid dashboard with status indicators
- View and manage orders
- Send orders to kitchen
- Print receipts
- Mark orders as paid
- Live notifications

### 👨‍🍳 Kitchen Display System (KDS)
- Real-time incoming orders
- Order cards with table number, items, and instructions
- Order timer
- Status control (Start Preparing → Mark as Ready)
- Color-coded system
- Sound alerts for new orders

### 👑 Admin Dashboard
- **User Management**: Add, edit, delete users with role assignment
- **Menu Management**: Add categories, products, upload images, update prices
- **Table Management**: Add, edit, remove tables
- **Reports & Analytics**: Daily sales, monthly revenue, top-selling dishes, order history

## 🛠️ Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.io (Real-time communication)
- JWT Authentication
- bcrypt (Password hashing)

### Frontend
- React.js
- Tailwind CSS
- Socket.io-client
- Tablet-first responsive design

## 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd handsome-restaurant
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Set up environment variables**
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Run the application**
```bash
npm run dev
```

The backend will run on `http://localhost:5000` and the frontend on `http://localhost:3000`.

## 🔐 Default Admin Account

After seeding the database, use these credentials:

- **Email**: admin@handsome.com
- **Password**: admin123

To seed the database:
```bash
npm run seed
```

Or create only an admin user:
```bash
npm run create-admin
```

## 📱 Access Points

- **Admin Dashboard**: `http://localhost:3000/admin`
- **Customer Interface**: `http://localhost:3000/customer`
- **Waiter Interface**: `http://localhost:3000/waiter`
- **Kitchen Interface**: `http://localhost:3000/kitchen`

## 🌐 Network Setup

All tablets connect to the same backend server:
- **Local WiFi**: Configure tablets to connect to the same network
- **Cloud Hosted**: Update API endpoints in frontend configuration

## 🚀 Deployment

### Quick Deploy to Vercel

See `DEPLOY.md` for quick deployment instructions or `VERCEL_DEPLOYMENT.md` for detailed guide.

**Quick Steps:**
1. Push code to GitHub
2. Deploy frontend to [Vercel](https://vercel.com) (set root directory to `frontend`)
3. Deploy backend to [Railway](https://railway.app) or [Render](https://render.com) (set root directory to `backend`)
4. Add environment variables:
   - **Frontend**: `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`
   - **Backend**: `MONGODB_URI`, `JWT_SECRET`, `PORT`
5. Update CORS settings in backend to allow your Vercel domain

## 🔒 Security Features

- JWT Authentication
- bcrypt password hashing
- Role-based access control (Admin, Waiter, Kitchen, Cashier)
- Protected routes
- Input validation
- Centralized error handling

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Admin only)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/categories` - Get all categories
- `POST /api/menu` - Create menu item (Admin)
- `PUT /api/menu/:id` - Update menu item (Admin)
- `DELETE /api/menu/:id` - Delete menu item (Admin)

### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/payment` - Update payment status

### Tables
- `GET /api/tables` - Get all tables
- `POST /api/tables` - Create table (Admin)
- `PUT /api/tables/:id` - Update table (Admin)
- `DELETE /api/tables/:id` - Delete table (Admin)

### Reports (Admin only)
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/monthly` - Monthly revenue report
- `GET /api/reports/top-selling` - Top selling dishes
- `GET /api/reports/history` - Order history

## 🎨 UI & Branding

- Elegant restaurant color palette (dark + gold/warm tones)
- Modern, minimal, premium design
- Smooth animations
- Real-time updates without refresh
- Touch-friendly tablet interface

## 📄 License

ISC

## 👥 Support

For issues and questions, please contact the development team.

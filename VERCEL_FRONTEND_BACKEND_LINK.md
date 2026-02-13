# 🔗 Linking Frontend to Backend on Vercel

Your frontend at **https://handsome-restaurant.vercel.app** is now directly connected to backend serverless functions on the same domain.

## ✅ What's Set Up

### API Endpoints Created:

1. **Authentication**:
   - `POST /api/auth/login` - User login
   - `GET /api/auth/me` - Get current user

2. **Menu**:
   - `GET /api/menu` - Get all menu items
   - `GET /api/menu/categories` - Get all categories

3. **Orders**:
   - `GET /api/orders` - Get all orders (with query params: `?status=pending&tableNumber=1`)
   - `POST /api/orders` - Create new order
   - `GET /api/orders/:id` - Get order by ID
   - `PUT /api/orders/:id/status` - Update order status
   - `PUT /api/orders/:id/payment` - Update payment status

## 🔧 How It Works

### Frontend Configuration:

The frontend uses **relative URLs** (same domain):
- Production: Requests go to `https://handsome-restaurant.vercel.app/api/*`
- No need for `REACT_APP_API_URL` environment variable

### Vercel Routing:

- All `/api/*` requests → Routed to `api/*` serverless functions
- All other routes → Served from `frontend/build/index.html` (React Router)

### API Structure:

```
api/
├── _lib/
│   ├── mongodb.js      # Shared MongoDB connection
│   └── auth.js         # JWT utilities
├── auth/
│   ├── login.js        # POST /api/auth/login
│   └── me.js           # GET /api/auth/me
├── menu/
│   ├── index.js        # GET /api/menu
│   └── categories.js   # GET /api/menu/categories
└── orders/
    ├── index.js        # GET, POST /api/orders
    └── [id]/
        ├── index.js    # GET /api/orders/:id
        ├── status.js   # PUT /api/orders/:id/status
        └── payment.js  # PUT /api/orders/:id/payment
```

## 🚀 Testing Your Connection

### 1. Test Menu Endpoint:

Open in browser:
```
https://handsome-restaurant.vercel.app/api/menu
```

Should return JSON array of menu items.

### 2. Test Customer Interface:

1. Visit: `https://handsome-restaurant.vercel.app/customer`
2. Menu should load automatically
3. Add items to cart
4. Place order with table number
5. Order should be created successfully

### 3. Check Browser Console:

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for:
   - ✅ Menu loaded successfully
   - ✅ Order placed successfully
   - ❌ Any error messages

### 4. Check Network Tab:

1. Open **Network** tab in DevTools
2. Refresh page
3. Look for:
   - `GET /api/menu` - Should return 200
   - `GET /api/menu/categories` - Should return 200
   - `POST /api/orders` - Should return 201 when placing order

## 🔍 Troubleshooting

### Issue: Menu not loading

**Check**:
1. MongoDB connection string is set in Vercel
2. Menu items exist in database
3. Check Vercel function logs for errors

**Solution**:
- Verify `MONGODB_URI` environment variable
- Seed database with menu items
- Check function logs in Vercel dashboard

### Issue: Order placement fails

**Check**:
1. Browser console for error message
2. Network tab for failed request
3. Vercel function logs

**Common causes**:
- Invalid table number
- Empty cart
- Menu item not found
- MongoDB connection issue

### Issue: 404 on API endpoints

**Check**:
1. `vercel.json` has correct rewrites
2. Function files are in correct location
3. Function exports default handler

**Solution**:
- Verify `vercel.json` configuration
- Check file structure matches API routes
- Ensure functions export default handler

## 📝 Environment Variables Required

In Vercel Dashboard → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/handsome-restaurant?retryWrites=true&w=majority
JWT_SECRET=your-random-secret-key-here
NODE_ENV=production
```

**Important**: Do NOT set `REACT_APP_API_URL` - leave it empty so frontend uses same domain.

## ✅ Verification Checklist

- [ ] Environment variables set in Vercel
- [ ] MongoDB connection working
- [ ] Menu items exist in database
- [ ] Frontend loads at `/customer`
- [ ] Menu displays correctly
- [ ] Can add items to cart
- [ ] Can place order successfully
- [ ] Order appears in database
- [ ] No errors in browser console
- [ ] API requests return 200/201 status

## 🎯 Next Steps

1. **Seed Database**: Add menu items and create admin user
2. **Test All Interfaces**:
   - Customer Interface (`/customer`)
   - Waiter Interface (`/waiter`)
   - Kitchen Interface (`/kitchen`)
   - Admin Dashboard (`/admin`)
3. **Add More Endpoints** as needed (tables, users, reports)

## 📚 Adding More Endpoints

To add more API endpoints:

1. Create file in `api/` directory matching route
2. Example: `api/tables/index.js` → `GET /api/tables`
3. Use shared utilities from `api/_lib/`
4. Export default async function handler

See existing endpoints for examples.

---

**Your frontend and backend are now fully connected on Vercel! 🎉**

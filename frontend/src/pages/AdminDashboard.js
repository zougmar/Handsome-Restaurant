import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserManagement from '../components/admin/UserManagement';
import MenuManagement from '../components/admin/MenuManagement';
import TableManagement from '../components/admin/TableManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import Reports from '../components/admin/Reports';
import DashboardHome from '../components/admin/DashboardHome';
import { FiUsers, FiMenu, FiGrid, FiBarChart2, FiLogOut, FiHome, FiShoppingBag } from 'react-icons/fi';
import logo from '../images/dark3.webp';

const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Safety check - if user is not loaded, show loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-dark">
        <div className="text-center">
          <div className="text-restaurant-gold text-xl mb-2">Loading...</div>
          <div className="text-gray-400 text-sm">Loading dashboard</div>
        </div>
      </div>
    );
  }

  // Safety check - if no user, redirect to login
  if (!user) {
    navigate('/admin/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/menu', icon: FiMenu, label: 'Menu' },
    { path: '/admin/tables', icon: FiGrid, label: 'Tables' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-restaurant-dark text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-black/50 backdrop-blur-sm border-r border-restaurant-gold/20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img 
              src={logo} 
              alt="Handsome Restaurant Logo" 
              className="h-10 w-auto object-contain"
            />
            <h1 className="text-2xl font-bold text-restaurant-gold">Handsome Restaurant</h1>
          </div>
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-restaurant-gold text-black'
                      : 'text-gray-300 hover:bg-black/30'
                  }`}
                >
                  <Icon className="text-xl" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-700">
          <div className="mb-4">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/orders" element={<OrdersManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/tables" element={<TableManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
};


export default AdminDashboard;

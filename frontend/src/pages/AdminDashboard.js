import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserManagement from '../components/admin/UserManagement';
import MenuManagement from '../components/admin/MenuManagement';
import TableManagement from '../components/admin/TableManagement';
import OrdersManagement from '../components/admin/OrdersManagement';
import Reports from '../components/admin/Reports';
import DashboardHome from '../components/admin/DashboardHome';
import { FiUsers, FiMenu, FiGrid, FiBarChart2, FiLogOut, FiHome, FiShoppingBag, FiX } from 'react-icons/fi';

const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-restaurant-gold/20 text-white hover:bg-black/70 transition"
      >
        {sidebarOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-black/50 backdrop-blur-sm border-r border-restaurant-gold/20 z-40 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-4 sm:p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <img 
              src="/logo.webp" 
              alt="Handsome Restaurant Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-restaurant-gold/30 shadow-md"
              onError={(e) => {
                console.error('Logo failed to load');
                e.target.style.display = 'none';
              }}
            />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-restaurant-gold">Handsome Restaurant</h1>
          </div>
          <nav className="space-y-2 flex-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-restaurant-gold text-black'
                      : 'text-gray-300 hover:bg-black/30'
                  }`}
                >
                  <Icon className="text-lg sm:text-xl" />
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto pt-4 border-t border-gray-700">
            <div className="mb-4">
              <p className="text-xs sm:text-sm text-gray-400">Logged in as</p>
              <p className="font-semibold text-sm sm:text-base">{user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm sm:text-base"
            >
              <FiLogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 sm:p-6 md:p-8 pt-16 lg:pt-8">
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

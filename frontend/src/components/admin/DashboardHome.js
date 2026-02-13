import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';
import { FiTrendingUp, FiDollarSign, FiShoppingBag, FiUsers, FiClock, FiCheckCircle } from 'react-icons/fi';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayRevenue: 0,
    activeTables: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [orderStatusData, setOrderStatusData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        api.get('/api/orders'),
        api.get('/api/tables')
      ]);

      const orders = ordersRes.data || [];
      const tables = tablesRes.data || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && o.paymentStatus === 'paid';
      });

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalRevenue = orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const activeTables = tables.filter(t => t.status === 'occupied').length;
      const pendingOrders = orders.filter(o => o.paymentStatus === 'unpaid' && ['pending', 'preparing', 'ready'].includes(o.status)).length;
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / orders.filter(o => o.paymentStatus === 'paid').length : 0;

      setStats({
        totalOrders,
        todayRevenue,
        activeTables,
        pendingOrders,
        totalRevenue,
        averageOrderValue: averageOrderValue || 0
      });

      // Revenue chart data (last 7 days)
      const revenueChartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayOrders = orders.filter(o => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === date.getTime() && o.paymentStatus === 'paid';
        });
        
        const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        revenueChartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: dayRevenue
        });
      }
      setRevenueData(revenueChartData);

      // Order status distribution
      const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        served: orders.filter(o => o.status === 'served').length
      };
      
      setOrderStatusData([
        { name: 'Pending', value: statusCounts.pending, color: '#eab308' },
        { name: 'Preparing', value: statusCounts.preparing, color: '#f97316' },
        { name: 'Ready', value: statusCounts.ready, color: '#22c55e' },
        { name: 'Served', value: statusCounts.served, color: '#3b82f6' }
      ]);

      // Top selling items
      const itemCounts = {};
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (itemCounts[item.name]) {
            itemCounts[item.name] += item.quantity;
          } else {
            itemCounts[item.name] = item.quantity;
          }
        });
      });

      const topItemsList = Object.entries(itemCounts)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      
      setTopItems(topItemsList);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-restaurant-gold text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-restaurant-gold text-black px-6 py-3 rounded-lg font-semibold hover:bg-restaurant-warm transition flex items-center gap-2"
        >
          <FiClock /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-restaurant-gold/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Total Orders</p>
              <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
            </div>
            <div className="bg-restaurant-gold/20 p-3 rounded-lg">
              <FiShoppingBag className="text-2xl text-restaurant-gold" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FiTrendingUp className="text-green-400" />
            <span>All time</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-green-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Today's Revenue</p>
              <p className="text-3xl font-bold text-green-400">${stats.todayRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-lg">
              <FiDollarSign className="text-2xl text-green-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FiTrendingUp className="text-green-400" />
            <span>Today</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-red-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Active Tables</p>
              <p className="text-3xl font-bold text-red-400">{stats.activeTables}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-lg">
              <FiUsers className="text-2xl text-red-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Currently occupied</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/20 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">Pending Orders</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-500/20 p-3 rounded-lg">
              <FiClock className="text-2xl text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Awaiting completion</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-restaurant-gold/20 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-restaurant-gold" />
            Revenue Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #d4af37', borderRadius: '8px' }}
                labelStyle={{ color: '#d4af37' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#d4af37" 
                strokeWidth={3}
                dot={{ fill: '#d4af37', r: 5 }}
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-restaurant-gold/20 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiCheckCircle className="text-restaurant-gold" />
            Order Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #d4af37', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-restaurant-gold/20 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiShoppingBag className="text-restaurant-gold" />
            Top Selling Items
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #d4af37', borderRadius: '8px' }}
                labelStyle={{ color: '#d4af37' }}
              />
              <Bar dataKey="quantity" fill="#d4af37" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Stats */}
        <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-6 border border-restaurant-gold/20 shadow-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FiDollarSign className="text-restaurant-gold" />
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-restaurant-gold">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Average Order Value</p>
              <p className="text-3xl font-bold text-white">${stats.averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-black/30 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Paid Orders</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.totalOrders > 0 ? Math.round((stats.totalRevenue / stats.totalOrders) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

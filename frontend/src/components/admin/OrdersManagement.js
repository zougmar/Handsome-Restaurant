import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiClock, FiX, FiRefreshCw, FiSearch, FiCopy, FiFilter } from 'react-icons/fi';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Store all orders for filtering
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, preparing, ready, served, paid, unpaid
  const [searchQuery, setSearchQuery] = useState(''); // Search input
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('date'); // date, amount, table, status
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, searchQuery, sortBy, sortOrder, allOrders]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      const sortedOrders = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAllOrders(sortedOrders);
      applyFilters(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (ordersToFilter = allOrders) => {
    let filteredOrders = [...ordersToFilter];
    
    // Apply status/payment filter
    if (filter === 'paid') {
      filteredOrders = filteredOrders.filter(o => o.paymentStatus === 'paid');
    } else if (filter === 'unpaid') {
      filteredOrders = filteredOrders.filter(o => o.paymentStatus === 'unpaid');
    } else if (filter !== 'all') {
      filteredOrders = filteredOrders.filter(o => o.status === filter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredOrders = filteredOrders.filter(order => {
        // Search by Order ID
        const orderId = order._id ? order._id.toLowerCase() : '';
        if (orderId.includes(query)) return true;
        
        // Search by Table Number
        const tableNumber = order.tableNumber?.toString() || '';
        if (tableNumber.includes(query)) return true;
        
        // Search by Item Names
        const itemNames = order.items?.map(item => item.name?.toLowerCase() || '').join(' ') || '';
        if (itemNames.includes(query)) return true;
        
        // Search by Waiter Name
        const waiterName = order.waiter?.name?.toLowerCase() || '';
        if (waiterName.includes(query)) return true;
        
        // Search by Total Amount
        const totalAmount = order.totalAmount?.toString() || '';
        if (totalAmount.includes(query)) return true;
        
        // Search by Status
        const status = order.status?.toLowerCase() || '';
        if (status.includes(query)) return true;
        
        // Search by Payment Status
        const paymentStatus = order.paymentStatus?.toLowerCase() || '';
        if (paymentStatus.includes(query)) return true;
        
        return false;
      });
    }
    
    // Apply sorting
    filteredOrders.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
          break;
        case 'table':
          comparison = (a.tableNumber || 0) - (b.tableNumber || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        default:
          comparison = new Date(b.createdAt) - new Date(a.createdAt);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setOrders(filteredOrders);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'preparing': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'served': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getPaymentStatusColor = (status) => {
    return status === 'paid' 
      ? 'bg-green-500/20 text-green-400 border-green-500/50'
      : 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const [copiedId, setCopiedId] = useState(null); // Track which ID was copied

  const copyOrderId = async (orderId, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation(); // Prevent row click
    }
    if (!orderId) return;
    
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000); // Clear after 2 seconds
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = orderId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(orderId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getElapsedTime = (createdAt) => {
    if (!createdAt) return '0:00';
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-restaurant-gold text-xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Orders Management</h2>
        <button
          onClick={fetchOrders}
          className="bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="text"
            placeholder="Search by Order ID, Table Number, Item Name, Waiter, Amount, Status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/30 border border-restaurant-gold/20 rounded-lg px-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-restaurant-gold focus:ring-2 focus:ring-restaurant-gold/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              <FiX className="text-xl" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-400">
            Found {orders.length} order{orders.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Filter Tabs and Sort Dropdown */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 flex-1">
          {['all', 'pending', 'preparing', 'ready', 'served', 'paid', 'unpaid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-restaurant-gold text-black'
                  : 'bg-black/30 text-gray-300 hover:bg-black/50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? allOrders.length : allOrders.filter(o => 
                f === 'paid' ? o.paymentStatus === 'paid' :
                f === 'unpaid' ? o.paymentStatus === 'unpaid' :
                o.status === f
              ).length})
            </button>
          ))}
        </div>

        {/* Sort and Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="bg-black/30 border border-restaurant-gold/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-black/50 transition flex items-center gap-2"
          >
            <FiFilter /> Sort & Filter
          </button>
          
          {showFilterDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowFilterDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-2 bg-restaurant-dark border-2 border-restaurant-gold/30 rounded-xl p-4 shadow-2xl z-20 min-w-[250px]">
                <div className="space-y-4">
                  {/* Sort By */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-black/30 border border-restaurant-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-restaurant-gold"
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="table">Table Number</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Order</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full bg-black/30 border border-restaurant-gold/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-restaurant-gold"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block font-semibold">Quick Filters</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setFilter('all');
                          setSearchQuery('');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-black/30 hover:bg-black/50 rounded-lg text-sm transition"
                      >
                        Clear All Filters
                      </button>
                      <button
                        onClick={() => {
                          setFilter('unpaid');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition"
                      >
                        Unpaid Orders Only
                      </button>
                      <button
                        onClick={() => {
                          setFilter('paid');
                          setShowFilterDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm transition"
                      >
                        Paid Orders Only
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-black/30 rounded-xl overflow-hidden border border-restaurant-gold/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/50 border-b border-restaurant-gold/20">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Order ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Table</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Time</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-restaurant-gold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  // Get first item's image for display
                  const firstItem = order.items?.[0];
                  const itemImage = firstItem?.menuItem?.image || firstItem?.image || null;
                  const imageUrl = itemImage 
                    ? (itemImage.startsWith('http') ? itemImage : `http://localhost:5000${itemImage}`)
                    : null;
                  
                  return (
                    <tr
                      key={order._id}
                      className="border-b border-gray-700/30 hover:bg-black/20 transition cursor-pointer"
                      onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
                    >
                      {/* Order Image */}
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/30 border border-gray-700/50 flex-shrink-0">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={firstItem?.name || 'Order'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ display: imageUrl ? 'none' : 'flex' }}>
                            🍽️
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => copyOrderId(order._id, e)}
                          className="flex items-center gap-2 font-mono text-sm hover:text-restaurant-gold transition group"
                          title="Click to copy Order ID"
                        >
                          <span>#{order._id ? order._id.slice(-8).toUpperCase() : 'N/A'}</span>
                          <FiCopy className={`text-xs opacity-0 group-hover:opacity-100 transition ${copiedId === order._id ? 'opacity-100 text-green-400' : ''}`} />
                          {copiedId === order._id && (
                            <span className="text-xs text-green-400 font-semibold">Copied!</span>
                          )}
                        </button>
                      </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">Table {order.tableNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{order.items?.length || 0} items</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-restaurant-gold">${order.totalAmount?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <FiClock />
                        <span>{getElapsedTime(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(selectedOrder?._id === order._id ? null : order);
                        }}
                        className="text-restaurant-gold hover:text-restaurant-warm transition"
                      >
                        {selectedOrder?._id === order._id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-restaurant-dark border-2 border-restaurant-gold/30 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Order Details</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white transition"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Order ID</p>
                  <button
                    onClick={() => copyOrderId(selectedOrder._id, { stopPropagation: () => {} })}
                    className="flex items-center gap-2 font-mono font-semibold hover:text-restaurant-gold transition group"
                    title="Click to copy Order ID"
                  >
                    <span>#{selectedOrder._id ? selectedOrder._id.slice(-8).toUpperCase() : 'N/A'}</span>
                    <FiCopy className={`text-sm opacity-0 group-hover:opacity-100 transition ${copiedId === selectedOrder._id ? 'opacity-100 text-green-400' : ''}`} />
                    {copiedId === selectedOrder._id && (
                      <span className="text-xs text-green-400 font-semibold">Copied!</span>
                    )}
                  </button>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Table Number</p>
                  <p className="font-semibold text-xl">Table {selectedOrder.tableNumber}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Payment Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                  </span>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Created At</p>
                  <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="bg-black/30 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-restaurant-gold">${selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <p className="text-sm text-gray-400 mb-3 font-semibold">Order Items</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700/30">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-400">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-restaurant-gold">
                        ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;

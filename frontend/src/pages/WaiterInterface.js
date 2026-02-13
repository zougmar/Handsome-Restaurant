import React, { useState, useEffect } from 'react';
import { initSocket, getSocket } from '../utils/socket';
import api from '../utils/api';
import { FiRefreshCw, FiCheck, FiPrinter, FiClock, FiUsers, FiShoppingBag, FiDollarSign, FiDownload } from 'react-icons/fi';
import Receipt from '../components/Receipt';
import jsPDF from 'jspdf';

const WaiterInterface = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    initSocket();

    const socket = getSocket();
    socket.emit('join-room', 'waiter');

    socket.on('table-updated', (data) => {
      fetchTables();
    });

    socket.on('order-updated', (data) => {
      console.log('Waiter received order update:', data);
      if (data.type === 'new') {
        console.log('New order received:', data.order);
        // Immediately add to orders list
        if (data.order) {
          setOrders(prev => {
            const exists = prev.find(o => o._id === data.order._id);
            if (!exists) {
              console.log('Adding new order to waiter orders list:', data.order._id);
              return [...prev, data.order];
            }
            return prev;
          });
        }
        // New order - refresh everything
        fetchTables();
        fetchOrders();
        // If the new order is for the selected table, update it immediately
        if (data.order && selectedTable) {
          const orderTableNum = typeof data.order.tableNumber === 'string' ? parseInt(data.order.tableNumber) : data.order.tableNumber;
          const tableNum = typeof selectedTable.number === 'string' ? parseInt(selectedTable.number) : selectedTable.number;
          if (orderTableNum === tableNum) {
            setSelectedTable(prev => prev ? { ...prev, order: data.order } : null);
            fetchTableDetails(selectedTable.number);
          }
        }
      } else {
        // Status or other update
        fetchOrders();
        if (selectedTable && data.order) {
          // Update the order in selected table if it matches
          const orderTableNum = typeof data.order.tableNumber === 'string' ? parseInt(data.order.tableNumber) : data.order.tableNumber;
          const tableNum = typeof selectedTable.number === 'string' ? parseInt(selectedTable.number) : selectedTable.number;
          if (orderTableNum === tableNum) {
            setSelectedTable(prev => prev ? { ...prev, order: data.order } : null);
          }
          fetchTableDetails(selectedTable.number);
        }
      }
    });

    return () => {
      socket.off('table-updated');
      socket.off('order-updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchTables(), fetchOrders()]);
    setLoading(false);
  };

  const fetchTables = async () => {
    try {
      const response = await api.get('/api/tables');
      console.log('Waiter fetched tables:', response.data?.length || 0, 'tables');
      if (response.data && Array.isArray(response.data)) {
        setTables(response.data);
      } else {
        console.warn('Invalid tables response:', response.data);
        setTables([]);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show user-friendly error if tables endpoint fails
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('Tables endpoint not available or error occurred');
      }
      setTables([]);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders');
      console.log('Waiter fetched orders:', response.data?.length || 0, 'orders');
      if (response.data && Array.isArray(response.data)) {
        console.log('Orders data:', response.data);
        setOrders(response.data);
      } else {
        console.warn('Invalid orders response:', response.data);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      setOrders([]);
    }
  };

  const fetchTableDetails = async (tableNumber) => {
    try {
      // Refresh tables first to get latest data
      const tablesRes = await api.get('/api/tables');
      const updatedTables = tablesRes.data;
      setTables(updatedTables);
      
      const table = updatedTables.find(t => t.number === tableNumber);
      if (!table) {
        console.error('Table not found');
        return;
      }

      // Check if table has a currentOrder reference
      if (table.currentOrder) {
        try {
          const orderRes = await api.get(`/api/orders/${table.currentOrder}`);
          setSelectedTable({ ...table, order: orderRes.data });
          return;
        } catch (orderError) {
          console.log('Order not found by ID, searching by table number...');
        }
      }

      // If no currentOrder reference, search for active orders for this table
      const ordersRes = await api.get(`/api/orders?tableNumber=${tableNumber}`);
      console.log('Orders for table', tableNumber, ':', ordersRes.data);
      const activeOrder = ordersRes.data.find(o => {
        const orderTableNum = typeof o.tableNumber === 'string' ? parseInt(o.tableNumber) : o.tableNumber;
        const matches = orderTableNum === tableNumber && 
                       o.paymentStatus === 'unpaid' && 
                       (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'served');
        if (matches) {
          console.log('Found active order for table', tableNumber, ':', o._id);
        }
        return matches;
      });

      if (activeOrder) {
        setSelectedTable({ ...table, order: activeOrder });
      } else {
        // No active order, just show table info
        setSelectedTable(table);
      }
    } catch (error) {
      console.error('Error fetching table details:', error);
      // Still set the table even if order fetch fails
      const table = tables.find(t => t.number === tableNumber);
      if (table) {
        setSelectedTable(table);
      }
    }
  };

  const handleTableClick = async (table) => {
    // Immediately show table info while fetching order details
    setSelectedTable(table);
    // Then fetch full details including order
    await fetchTableDetails(table.number);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
      if (selectedTable) {
        fetchTableDetails(selectedTable.number);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const markAsPaid = async (orderId) => {
    try {
      console.log('Marking order as paid:', orderId);
      const response = await api.put(`/api/orders/${orderId}/payment`, { paymentStatus: 'paid' });
      console.log('Order marked as paid successfully:', response.data);
      
      // Update the order in the selected table
      if (selectedTable && selectedTable.order && selectedTable.order._id === orderId) {
        setSelectedTable(prev => prev ? { 
          ...prev, 
          order: { ...prev.order, paymentStatus: 'paid' } 
        } : null);
      }
      
      // Refresh data
      fetchTables();
      fetchOrders();
      
      // Clear selected table after a short delay to show success
      setTimeout(() => {
        setSelectedTable(null);
      }, 1000);
    } catch (error) {
      console.error('Error marking as paid:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to mark order as paid: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'free': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'awaiting-payment': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
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

  // Update timer every second
  useEffect(() => {
    if (!selectedTable?.order) return;
    const interval = setInterval(() => {
      // Force re-render to update timer
      setSelectedTable(prev => {
        if (prev && prev.order) {
          return { ...prev };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable?.order?._id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-dark">
        <div className="text-restaurant-gold text-2xl">Loading...</div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    totalTables: tables.length,
    occupiedTables: tables.filter(t => t.status === 'occupied').length,
    activeOrders: orders.filter(o => o.paymentStatus === 'unpaid' && ['pending', 'preparing', 'ready'].includes(o.status)).length,
    totalRevenue: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0)
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedTable?.order) {
      alert('No order selected');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt size
      });

      const order = selectedTable.order;
      const restaurant = {
        name: 'Handsome Restaurant',
        address: '123 Restaurant Street, City, State, 12345',
        phone: '(555) 123-4567'
      };

      // Format date and time
      const formatDate = (dateString) => {
        if (!dateString) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      };

      const formatTime = (dateString) => {
        if (!dateString) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      };

      const calculateTax = (subtotal) => {
        return (subtotal * 0.03).toFixed(2);
      };

      const subtotal = order.totalAmount || 0;
      const tax = parseFloat(calculateTax(subtotal));
      const total = subtotal + tax;

      let yPos = 10;

      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(restaurant.name, 40, yPos, { align: 'center' });
      yPos += 7;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(restaurant.address, 40, yPos, { align: 'center' });
      yPos += 4;
      pdf.text(restaurant.phone, 40, yPos, { align: 'center' });
      yPos += 6;

      // Order Number
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      const orderId = order?._id || '';
      pdf.text(`Order #${orderId ? orderId.slice(-8).toUpperCase() : 'N/A'}`, 40, yPos, { align: 'center' });
      yPos += 6;

      // Order Details
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${formatDate(order.createdAt)}`, 5, yPos);
      yPos += 4;
      pdf.text(`Time: ${formatTime(order.createdAt)}`, 5, yPos);
      yPos += 4;
      pdf.text(`Table: ${order.tableNumber}`, 5, yPos);
      yPos += 5;

      // Items Header
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Qty', 5, yPos);
      pdf.text('Item', 20, yPos);
      pdf.text('Price', 70, yPos, { align: 'right' });
      yPos += 4;
      pdf.line(5, yPos, 75, yPos);
      yPos += 3;

      // Items
      pdf.setFont('helvetica', 'normal');
      order.items?.forEach((item) => {
        pdf.text(item.quantity.toString(), 5, yPos);
        pdf.text(item.name, 20, yPos);
        pdf.text(`$${(item.price * item.quantity).toFixed(2)}`, 70, yPos, { align: 'right' });
        yPos += 4;
      });

      yPos += 2;
      pdf.line(5, yPos, 75, yPos);
      yPos += 4;

      // Payment Summary
      pdf.setFontSize(8);
      pdf.text('Payment Method: Cash', 5, yPos);
      yPos += 4;
      pdf.text('Transaction Type: Sale', 5, yPos);
      yPos += 4;
      pdf.text(`Subtotal: $${subtotal.toFixed(2)}`, 5, yPos);
      yPos += 4;
      pdf.text(`Tax: $${tax.toFixed(2)}`, 5, yPos);
      yPos += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total: $${total.toFixed(2)}`, 5, yPos);
      yPos += 6;

      // Transaction Details
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text('Transaction Type: Sale', 5, yPos);
      yPos += 3;
      pdf.text('Authorization: Approved', 5, yPos);
      yPos += 3;
      pdf.text(`Payment Code: ${orderId ? orderId.slice(-14) : 'N/A'}`, 5, yPos);
      yPos += 3;
      pdf.text(`Payment ID: ${orderId ? orderId.slice(-15) : 'N/A'}`, 5, yPos);
      yPos += 5;

      // Tip and Signature
      pdf.setFontSize(8);
      pdf.text('+ Tip: _________________', 5, yPos);
      yPos += 4;
      pdf.text('= Total: _________________', 5, yPos);
      yPos += 6;
      pdf.text('X', 5, yPos);
      yPos += 2;
      pdf.line(5, yPos, 75, yPos);
      yPos += 3;
      pdf.text('Signature', 5, yPos);
      yPos += 6;

      // Footer
      pdf.line(5, yPos, 75, yPos);
      yPos += 4;
      pdf.setFontSize(7);
      pdf.text('Customer Copy', 40, yPos, { align: 'center' });
      yPos += 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Thanks for visiting', 40, yPos, { align: 'center' });
      yPos += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(restaurant.name, 40, yPos, { align: 'center' });

      // Generate filename
      const filename = `receipt-${orderId ? orderId.slice(-8) : 'order'}-${Date.now()}.pdf`;

      // Save PDF
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <>
      {/* Print-only receipt */}
      <div className="hidden print:block print:bg-white">
        {selectedTable?.order && (
          <Receipt order={selectedTable.order} />
        )}
      </div>

      {/* Main interface - hidden when printing */}
      <div className="min-h-screen bg-gradient-to-br from-restaurant-dark via-black to-restaurant-dark text-white print:hidden">
        {/* Professional Header */}
      <header className="bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-md border-b-2 border-restaurant-gold/30 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.webp" 
                alt="Handsome Restaurant Logo" 
                className="h-20 w-20 rounded-full object-cover border-2 border-restaurant-gold/30 shadow-lg"
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-4xl font-bold text-restaurant-gold mb-1">Waiter Dashboard</h1>
                <p className="text-sm text-gray-300 font-medium">Handsome Restaurant • Staff Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchData}
                className="bg-restaurant-gold/90 hover:bg-restaurant-gold text-black px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-restaurant-gold/50 transform hover:scale-105"
              >
                <FiRefreshCw className="text-lg" /> Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-5 border border-restaurant-gold/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Total Tables</p>
                <p className="text-3xl font-bold text-white">{stats.totalTables}</p>
              </div>
              <div className="bg-restaurant-gold/20 p-3 rounded-lg">
                <FiUsers className="text-2xl text-restaurant-gold" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-5 border border-red-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Occupied</p>
                <p className="text-3xl font-bold text-red-400">{stats.occupiedTables}</p>
              </div>
              <div className="bg-red-500/20 p-3 rounded-lg">
                <div className="w-6 h-6 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-5 border border-yellow-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Active Orders</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.activeOrders}</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-lg">
                <FiShoppingBag className="text-2xl text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-xl p-5 border border-green-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-400">${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FiDollarSign className="text-2xl text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Table Management</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Payment</span>
                </div>
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-restaurant-gold/10 shadow-2xl">
              {tables.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg mb-2">No tables found</p>
                  <p className="text-gray-500 text-sm">Please create tables in the Admin Dashboard</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {tables.map(table => {
                    // Find order for this table - handle both string and number comparison
                    const tableOrder = orders.find(o => {
                      const orderTableNum = typeof o.tableNumber === 'string' ? parseInt(o.tableNumber) : o.tableNumber;
                      const tableNum = typeof table.number === 'string' ? parseInt(table.number) : table.number;
                      const matches = orderTableNum === tableNum && 
                                     o.paymentStatus === 'unpaid' &&
                                     (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready');
                      if (matches) {
                        console.log('Found order for table', table.number, ':', o._id, o.status);
                      }
                      return matches;
                    });
                    return (
                    <button
                      key={table._id}
                      onClick={() => handleTableClick(table)}
                      className={`aspect-square rounded-xl p-4 flex flex-col items-center justify-center transition-all duration-200 relative group ${
                        selectedTable?.number === table.number
                          ? 'ring-4 ring-restaurant-gold bg-gradient-to-br from-restaurant-gold/20 to-restaurant-gold/10 scale-105 shadow-2xl shadow-restaurant-gold/50'
                          : 'bg-gradient-to-br from-black/40 to-black/20 hover:from-black/50 hover:to-black/30 hover:scale-105'
                      } ${tableOrder ? 'border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' : 'border border-gray-700/50'}`}
                    >
                      {tableOrder && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-500 rounded-full animate-pulse shadow-lg shadow-yellow-500/50"></div>
                      )}
                      <div className={`w-5 h-5 rounded-full mb-2 shadow-lg ${getStatusColor(table.status)}`}></div>
                      <span className="text-3xl font-bold text-white group-hover:text-restaurant-gold transition">{table.number}</span>
                      <span className="text-xs text-gray-400 mt-1 font-medium">{table.capacity} seats</span>
                      {tableOrder && (
                        <span className="text-xs text-yellow-400 mt-1 font-bold bg-yellow-500/20 px-2 py-0.5 rounded-full">
                          {tableOrder.status.toUpperCase()}
                        </span>
                      )}
                    </button>
                  );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-white">Order Details</h2>
            </div>
            {selectedTable ? (
              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-sm rounded-2xl p-6 border border-restaurant-gold/20 shadow-2xl sticky top-24">
                <div className="mb-6 pb-6 border-b-2 border-restaurant-gold/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">Table {selectedTable.number}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedTable.status === 'free' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                      selectedTable.status === 'occupied' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                    }`}>
                      {selectedTable.status.replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Capacity</p>
                      <p className="text-lg font-bold text-white">{selectedTable.capacity} seats</p>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Table Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedTable.status)}`}></div>
                        <p className="text-lg font-bold text-white capitalize">{selectedTable.status.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTable.order ? (
                  <div className="space-y-4">
                    {/* Order Header with Status and Timer */}
                    <div className="bg-gradient-to-br from-black/50 to-black/30 p-5 rounded-xl border-2 border-restaurant-gold/30 shadow-lg mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1 font-medium">Order ID</p>
                          <p className="text-sm font-mono text-restaurant-gold font-bold">
                            #{selectedTable.order._id ? selectedTable.order._id.slice(-8).toUpperCase() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1 font-medium">Order Status</p>
                          <span className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${
                            selectedTable.order.status === 'pending' ? 'bg-yellow-500/30 text-yellow-300 border-2 border-yellow-500/50' :
                            selectedTable.order.status === 'preparing' ? 'bg-orange-500/30 text-orange-300 border-2 border-orange-500/50' :
                            selectedTable.order.status === 'ready' ? 'bg-green-500/30 text-green-300 border-2 border-green-500/50' :
                            'bg-blue-500/30 text-blue-300 border-2 border-blue-500/50'
                          }`}>
                            {selectedTable.order.status ? (selectedTable.order.status.charAt(0).toUpperCase() + selectedTable.order.status.slice(1)) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Timer Display */}
                      <div className="flex items-center justify-center gap-3 bg-gradient-to-r from-restaurant-gold/20 to-restaurant-gold/10 p-4 rounded-xl border border-restaurant-gold/30 shadow-lg">
                        <FiClock className="text-restaurant-gold text-2xl" />
                        <div className="text-center">
                          <p className="text-xs text-gray-300 mb-1 font-medium">Elapsed Time</p>
                          <p className="text-3xl font-bold text-restaurant-gold font-mono tracking-wider">
                            {getElapsedTime(selectedTable.order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>


                    {/* Order Items */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold text-white">Order Items</p>
                        <span className="text-sm text-gray-400 bg-black/30 px-3 py-1 rounded-full">
                          {selectedTable.order.items.length} {selectedTable.order.items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {selectedTable.order.items.map((item, index) => {
                          // Get image from item.menuItem if populated, or from item.image
                          const itemImage = item.menuItem?.image || item.image || null;
                          const imageUrl = itemImage 
                            ? (itemImage.startsWith('http') ? itemImage : `http://localhost:5000${itemImage}`)
                            : null;
                          
                          return (
                            <div key={index} className="bg-gradient-to-r from-black/40 to-black/20 p-4 rounded-xl border border-gray-700/30 hover:border-restaurant-gold/30 transition-all shadow-md">
                              <div className="flex gap-4 items-start">
                                {/* Item Image */}
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-black/30 flex-shrink-0 border border-gray-700/50">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-full flex items-center justify-center text-3xl" style={{ display: imageUrl ? 'none' : 'flex' }}>
                                    🍽️
                                  </div>
                                </div>
                                
                                {/* Item Details */}
                                <div className="flex-1 flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-bold text-white text-lg mb-2">{item.name}</p>
                                    <div className="flex items-center gap-4">
                                      <div className="bg-restaurant-gold/20 px-3 py-1 rounded-lg">
                                        <p className="text-sm text-gray-300">Qty: <span className="text-restaurant-gold font-bold text-base">{item.quantity}</span></p>
                                      </div>
                                      <div className="bg-black/30 px-3 py-1 rounded-lg">
                                        <p className="text-sm text-gray-300">Unit: <span className="text-white font-semibold">${item.price?.toFixed(2) || '0.00'}</span></p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <p className="text-2xl font-bold text-restaurant-gold">
                                      ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-6 border-t-2 border-restaurant-gold/20">
                      {/* Total Amount */}
                      <div className="bg-gradient-to-r from-restaurant-gold/20 to-restaurant-gold/10 p-5 rounded-xl border-2 border-restaurant-gold/30 mb-6 shadow-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-300">Total Amount</span>
                          <span className="text-3xl font-bold text-restaurant-gold">
                            ${selectedTable.order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-restaurant-gold/20">
                          <p className="text-xs text-gray-400">
                            Payment Status: <span className={`font-bold ${
                              selectedTable.order.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {selectedTable.order.paymentStatus.toUpperCase()}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* Status Change Buttons */}
                        {selectedTable.order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(selectedTable.order._id, 'preparing')}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-4 rounded-xl text-base font-bold hover:from-orange-700 hover:to-orange-600 transition-all shadow-lg hover:shadow-orange-500/50 transform hover:scale-105"
                          >
                            Start Preparing
                          </button>
                        )}
                        {selectedTable.order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(selectedTable.order._id, 'ready')}
                            className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-4 rounded-xl text-base font-bold hover:from-green-700 hover:to-green-600 transition-all shadow-lg hover:shadow-green-500/50 transform hover:scale-105"
                          >
                            Mark as Ready
                          </button>
                        )}
                        {selectedTable.order.status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(selectedTable.order._id, 'served')}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 transform hover:scale-105"
                          >
                            Mark as Served
                          </button>
                        )}

                        {selectedTable.order.paymentStatus === 'unpaid' && (
                          <button
                            onClick={() => markAsPaid(selectedTable.order._id)}
                            className="w-full bg-gradient-to-r from-restaurant-gold to-restaurant-warm text-black px-6 py-4 rounded-xl text-base font-bold hover:from-restaurant-warm hover:to-restaurant-gold transition-all shadow-lg hover:shadow-restaurant-gold/50 transform hover:scale-105 flex items-center justify-center gap-2"
                          >
                            <FiCheck className="text-xl" /> Mark as Paid
                          </button>
                        )}
                        <button
                          onClick={handlePrintReceipt}
                          className="w-full bg-gradient-to-r from-gray-700 to-gray-600 text-white px-6 py-4 rounded-xl text-base font-bold hover:from-gray-600 hover:to-gray-500 transition-all shadow-lg hover:shadow-gray-500/50 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <FiPrinter className="text-xl" /> Print Receipt
                        </button>
                        <button
                          onClick={handleDownloadPDF}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4 rounded-xl text-base font-bold hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <FiDownload className="text-xl" /> Download PDF
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No active order for this table
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-black/30 rounded-lg p-6 text-center text-gray-400">
                Select a table to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default WaiterInterface;

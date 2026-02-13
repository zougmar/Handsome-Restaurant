import React, { useState, useEffect, useRef } from 'react';
import { initSocket, getSocket } from '../utils/socket';
import api from '../utils/api';
import { FiCheck, FiClock } from 'react-icons/fi';

const KitchenInterface = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    initSocket();

    const socket = getSocket();
    socket.emit('join-room', 'kitchen');

    socket.on('order-updated', (data) => {
      console.log('Kitchen received order update:', data);
      if (data.type === 'new') {
        console.log('New order for kitchen:', data.order);
        playSound();
        // Immediately add new order to the list
        if (data.order) {
          const orderStatus = data.order.status || 'pending';
          if (['pending', 'preparing', 'ready'].includes(orderStatus)) {
            setOrders(prev => {
              const exists = prev.find(o => o._id === data.order._id);
              if (!exists) {
                console.log('Adding new order to kitchen display:', data.order._id);
                return [...prev, data.order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
              }
              return prev;
            });
          } else {
            console.log('Order status not suitable for kitchen:', orderStatus);
          }
        } else {
          console.warn('Order data missing in update');
        }
        // Also refresh to ensure we have the latest
        fetchOrders();
      } else {
        // Update existing order or refresh all
        fetchOrders();
      }
    });

    return () => {
      socket.off('order-updated');
    };
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders with multiple statuses
      const response = await api.get('/api/orders?status=pending,preparing,ready');
      console.log('Kitchen fetched orders response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        // Filter to only show pending, preparing, and ready orders (double check)
        const filteredOrders = response.data.filter(order => 
          order && ['pending', 'preparing', 'ready'].includes(order.status)
        );
        const sortedOrders = filteredOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        console.log('Kitchen filtered and sorted orders:', sortedOrders.length, 'orders');
        setOrders(sortedOrders);
      } else {
        console.log('No orders found or invalid response format');
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Try fetching all orders as fallback
      try {
        const fallbackResponse = await api.get('/api/orders');
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
          const filtered = fallbackResponse.data.filter(o => 
            o && ['pending', 'preparing', 'ready'].includes(o.status)
          );
          setOrders(filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        }
      } catch (fallbackError) {
        console.error('Fallback fetch also failed:', fallbackError);
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      console.log('Updating order status:', orderId, 'to', status);
      const response = await api.put(`/api/orders/${orderId}/status`, { status });
      console.log('Status updated successfully:', response.data);
      // Update the order in the list immediately
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
      // Also refresh to get latest data
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Extract error message properly
      let errorMessage = 'Failed to update order status. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : error.response.data.error.message || errorMessage;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors[0]?.msg || error.response.data.errors[0]?.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Failed to update order status: ${errorMessage}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'border-red-500 bg-red-500/10';
      case 'preparing': return 'border-yellow-500 bg-yellow-500/10';
      case 'ready': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '🔴';
      case 'preparing': return '🟡';
      case 'ready': return '🟢';
      default: return '⚪';
    }
  };

  const getElapsedTime = (order) => {
    // Only show timer when status is "preparing" or "ready"
    if (!order || (order.status !== 'preparing' && order.status !== 'ready')) {
      return null;
    }
    
    // Use preparingStartedAt if available, otherwise fallback to createdAt
    const startTime = order.preparingStartedAt || order.createdAt;
    if (!startTime) return '0:00';
    
    // If status is "ready", calculate time from preparingStartedAt to updatedAt (when it became ready)
    // If status is "preparing", calculate time from preparingStartedAt to now
    let endTime;
    if (order.status === 'ready' && order.updatedAt) {
      endTime = new Date(order.updatedAt);
    } else {
      endTime = new Date();
    }
    
    const start = new Date(startTime);
    const diff = Math.floor((endTime - start) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update timer every second - only for orders with status "preparing" (timer stops at "ready")
  useEffect(() => {
    const hasPreparingOrders = orders.some(order => order.status === 'preparing');
    if (!hasPreparingOrders) return;
    
    const interval = setInterval(() => {
      // Force re-render to update timers for preparing orders only
      setOrders(prev => prev.map(order => {
        if (order.status === 'preparing') {
          return { ...order };
        }
        return order;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, [orders.length, orders.filter(o => o.status === 'preparing').length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-dark">
        <div className="text-restaurant-gold text-2xl">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-restaurant-dark text-white p-6">
      {/* Audio for new order notifications - add notification.mp3 to public folder */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }}>
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Header */}
      <header className="mb-6 flex items-center gap-4">
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
          <h1 className="text-4xl font-bold text-restaurant-gold">Kitchen Display System</h1>
          <p className="text-gray-400">Handsome Restaurant</p>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map(order => (
          <div
            key={order._id}
            className={`border-2 rounded-lg p-4 ${getStatusColor(order.status)} fade-in`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-2xl font-bold">Table {order.tableNumber}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl">{getStatusIcon(order.status)}</span>
                  <span className="text-sm capitalize">{order.status}</span>
                </div>
              </div>
              <div className="text-right">
                {(order.status === 'preparing' || order.status === 'ready') && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <FiClock />
                    <span>{getElapsedTime(order) || '0:00'}</span>
                    {order.status === 'ready' && (
                      <span className="text-green-400 ml-1">(Stopped)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => {
                // Get image from item.menuItem if populated, or from item.image
                const itemImage = item.menuItem?.image || item.image || null;
                const imageUrl = itemImage 
                  ? (itemImage.startsWith('http') ? itemImage : `http://localhost:5000${itemImage}`)
                  : null;
                
                return (
                  <div key={index} className="bg-gradient-to-r from-black/40 to-black/20 p-4 rounded-xl border border-gray-700/30 hover:border-restaurant-gold/30 transition-all shadow-lg">
                    <div className="flex gap-4 items-center">
                      {/* Item Image - Bigger and Better Styled */}
                      <div className="w-28 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-black/60 to-black/40 flex-shrink-0 border-2 border-restaurant-gold/30 shadow-xl relative group">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-800 to-gray-900" style={{ display: imageUrl ? 'none' : 'flex' }}>
                          🍽️
                        </div>
                        {/* Quantity Badge Overlay */}
                        <div className="absolute top-2 right-2 bg-restaurant-gold text-black rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-black/50">
                          {item.quantity}
                        </div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="mb-2">
                          <h4 className="font-bold text-white text-lg mb-1 truncate">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-restaurant-gold font-bold text-base">Qty: {item.quantity}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-300 text-sm">${item.price?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                        {item.specialInstructions && (
                          <div className="mt-2 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-300 font-medium">📝 {item.specialInstructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-700">
              <div className="flex justify-between mb-3">
                <span className="font-semibold">Total:</span>
                <span className="text-restaurant-gold font-bold">${order.totalAmount.toFixed(2)}</span>
              </div>

              <div className="space-y-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                    className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'ready')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <FiCheck /> Mark as Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <div className="text-center text-green-400 font-semibold py-2">
                    Ready for Pickup
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">👨‍🍳</div>
          <p className="text-2xl text-gray-400">No active orders</p>
        </div>
      )}
    </div>
  );
};

export default KitchenInterface;

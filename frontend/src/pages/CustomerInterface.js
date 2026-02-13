import React, { useState, useEffect } from 'react';
import { initSocket, getSocket } from '../utils/socket';
import api from '../utils/api';
import { FiShoppingCart, FiPlus, FiMinus, FiX, FiCheck } from 'react-icons/fi';

const CustomerInterface = () => {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');

  useEffect(() => {
    fetchMenu();
    initSocket();

    const socket = getSocket();
    const handleOrderUpdate = (data) => {
      if (data.order) {
        setOrderStatus(prevStatus => {
          if (prevStatus && data.order._id === prevStatus._id) {
            return data.order;
          }
          return prevStatus;
        });
      }
    };

    socket.on('order-updated', handleOrderUpdate);

    return () => {
      socket.off('order-updated', handleOrderUpdate);
    };
  }, []);

  const fetchMenu = async () => {
    try {
      const [menuRes, categoriesRes] = await Promise.all([
        api.get('/api/menu').catch(err => {
          console.error('Menu fetch error:', err);
          return { data: [] };
        }),
        api.get('/api/menu?type=categories').catch(err => {
          console.error('Categories fetch error:', err);
          return { data: [] };
        })
      ]);
      setMenu(menuRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenu([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.menuItem === item._id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.menuItem === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { menuItem: item._id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.menuItem === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.menuItem !== itemId));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleConfirmOrderClick = () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }
    setShowTableModal(true);
    setTableNumber('');
  };

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    
    const tableNum = parseInt(tableNumber);
    
    if (!tableNumber || isNaN(tableNum) || tableNum < 1) {
      alert('Please enter a valid table number (1 or higher).');
      return;
    }

    setShowTableModal(false);
    await placeOrder(tableNum);
  };

  const placeOrder = async (tableNum) => {
    try {
      const response = await api.post('/api/orders', {
        tableNumber: tableNum,
        items: cart.map(item => ({
          menuItem: item.menuItem,
          quantity: item.quantity
        }))
      });

      setOrderStatus(response.data);
      setCart([]);
      setTableNumber('');
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      
      // Extract error message properly
      let errorMessage = 'Failed to place order. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors[0]?.msg || error.response.data.errors[0]?.message || errorMessage;
        } else if (error.response.data.error) {
          errorMessage = typeof error.response.data.error === 'string' 
            ? error.response.data.error 
            : error.response.data.error.message || errorMessage;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };

  const filteredMenu = selectedCategory === 'all'
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'preparing': return 'text-orange-400';
      case 'ready': return 'text-green-400';
      case 'served': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-dark">
        <div className="text-restaurant-gold text-2xl">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-restaurant-dark text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-restaurant-gold/20 sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <img 
                src="/logo.webp" 
                alt="Handsome Restaurant Logo" 
                className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full object-cover border-2 border-restaurant-gold/30 shadow-lg flex-shrink-0"
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-restaurant-gold">Handsome Restaurant</h1>
                <p className="text-xs sm:text-sm text-gray-400">Digital Menu</p>
              </div>
            </div>
            {orderStatus && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm text-gray-400">Order Status</p>
                <p className={`text-sm sm:text-base md:text-lg font-semibold ${getStatusColor(orderStatus.status)}`}>
                  {orderStatus.status.charAt(0).toUpperCase() + orderStatus.status.slice(1)}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {orderStatus ? (
          // Order Tracking View
          <div className="max-w-2xl mx-auto">
            <div className="bg-black/30 rounded-lg p-4 sm:p-6 md:p-8 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-restaurant-gold mb-4">Order Placed!</h2>
              <div className="space-y-4">
                <div className="text-6xl mb-4">
                  {orderStatus.status === 'pending' && '⏳'}
                  {orderStatus.status === 'preparing' && '👨‍🍳'}
                  {orderStatus.status === 'ready' && '✅'}
                  {orderStatus.status === 'served' && '🍽️'}
                </div>
                <p className={`text-2xl font-semibold ${getStatusColor(orderStatus.status)}`}>
                  {orderStatus.status.charAt(0).toUpperCase() + orderStatus.status.slice(1)}
                </p>
                <p className="text-gray-400">Order #{orderStatus._id.slice(-6)}</p>
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => setOrderStatus(null)}
                    className="bg-restaurant-gold text-black px-8 py-3 rounded-lg font-semibold hover:bg-restaurant-warm transition"
                  >
                    Place New Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Categories */}
            <div className="mb-4 sm:mb-6 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 sm:px-6 py-2 rounded-full font-medium transition text-sm sm:text-base ${
                    selectedCategory === 'all'
                      ? 'bg-restaurant-gold text-black'
                      : 'bg-black/30 text-white hover:bg-black/50'
                  }`}
                >
                  All
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-6 py-2 rounded-full font-medium transition whitespace-nowrap text-sm sm:text-base ${
                      selectedCategory === category
                        ? 'bg-restaurant-gold text-black'
                        : 'bg-black/30 text-white hover:bg-black/50'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20 sm:mb-24">
              {filteredMenu.map(item => (
                <div
                  key={item._id}
                  className="bg-black/30 rounded-lg overflow-hidden hover:bg-black/50 transition fade-in"
                >
                  <div className="aspect-video bg-gray-800 flex items-center justify-center overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="text-4xl" style={{ display: item.image ? 'none' : 'flex' }}>🍽️</div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{item.name}</h3>
                    {item.description && (
                      <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-restaurant-gold">
                        ${item.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-restaurant-gold text-black px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                      >
                        <FiPlus className="text-sm sm:text-base" /> <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-restaurant-gold/20 p-3 sm:p-4 z-40">
                <div className="container mx-auto">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <FiShoppingCart /> <span className="hidden sm:inline">Cart</span> ({cart.length})
                    </h3>
                    <button
                      onClick={() => setCart([])}
                      className="text-gray-400 hover:text-white text-sm sm:text-base"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2 mb-3 sm:mb-4 max-h-32 sm:max-h-40 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.menuItem} className="flex items-center justify-between bg-black/30 p-2 sm:p-3 rounded gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                          <p className="text-xs sm:text-sm text-gray-400">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <button
                            onClick={() => updateQuantity(item.menuItem, -1)}
                            className="bg-gray-700 hover:bg-gray-600 p-1.5 sm:p-2 rounded"
                          >
                            <FiMinus className="text-sm sm:text-base" />
                          </button>
                          <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.menuItem, 1)}
                            className="bg-gray-700 hover:bg-gray-600 p-1.5 sm:p-2 rounded"
                          >
                            <FiPlus className="text-sm sm:text-base" />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.menuItem)}
                            className="text-red-400 hover:text-red-300 ml-1 sm:ml-2"
                          >
                            <FiX className="text-sm sm:text-base" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-700">
                    <span className="text-xl sm:text-2xl font-bold text-center sm:text-left">Total: ${getTotal().toFixed(2)}</span>
                    <button
                      onClick={handleConfirmOrderClick}
                      className="bg-restaurant-gold text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-restaurant-warm transition w-full sm:w-auto"
                    >
                      Confirm Order
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Table Number Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-restaurant-dark to-black rounded-2xl shadow-2xl border-2 border-restaurant-gold/30 max-w-md w-full transform transition-all animate-fade-in">
            <div className="p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-restaurant-gold/20 mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl">🍽️</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-restaurant-gold mb-2">
                  Enter Table Number
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  Please enter your table number to complete your order
                </p>
              </div>

              <form onSubmit={handleTableSubmit}>
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Table Number
                  </label>
                  <input
                    type="number"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Enter table number"
                    min="1"
                    autoFocus
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-black/50 border-2 border-gray-700 rounded-lg text-white text-base sm:text-lg font-semibold focus:outline-none focus:border-restaurant-gold transition-colors placeholder-gray-500"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTableModal(false);
                      setTableNumber('');
                    }}
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 sm:py-3 bg-restaurant-gold hover:bg-restaurant-warm text-black rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FiCheck className="text-xl" />
                    Confirm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInterface;

import React from 'react';

const Receipt = ({ order, restaurantInfo }) => {
  const restaurant = restaurantInfo || {
    name: 'Handsome Restaurant',
    address: '123 Restaurant Street, City, State, 12345',
    phone: '(555) 123-4567'
  };

  const formatDate = (dateString) => {
    if (!dateString) return new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const calculateTax = (subtotal) => {
    // Assuming 3% tax rate
    return (subtotal * 0.03).toFixed(2);
  };

  if (!order) return null;

  const subtotal = order.totalAmount || 0;
  const tax = parseFloat(calculateTax(subtotal));
  const total = subtotal + tax;

  return (
    <div className="receipt-container" style={{ 
      width: '80mm', 
      maxWidth: '300px', 
      margin: '0 auto', 
      padding: '15px 20px',
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      lineHeight: '1.5',
      backgroundColor: 'white',
      color: 'black',
      letterSpacing: '0.3px'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {restaurant.name}
        </h2>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>
          {restaurant.address}
        </p>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>
          {restaurant.phone}
        </p>
      </div>

      {/* Order Number */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
          Order #{order._id ? order._id.slice(-6).toUpperCase() : 'N/A'}
        </p>
      </div>

      {/* Order Details */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Date:</span>
          <span>{formatDate(order.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Time:</span>
          <span>{formatTime(order.createdAt)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Table:</span>
          <span>{order.tableNumber}</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '5px' }}>
          <span style={{ width: '15%' }}>Qty</span>
          <span style={{ width: '55%' }}>Item</span>
          <span style={{ width: '30%', textAlign: 'right' }}>Price</span>
        </div>
        {order.items && order.items.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            borderBottom: index < order.items.length - 1 ? '1px dashed #ccc' : 'none',
            paddingBottom: index < order.items.length - 1 ? '5px' : '0'
          }}>
            <span style={{ width: '15%' }}>{item.quantity}</span>
            <span style={{ width: '55%' }}>{item.name}</span>
            <span style={{ width: '30%', textAlign: 'right' }}>
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Payment Method:</span>
          <span style={{ textAlign: 'right' }}>Cash</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Transaction Type:</span>
          <span style={{ textAlign: 'right' }}>Sale</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Subtotal:</span>
          <span style={{ textAlign: 'right' }}>${subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Tax:</span>
          <span style={{ textAlign: 'right' }}>${tax.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontWeight: 'bold', borderTop: '1px dashed #000', paddingTop: '5px', marginTop: '5px' }}>
          <span>Total:</span>
          <span style={{ textAlign: 'right' }}>${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Transaction Details */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Transaction Type:</span>
          <span>Sale</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Authorization:</span>
          <span>Approved</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Payment Code:</span>
          <span>{order._id ? order._id.slice(-14) : 'N/A'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Payment ID:</span>
          <span>{order._id ? order._id.slice(-15) : 'N/A'}</span>
        </div>
      </div>

      {/* Tip and Signature */}
      <div style={{ marginBottom: '15px', borderBottom: '1px solid #000', paddingBottom: '10px' }}>
        <div style={{ marginBottom: '10px' }}>
          <span>+ Tip: _________________</span>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <span>= Total: _________________</span>
        </div>
        <div style={{ marginTop: '20px' }}>
          <span>X</span>
          <div style={{ borderTop: '1px dashed #000', marginTop: '5px', paddingTop: '5px' }}>
            Signature
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '15px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>
          Customer Copy
        </p>
        <p style={{ margin: '5px 0', fontSize: '11px', fontWeight: 'bold' }}>
          Thanks for visiting
        </p>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>
          {restaurant.name}
        </p>
      </div>
    </div>
  );
};

export default Receipt;

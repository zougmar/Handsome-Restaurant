import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-restaurant-dark">
        <div className="text-center">
          <div className="text-restaurant-gold text-xl mb-2">Loading...</div>
          <div className="text-gray-400 text-sm">Verifying authentication</div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    console.log('ProtectedRoute: User is not admin, redirecting to login');
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

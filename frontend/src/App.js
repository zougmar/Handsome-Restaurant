import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomerInterface from './pages/CustomerInterface';
import WaiterInterface from './pages/WaiterInterface';
import KitchenInterface from './pages/KitchenInterface';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/customer" element={<CustomerInterface />} />
          <Route path="/waiter" element={<WaiterInterface />} />
          <Route path="/kitchen" element={<KitchenInterface />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/customer" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

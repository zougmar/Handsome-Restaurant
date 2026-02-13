import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result && result.success) {
        // Check user role from result
        const userRole = result.user?.role;
        if (userRole === 'admin') {
          // Small delay to ensure state is updated
          setTimeout(() => {
            navigate('/admin');
          }, 100);
        } else {
          setError('Admin access required');
          setLoading(false);
        }
      } else {
        setError(result?.message || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login submission error:', error);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-restaurant-dark flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-8 w-full max-w-md border border-restaurant-gold/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.webp" 
              alt="Handsome Restaurant Logo" 
              className="h-24 w-24 rounded-full object-cover border-4 border-restaurant-gold/30 shadow-lg"
              onError={(e) => {
                console.error('Logo failed to load');
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-4xl font-bold text-restaurant-gold mb-2">Handsome Restaurant</h1>
          <p className="text-gray-400">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-restaurant-gold"
              placeholder="admin@handsome.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-restaurant-gold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-restaurant-gold text-black px-4 py-3 rounded-lg font-bold text-lg hover:bg-restaurant-warm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;

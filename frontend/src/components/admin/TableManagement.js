import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    capacity: ''
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await api.get('/api/tables');
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity)
      };
      if (editingTable) {
        await api.put(`/api/tables/${editingTable._id}`, data);
      } else {
        await api.post('/api/tables', data);
      }
      fetchTables();
      resetForm();
    } catch (error) {
      console.error('Error saving table:', error);
      alert('Error saving table');
    }
  };

  const handleEdit = (table) => {
    setEditingTable(table);
    setFormData({
      number: table.number.toString(),
      capacity: table.capacity.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      try {
        await api.delete(`/api/tables/${id}`);
        fetchTables();
      } catch (error) {
        console.error('Error deleting table:', error);
        alert('Error deleting table');
      }
    }
  };

  const resetForm = () => {
    setFormData({ number: '', capacity: '' });
    setEditingTable(null);
    setShowModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'free': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'awaiting-payment': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Table Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition flex items-center gap-2"
        >
          <FiPlus /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <div
            key={table._id}
            className="bg-black/30 rounded-lg p-6 flex flex-col items-center justify-center relative group"
          >
            <div className={`w-4 h-4 rounded-full mb-3 ${getStatusColor(table.status)}`}></div>
            <div className="text-3xl font-bold mb-1">{table.number}</div>
            <div className="text-sm text-gray-400 mb-4">{table.capacity} seats</div>
            <div className="opacity-0 group-hover:opacity-100 transition absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => handleEdit(table)}
                className="p-1 hover:bg-black/30 rounded text-restaurant-gold"
              >
                <FiEdit />
              </button>
              <button
                onClick={() => handleDelete(table._id)}
                className="p-1 hover:bg-red-500/20 rounded text-red-400"
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-restaurant-dark border border-restaurant-gold/20 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">
                {editingTable ? 'Edit Table' : 'Add Table'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Table Number</label>
                <input
                  type="number"
                  min="1"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  required
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Capacity</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition"
                >
                  {editingTable ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;

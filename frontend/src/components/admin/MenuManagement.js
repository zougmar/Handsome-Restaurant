import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiPlus, FiEdit, FiTrash2, FiX } from 'react-icons/fi';

const MenuManagement = () => {
  const [menu, setMenu] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    image: null,
    imageUrl: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useImageUrl, setUseImageUrl] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const [menuRes, categoriesRes] = await Promise.all([
        api.get('/api/menu'),
        api.get('/api/menu?type=categories')
      ]);
      // Ensure images have full URLs for display
      const menuWithImages = menuRes.data.map(item => ({
        ...item,
        image: item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : null
      }));
      setMenu(menuWithImages);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      if (useImageUrl && formData.imageUrl) {
        // Use image URL - send as JSON
        const data = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          isAvailable: formData.isAvailable,
          image: formData.imageUrl
        };

        if (editingItem) {
          await api.put(`/api/menu/${editingItem._id}`, data);
        } else {
          await api.post('/api/menu', data);
        }
      } else if (formData.image) {
        // Use file upload - send as FormData
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('price', parseFloat(formData.price).toString());
        formDataToSend.append('category', formData.category);
        formDataToSend.append('isAvailable', formData.isAvailable.toString());
        formDataToSend.append('image', formData.image);

        if (editingItem) {
          await api.put(`/api/menu/${editingItem._id}`, formDataToSend);
        } else {
          await api.post('/api/menu', formDataToSend);
        }
      } else {
        // No image - send as JSON
        const data = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          isAvailable: formData.isAvailable
        };

        if (editingItem) {
          await api.put(`/api/menu/${editingItem._id}`, data);
        } else {
          await api.post('/api/menu', data);
        }
      }
      
      await fetchMenu(); // Wait for menu to refresh
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Network error. Please check if the server is running.';
      alert('Error saving menu item: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    const existingImageUrl = item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`) : '';
    
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      isAvailable: item.isAvailable,
      image: null,
      imageUrl: item.image && item.image.startsWith('http') ? item.image : ''
    });
    
    // Add category to list if it doesn't exist
    if (item.category && !categories.includes(item.category)) {
      setCategories([...categories, item.category].sort());
    }
    
    // Determine if existing image is a URL or uploaded file
    if (item.image) {
      if (item.image.startsWith('http')) {
        setUseImageUrl(true);
        setImagePreview(item.image);
      } else {
        setUseImageUrl(false);
        setImagePreview(existingImageUrl);
      }
    } else {
      setImagePreview(null);
      setUseImageUrl(false);
    }
    setShowNewCategoryInput(false);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file, imageUrl: '' });
      setUseImageUrl(false);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, imageUrl: url, image: null });
    setUseImageUrl(true);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await api.delete(`/api/menu/${id}`);
        fetchMenu();
      } catch (error) {
        console.error('Error deleting menu item:', error);
        alert('Error deleting menu item');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', category: '', isAvailable: true, image: null, imageUrl: '' });
    setImagePreview(null);
    setUseImageUrl(false);
    setEditingItem(null);
    setShowModal(false);
    setShowNewCategoryInput(false);
    setNewCategory('');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Menu Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition flex items-center gap-2"
        >
          <FiPlus /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menu.map(item => (
          <div key={item._id} className="bg-black/30 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-800 flex items-center justify-center overflow-hidden relative">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    console.error('Image load error:', item.image);
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.image-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    const fallback = e.target.parentElement.querySelector('.image-fallback');
                    if (fallback) fallback.style.display = 'none';
                  }}
                />
              ) : null}
              <div className="text-4xl image-fallback absolute inset-0 flex items-center justify-center" style={{ display: item.image ? 'none' : 'flex' }}>🍽️</div>
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  item.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">{item.category}</p>
              {item.description && (
                <p className="text-gray-300 text-sm mb-3">{item.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-restaurant-gold">
                  ${item.price.toFixed(2)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 hover:bg-black/30 rounded"
                  >
                    <FiEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-restaurant-dark border border-restaurant-gold/20 rounded-lg w-full max-w-md my-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-restaurant-dark z-10">
              <h3 className="text-2xl font-bold">
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <FiX />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="space-y-2">
                  {!showNewCategoryInput ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__new__') {
                            setShowNewCategoryInput(true);
                            setFormData({ ...formData, category: '' });
                          } else {
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        required={!showNewCategoryInput}
                        className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="__new__">+ Add New Category</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        onBlur={() => {
                          if (formData.category && !categories.includes(formData.category)) {
                            setCategories([...categories, formData.category].sort());
                          }
                        }}
                        required
                        className="flex-1 bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                        placeholder="Enter new category name"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          if (!formData.category || categories.includes(formData.category)) {
                            setFormData({ ...formData, category: categories[0] || '' });
                          } else {
                            setCategories([...categories, formData.category].sort());
                          }
                        }}
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        Done
                      </button>
                    </div>
                  )}
                  {formData.category && !showNewCategoryInput && (
                    <p className="text-xs text-gray-400">Selected: {formData.category}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Product Image</label>
                <div className="space-y-2">
                  {imagePreview && (
                    <div className="mb-2">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Toggle between URL and File Upload */}
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUseImageUrl(false);
                        setFormData({ ...formData, imageUrl: '', image: null });
                        setImagePreview(null);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        !useImageUrl
                          ? 'bg-restaurant-gold text-black'
                          : 'bg-black/30 text-gray-400 hover:bg-black/50'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseImageUrl(true);
                        setFormData({ ...formData, image: null });
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        useImageUrl
                          ? 'bg-restaurant-gold text-black'
                          : 'bg-black/30 text-gray-400 hover:bg-black/50'
                      }`}
                    >
                      Use URL
                    </button>
                  </div>

                  {useImageUrl ? (
                    <div>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={handleImageUrlChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">Enter a direct image URL</p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-restaurant-gold file:text-black hover:file:bg-restaurant-warm"
                      />
                      <p className="text-xs text-gray-400 mt-1">Max size: 5MB. Formats: JPG, PNG, GIF</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isAvailable">Available</label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-restaurant-gold text-black px-4 py-2 rounded-lg font-semibold hover:bg-restaurant-warm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : (editingItem ? 'Update' : 'Create')}
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
        </div>
      )}
    </div>
  );
};

export default MenuManagement;

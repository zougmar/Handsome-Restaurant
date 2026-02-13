const express = require('express');
const { body, validationResult } = require('express-validator');
const Menu = require('../models/Menu');
const { verifyToken, checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const router = express.Router();

// @route   GET /api/menu
// @desc    Get all menu items
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category, isAvailable: true } : { isAvailable: true };
    const menu = await Menu.find(query).sort({ category: 1, name: 1 });
    res.json(menu);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Menu.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes below require admin authentication
router.use(verifyToken, checkRole('admin'));

// @route   POST /api/menu
// @desc    Create menu item
// @access  Private (Admin)
router.post('/', upload.single('image'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle both FormData and JSON requests
    const menuData = {
      name: req.body.name || req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      category: req.body.category,
      isAvailable: req.body.isAvailable !== undefined ? (req.body.isAvailable === 'true' || req.body.isAvailable === true) : true
    };
    
    // If image was uploaded, save the path
    if (req.file) {
      menuData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image && req.body.image.trim()) {
      // If image is provided (URL or empty), use it
      menuData.image = req.body.image.trim();
    }

    const menuItem = new Menu(menuData);
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Create menu error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Admin)
router.put('/:id', upload.single('image'), [
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = {
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      category: req.body.category,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true
    };
    
    // If image was uploaded, save the path
    if (req.file) {
      // Delete old image if exists (only if it's a local file)
      const existingItem = await Menu.findById(req.params.id);
      if (existingItem && existingItem.image && !existingItem.image.startsWith('http')) {
        const fs = require('fs');
        const oldImagePath = path.join(__dirname, '..', existingItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      // If image is provided (URL or empty string to remove)
      const existingItem = await Menu.findById(req.params.id);
      if (existingItem && existingItem.image && !existingItem.image.startsWith('http')) {
        // Delete old local image if switching to URL or removing
        const fs = require('fs');
        const oldImagePath = path.join(__dirname, '..', existingItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.image = req.body.image.trim() || '';
    }

    const menuItem = await Menu.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Update menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await Menu.findByIdAndDelete(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

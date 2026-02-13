const express = require('express');
const { body, validationResult } = require('express-validator');
const Table = require('../models/Table');
const { verifyToken, checkRole } = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/tables
// @desc    Get all tables
// @access  Public (for waiter/kitchen display)
router.get('/', async (req, res) => {
  try {
    const tables = await Table.find().populate('currentOrder').sort({ number: 1 });
    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tables/:id
// @desc    Get table by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate('currentOrder');
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes below require admin authentication
router.use(checkRole('admin'));

// @route   POST /api/tables
// @desc    Create new table
// @access  Private (Admin)
router.post('/', [
  body('number').isInt({ min: 1 }).withMessage('Valid table number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Valid capacity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { number, capacity } = req.body;

    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({ message: 'Table number already exists' });
    }

    const table = new Table({ number, capacity });
    await table.save();

    res.status(201).json(table);
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tables/:id
// @desc    Update table
// @access  Private (Admin)
router.put('/:id', [
  body('capacity').optional().isInt({ min: 1 }).withMessage('Valid capacity is required'),
  body('status').optional().isIn(['free', 'occupied', 'awaiting-payment']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('table-updated', { tableNumber: table.number, status: table.status });
    }

    res.json(table);
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete table
// @access  Private (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

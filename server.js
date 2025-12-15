// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authMiddleware = require('./middleware/authMiddleware');
const connectDB = require('./config/db');
const User = require('./models/User');
const Order = require('./models/Order');


const app = express();

// 1) Connect to MongoDB
connectDB();

// 2) Middlewares
app.use(cors());
app.use(express.json());

// 3) Test route – just to check server
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});

// 4) REGISTER  -> POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    return res.status(201).json({
      message: 'Registered successfully',
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 5) LOGIN  -> POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

const token = jwt.sign(
  { id: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);


    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 6) PLACE ORDER  -> POST /api/orders
app.post('/api/orders', authMiddleware, async (req, res) => {
  try {
    const { customerName, email, oilType, quantityLitres, address } = req.body;

    if (!customerName || !email || !oilType || !quantityLitres || !address) {
      return res.status(400).json({ message: 'All order fields are required' });
    }

const order = await Order.create({
  user: req.user.id,        // 🔴 CRITICAL FIX
  customerName,
  email,
  oilType,
  quantityLitres,
  address,
});


    return res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (err) {
    console.error('Order error:', err.message);
    return res.status(500).json({ message: 'Server error while placing order' });
  }
});


// 7) GET ALL ORDERS  -> GET /api/orders
app.get('/api/orders', authMiddleware, async (req, res) => {
  console.log("JWT USER ID:", req.user.id);

  const orders = await Order.find({ user: req.user.id });

  console.log("ORDERS FOUND:", orders.length);

  res.json(orders);
});




// UPDATE ORDER STATUS  -> PUT /api/orders/:id
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      message: "Order status updated",
      order: updatedOrder
    });

  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ message: "Failed to update status" });
  }
});

// DELETE ORDER  -> DELETE /api/orders/:id
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err.message);
    res.status(500).json({ message: "Server error while deleting order" });
  }
});


// 6) Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

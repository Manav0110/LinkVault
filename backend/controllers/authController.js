const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { createToken } = require('../utils/token');

const AUTH_SECRET = process.env.AUTH_SECRET || 'change-this-secret-in-production';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    const token = createToken({ userId: user._id.toString() }, AUTH_SECRET);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = createToken({ userId: user._id.toString() }, AUTH_SECRET);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitizeUser(user),
        token
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message
    });
  }
};

const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: sanitizeUser(req.user)
    }
  });
};

module.exports = {
  register,
  login,
  me
};

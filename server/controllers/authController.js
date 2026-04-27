const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// ─── POST /api/auth/signup ───────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // ── Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // ── Password strength check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters.',
      });
    }

    // ── Duplicate email check
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'This email is already registered.' });
    }

    // ── Create user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'student',
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    next(err);
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact the admin.' });
    }

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
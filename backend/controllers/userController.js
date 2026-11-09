const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Incident = require('../models/Incident');
const { logAudit } = require('../utils/logger');

// @desc    Get all users with search, filter, pagination
// @route   GET /api/users
// @access  Private (Admin, Coordinator)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10, isActive } = req.query;

    const query = {};
    if (role && role !== 'all') {
      query.role = role;
    }
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, studentId, department, isActive } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'ExamPass123!',
      role: role || 'student',
      studentId: studentId || (role === 'student' ? `STU-${Date.now().toString().slice(-4)}` : undefined),
      department: department || 'Computer Science and Engineering',
      isActive: isActive !== undefined ? isActive : true
    });

    await logAudit(req.user._id, 'CREATE_USER', `Admin created user ${user.email} (${user.role})`);

    const result = user.toObject();
    delete result.password;

    res.status(201).json({
      success: true,
      user: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, studentId, department, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (studentId !== undefined) user.studentId = studentId;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) user.password = password;

    await user.save();
    await logAudit(req.user._id, 'UPDATE_USER', `Updated user ${user.email}`);

    const result = user.toObject();
    delete result.password;

    res.status(200).json({ success: true, user: result });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own administrative account.'
      });
    }

    await User.findByIdAndDelete(req.params.id);
    await logAudit(req.user._id, 'DELETE_USER', `Deleted user ${user.email}`);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

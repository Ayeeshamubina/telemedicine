const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const InterpreterProfile = require('../models/InterpreterProfile');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const InterpreterRequest = require('../models/InterpreterRequest');
const { generateToken } = require('../utils/jwt');

// @desc    Admin authentication using secure env configuration
// @route   POST /api/admin/login
// @access  Public (Hidden endpoint)
const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@medibridge.org';
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide administrator credentials'
      });
    }

    if (
      email.toLowerCase().trim() !== envAdminEmail.toLowerCase().trim() ||
      password !== envAdminPassword
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials'
      });
    }

    const token = generateToken('system-admin', 'admin');

    res.json({
      success: true,
      message: 'Admin authorization granted',
      token,
      admin: {
        id: 'system-admin',
        name: 'MEDIBRIDGE System Administrator',
        email: envAdminEmail,
        role: 'admin'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide metrics and stats for Admin Dashboard
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalInterpreters,
      totalAppointments,
      totalConsultations,
      totalInterpreterRequests
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'interpreter' }),
      Appointment.countDocuments(),
      Consultation.countDocuments(),
      InterpreterRequest.countDocuments()
    ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        totalDoctors,
        totalInterpreters,
        totalAppointments,
        totalConsultations,
        totalInterpreterRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list with profiles
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role && ['patient', 'doctor', 'interpreter'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (suspend, activate)
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle doctor verification / approval
// @route   PATCH /api/admin/doctors/:id/approval
// @access  Private (Admin)
const toggleDoctorApproval = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const doctorProfile = await DoctorProfile.findById(req.params.id);

    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    doctorProfile.isApproved = Boolean(isApproved);
    await doctorProfile.save();

    res.json({
      success: true,
      message: `Doctor profile approval set to ${doctorProfile.isApproved}`,
      data: doctorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all appointments system-wide
// @route   GET /api/admin/appointments
// @access  Private (Admin)
const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all consultations system-wide
// @route   GET /api/admin/consultations
// @access  Private (Admin)
const getAllConsultations = async (req, res, next) => {
  try {
    const consultations = await Consultation.find()
      .populate('patient', 'name email')
      .populate('doctor', 'name email')
      .populate('interpreter', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminLogin,
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  toggleDoctorApproval,
  getAllAppointments,
  getAllConsultations
};

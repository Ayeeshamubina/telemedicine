const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const InterpreterProfile = require('../models/InterpreterProfile');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new user (Patient, Doctor, or Interpreter)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      phone,
      preferredLanguage,
      location,
      // Doctor fields
      speciality,
      experience,
      languages,
      clinicHospitalInfo,
      professionalBio,
      consultationFee,
      // Interpreter fields
      supportedLanguages
    } = req.body;

    // Strict validation: Admin cannot register via public registration
    if (!['patient', 'doctor', 'interpreter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration role. Allowed roles are patient, doctor, and interpreter.'
      });
    }

    if (!name || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists'
      });
    }

    // Role specific validation
    if (role === 'doctor') {
      if (!speciality || !clinicHospitalInfo || !location) {
        return res.status(400).json({
          success: false,
          message: 'Doctors must provide speciality, clinic/hospital info, and location'
        });
      }
      if (!languages || (Array.isArray(languages) && languages.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'Please select at least one language you consult in'
        });
      }
    }

    if (role === 'interpreter') {
      if (!supportedLanguages || !Array.isArray(supportedLanguages) || supportedLanguages.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Interpreters must specify at least two supported languages for translation'
        });
      }
    }

    // Create User record
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      phone,
      preferredLanguage: preferredLanguage || 'English',
      location: location || ''
    });

    let profileData = null;

    // Create corresponding profile
    if (role === 'doctor') {
      const languagesArray = Array.isArray(languages) ? languages : [languages];
      const doctorProfile = await DoctorProfile.create({
        user: user._id,
        speciality,
        experience: Number(experience) || 1,
        languages: languagesArray,
        clinicHospitalInfo,
        professionalBio: professionalBio || '',
        location,
        consultationFee: Number(consultationFee) || 500,
        consultationModes: { online: true, inClinic: true }
      });
      profileData = doctorProfile;
    } else if (role === 'interpreter') {
      const interpreterProfile = await InterpreterProfile.create({
        user: user._id,
        supportedLanguages,
        experience: Number(experience) || 1,
        location: location || '',
        bio: professionalBio || ''
      });
      profileData = interpreterProfile;
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        location: user.location
      },
      profile: profileData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and select your account role'
      });
    }

    // Strictly validate that role is one of the 3 public roles
    if (!['patient', 'doctor', 'interpreter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Role verification: Prompt Section 11: "Validate that the selected role matches the user's actual account."
    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Account found, but registered as a ${user.role}. Please select ${user.role} on the login screen.`
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'This account has been suspended. Please contact support.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    let profile = null;
    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    } else if (user.role === 'interpreter') {
      profile = await InterpreterProfile.findOne({ user: user._id });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        location: user.location
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user & profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let profile = null;
    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    } else if (user.role === 'interpreter') {
      profile = await InterpreterProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile / settings
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, preferredLanguage, location } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (location !== undefined) user.location = location;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};

const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');

// @desc    Get all registered doctors with filters
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res, next) => {
  try {
    const { speciality, location, language, mode, search } = req.query;

    let query = { isApproved: true };

    if (speciality && speciality !== 'All') {
      query.speciality = { $regex: new RegExp(speciality, 'i') };
    }

    if (location) {
      query.location = { $regex: new RegExp(location, 'i') };
    }

    if (language && language !== 'All') {
      query.languages = { $in: [new RegExp(language, 'i')] };
    }

    if (mode === 'online') {
      query['consultationModes.online'] = true;
    } else if (mode === 'in-clinic') {
      query['consultationModes.inClinic'] = true;
    }

    let doctorProfiles = await DoctorProfile.find(query)
      .populate('user', 'name email phone location preferredLanguage status')
      .sort({ createdAt: -1 });

    // Filter out inactive/suspended users and apply general text search if provided
    doctorProfiles = doctorProfiles.filter(doc => doc.user && doc.user.status === 'active');

    if (search) {
      const searchLower = search.toLowerCase();
      doctorProfiles = doctorProfiles.filter(doc => {
        const docName = doc.user?.name?.toLowerCase() || '';
        const docSpec = doc.speciality?.toLowerCase() || '';
        const docLoc = doc.location?.toLowerCase() || '';
        const docClinic = doc.clinicHospitalInfo?.toLowerCase() || '';
        return (
          docName.includes(searchLower) ||
          docSpec.includes(searchLower) ||
          docLoc.includes(searchLower) ||
          docClinic.includes(searchLower)
        );
      });
    }

    res.json({
      success: true,
      count: doctorProfiles.length,
      data: doctorProfiles
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res, next) => {
  try {
    const doctorProfile = await DoctorProfile.findById(req.params.id)
      .populate('user', 'name email phone location preferredLanguage');

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.json({
      success: true,
      data: doctorProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor profile (for logged-in doctor)
// @route   PATCH /api/doctors/profile
// @access  Private (Doctor)
const updateDoctorProfile = async (req, res, next) => {
  try {
    const {
      speciality,
      experience,
      languages,
      clinicHospitalInfo,
      professionalBio,
      location,
      consultationFee,
      consultationModes
    } = req.body;

    let profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    if (speciality) profile.speciality = speciality;
    if (experience !== undefined) profile.experience = Number(experience);
    if (languages && Array.isArray(languages)) profile.languages = languages;
    if (clinicHospitalInfo) profile.clinicHospitalInfo = clinicHospitalInfo;
    if (professionalBio !== undefined) profile.professionalBio = professionalBio;
    if (location) profile.location = location;
    if (consultationFee !== undefined) profile.consultationFee = Number(consultationFee);
    if (consultationModes) profile.consultationModes = consultationModes;

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor availability slots
// @route   PATCH /api/doctors/availability
// @access  Private (Doctor)
const updateAvailability = async (req, res, next) => {
  try {
    const { availability, isAvailableNow } = req.body;

    let profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    if (availability && Array.isArray(availability)) {
      profile.availability = availability;
    }

    if (isAvailableNow !== undefined) {
      profile.isAvailableNow = Boolean(isAvailableNow);
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all specialities with available doctor counts
// @route   GET /api/doctors/specialities
// @access  Public
const getSpecialities = async (req, res, next) => {
  try {
    const predefinedSpecialities = [
      'Cardiology',
      'Dermatology',
      'Dentistry',
      'Gynecology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'General Physician',
      'Nutrition'
    ];

    // Count doctors for each speciality from MongoDB
    const counts = await DoctorProfile.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: '$speciality', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(item => {
      countMap[item._id] = item.count;
    });

    const specialitiesWithCounts = predefinedSpecialities.map(name => ({
      name,
      doctorCount: countMap[name] || 0
    }));

    res.json({
      success: true,
      data: specialitiesWithCounts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  updateAvailability,
  getSpecialities
};

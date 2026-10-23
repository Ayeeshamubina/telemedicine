const InterpreterProfile = require('../models/InterpreterProfile');
const InterpreterRequest = require('../models/InterpreterRequest');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

// @desc    Get current interpreter profile
// @route   GET /api/interpreters/profile
// @access  Private (Interpreter)
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await InterpreterProfile.findOne({ user: req.user._id })
      .populate('user', 'name email phone preferredLanguage location');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Interpreter profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interpreter profile (languages, bio, experience)
// @route   PATCH /api/interpreters/profile
// @access  Private (Interpreter)
const updateProfile = async (req, res, next) => {
  try {
    const { supportedLanguages, experience, bio, location } = req.body;
    let profile = await InterpreterProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Interpreter profile not found'
      });
    }

    if (supportedLanguages && Array.isArray(supportedLanguages)) {
      if (supportedLanguages.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'At least two supported languages are required'
        });
      }
      profile.supportedLanguages = supportedLanguages;
    }

    if (experience !== undefined) profile.experience = Number(experience);
    if (bio !== undefined) profile.bio = bio;
    if (location !== undefined) profile.location = location;

    await profile.save();

    res.json({
      success: true,
      message: 'Interpreter profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle interpreter availability (Go Available / Go Offline)
// @route   PATCH /api/interpreters/availability
// @access  Private (Interpreter)
const toggleAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;
    let profile = await InterpreterProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Interpreter profile not found'
      });
    }

    profile.isAvailable = isAvailable !== undefined ? Boolean(isAvailable) : !profile.isAvailable;
    profile.isOnline = profile.isAvailable;
    await profile.save();

    res.json({
      success: true,
      message: `Interpreter is now ${profile.isAvailable ? 'Available' : 'Offline'}`,
      data: {
        isAvailable: profile.isAvailable,
        isOnline: profile.isOnline
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request an interpreter during an active consultation (Section 29)
// @route   POST /api/interpreters/request
// @access  Private (Patient or Doctor)
const requestInterpreter = async (req, res, next) => {
  try {
    const { roomId, patientLanguage, doctorLanguage } = req.body;

    if (!roomId || !patientLanguage || !doctorLanguage) {
      return res.status(400).json({
        success: false,
        message: 'Room ID, patient language, and doctor language are required'
      });
    }

    const consultation = await Consultation.findOne({ roomId });
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Active consultation room not found'
      });
    }

    // Find available registered interpreters supporting BOTH languages (case-insensitive regex)
    const availableInterpreters = await InterpreterProfile.find({
      isAvailable: true,
      supportedLanguages: {
        $all: [
          new RegExp(`^${patientLanguage}$`, 'i'),
          new RegExp(`^${doctorLanguage}$`, 'i')
        ]
      }
    }).populate('user', 'name email phone status');

    const activeInterpreters = availableInterpreters.filter(
      item => item.user && item.user.status === 'active'
    );

    if (activeInterpreters.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No available interpreters currently supporting ${patientLanguage} and ${doctorLanguage}.`
      });
    }

    // Create interpreter request
    const request = await InterpreterRequest.create({
      roomId,
      consultation: consultation._id,
      requestedBy: req.user._id,
      patient: consultation.patient,
      doctor: consultation.doctor,
      patientLanguage,
      doctorLanguage,
      status: 'pending'
    });

    const populatedRequest = await InterpreterRequest.findById(request._id)
      .populate('patient', 'name email preferredLanguage')
      .populate('doctor', 'name email')
      .populate('requestedBy', 'name role');

    res.status(201).json({
      success: true,
      message: 'Interpreter request dispatched to available interpreters',
      data: populatedRequest,
      matchedCount: activeInterpreters.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending interpreter requests matching this interpreter's languages
// @route   GET /api/interpreters/requests/pending
// @access  Private (Interpreter)
const getPendingRequests = async (req, res, next) => {
  try {
    const profile = await InterpreterProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // If offline, return empty list
    if (!profile.isAvailable) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Find pending requests where interpreter has NOT rejected
    const requests = await InterpreterRequest.find({
      status: 'pending',
      rejectedBy: { $ne: req.user._id }
    })
      .populate('patient', 'name preferredLanguage')
      .populate('doctor', 'name')
      .populate('requestedBy', 'name role')
      .sort({ createdAt: -1 });

    // Filter requests matching interpreter's supportedLanguages
    const myLangsLower = profile.supportedLanguages.map(l => l.toLowerCase());
    const matchedRequests = requests.filter(reqItem => {
      const patientLangMatch = myLangsLower.includes(reqItem.patientLanguage.toLowerCase());
      const doctorLangMatch = myLangsLower.includes(reqItem.doctorLanguage.toLowerCase());
      return patientLangMatch && doctorLangMatch;
    });

    res.json({
      success: true,
      count: matchedRequests.length,
      data: matchedRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Respond to an interpreter request (Accept or Reject)
// @route   PATCH /api/interpreters/requests/:id/respond
// @access  Private (Interpreter)
const respondToRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const request = await InterpreterRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Interpreter request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}`
      });
    }

    if (action === 'reject') {
      request.rejectedBy.push(req.user._id);
      await request.save();

      return res.json({
        success: true,
        message: 'Request declined'
      });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      request.assignedInterpreter = req.user._id;
      await request.save();

      // Attach interpreter to Consultation
      const consultation = await Consultation.findById(request.consultation);
      if (consultation) {
        consultation.interpreter = req.user._id;
        await consultation.save();
      }

      // Update interpreter profile active session
      await InterpreterProfile.findOneAndUpdate(
        { user: req.user._id },
        {
          activeConsultationId: request.consultation,
          $inc: { completedSessions: 1 }
        }
      );

      return res.json({
        success: true,
        message: 'Request accepted. You can now join the consultation.',
        data: {
          requestId: request._id,
          roomId: request.roomId,
          consultationId: request.consultation
        }
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateProfile,
  toggleAvailability,
  requestInterpreter,
  getPendingRequests,
  respondToRequest
};

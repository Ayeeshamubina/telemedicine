const Consultation = require('../models/Consultation');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// @desc    Start an instant online consultation with an available doctor
// @route   POST /api/consultations/instant
// @access  Private (Patient)
const startInstantConsultation = async (req, res, next) => {
  try {
    const { doctorId, patientLanguage } = req.body;

    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ _id: doctorId }, { user: doctorId }]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found or not available'
      });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let resolvedPatientLang = patientLanguage || req.user.preferredLanguage || 'Tamil';
    let resolvedDoctorLang = (doctorProfile.languages && doctorProfile.languages[0]) || 'English';
    if (resolvedPatientLang.toLowerCase() === resolvedDoctorLang.toLowerCase()) {
      resolvedPatientLang = 'Tamil';
      resolvedDoctorLang = 'English';
    }

    const consultation = await Consultation.create({
      roomId,
      patient: req.user._id,
      doctor: doctorProfile.user,
      patientLanguage: resolvedPatientLang,
      doctorLanguage: resolvedDoctorLang,
      status: 'waiting',
      startedAt: new Date()
    });

    const populated = await Consultation.findById(consultation._id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Consultation session initiated',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get consultation by roomId
// @route   GET /api/consultations/room/:roomId
// @access  Private
const getConsultationByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    let consultation = await Consultation.findOne({ roomId })
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('interpreter', 'name email phone')
      .populate('appointment');

    if (!consultation) {
      // If room is from an appointment that wasn't converted to consultation yet:
      const appointment = await Appointment.findOne({ consultationRoomId: roomId })
        .populate('patient', 'name email phone preferredLanguage')
        .populate('doctor', 'name email phone')
        .populate('doctorProfile');

      if (appointment) {
        let appPatientLang = appointment.patientLanguage || appointment.patient?.preferredLanguage || 'Tamil';
        let appDocLang = (appointment.doctorProfile?.languages && appointment.doctorProfile.languages[0]) || 'English';
        if (appPatientLang.toLowerCase() === appDocLang.toLowerCase()) {
          appPatientLang = 'Tamil';
          appDocLang = 'English';
        }

        consultation = await Consultation.create({
          roomId,
          appointment: appointment._id,
          patient: appointment.patient._id,
          doctor: appointment.doctor._id,
          patientLanguage: appPatientLang,
          doctorLanguage: appDocLang,
          status: 'waiting',
          startedAt: new Date()
        });

        consultation = await Consultation.findById(consultation._id)
          .populate('patient', 'name email phone preferredLanguage')
          .populate('doctor', 'name email phone')
          .populate('appointment');
      }
    }

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation session not found'
      });
    }

    // Role verification
    const userIdStr = req.user._id.toString();
    const isPatient = consultation.patient?._id?.toString() === userIdStr;
    const isDoctor = consultation.doctor?._id?.toString() === userIdStr;
    const isInterpreter = consultation.interpreter?._id?.toString() === userIdStr;
    const isAvailableInterpreter = req.user.role === 'interpreter'; // Can inspect room to decide on joining
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isInterpreter && !isAvailableInterpreter && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this consultation room'
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update consultation status (e.g. End Call)
// @route   PATCH /api/consultations/:id/status
// @access  Private
const updateConsultationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (status === 'completed') {
      const isDoctor = consultation.doctor?.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      
      if (isDoctor || isAdmin) {
        consultation.status = 'completed';
        consultation.endedAt = new Date();

        // If associated with an appointment, mark appointment completed
        if (consultation.appointment) {
          await Appointment.findByIdAndUpdate(consultation.appointment, { status: 'completed' });
          try {
            const { getIO } = require('../services/socketService');
            const io = getIO();
            if (io) {
              io.emit('appointment_list_changed', { appointmentId: consultation.appointment });
            }
          } catch (e) {}
        }
      }
    } else if (status) {
      consultation.status = status;
    }

    await consultation.save();

    res.json({
      success: true,
      message: `Consultation updated`,
      data: consultation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user consultation history
// @route   GET /api/consultations/history
// @access  Private
const getConsultationHistory = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'interpreter') {
      query.interpreter = req.user._id;
    }

    const consultations = await Consultation.find(query)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('interpreter', 'name email phone')
      .populate('prescription')
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
  startInstantConsultation,
  getConsultationByRoom,
  updateConsultationStatus,
  getConsultationHistory
};

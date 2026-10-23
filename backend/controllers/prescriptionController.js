const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Create a digital prescription (Section 33)
// @route   POST /api/prescriptions
// @access  Private (Doctor)
const createPrescription = async (req, res, next) => {
  try {
    const {
      patientId,
      consultationId,
      appointmentId,
      diagnosis,
      clinicalNotes,
      medicines,
      instructions,
      followUpDate
    } = req.body;

    if (!patientId || !diagnosis || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide patient ID, diagnosis, and at least one prescribed medicine'
      });
    }

    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });

    const prescription = await Prescription.create({
      patient: patientId,
      doctor: req.user._id,
      doctorProfile: doctorProfile ? doctorProfile._id : null,
      consultation: consultationId || null,
      appointment: appointmentId || null,
      diagnosis,
      clinicalNotes: clinicalNotes || '',
      medicines,
      instructions: instructions || '',
      followUpDate: followUpDate || ''
    });

    if (consultationId) {
      await Consultation.findByIdAndUpdate(consultationId, {
        prescription: prescription._id
      });
    }

    const populated = await Prescription.findById(prescription._id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile');

    res.status(201).json({
      success: true,
      message: 'Digital prescription created successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get prescriptions for current user (Patient sees theirs, Doctor sees authored)
// @route   GET /api/prescriptions
// @access  Private
const getMyPrescriptions = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin sees all
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const prescriptions = await Prescription.find(query)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Privacy & Security (Section 33 & 35: "Do not expose another patient's medical information.")
    const isPatient = prescription.patient._id.toString() === req.user._id.toString();
    const isDoctor = prescription.doctor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to view this medical record'
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById
};

const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const { getIO } = require('../services/socketService');

// @desc    Book an appointment (In-clinic or Online)
// @route   POST /api/appointments
// @access  Private (Patient)
const createAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      type,
      date,
      timeSlot,
      speciality,
      reason,
      patientLanguage
    } = req.body;

    if (!doctorId || !type || !date || !timeSlot || !timeSlot.start || !timeSlot.end) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required appointment details (doctor, type, date, time slot)'
      });
    }

    // Find doctor and doctor profile
    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ _id: doctorId }, { user: doctorId }]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor is no longer available or profile not found'
      });
    }

    const doctorUserId = doctorProfile.user;

    // Check conflict: Slot double-booking prevention (Section 32)
    const existingAppointment = await Appointment.findOne({
      doctor: doctorUserId,
      date,
      'timeSlot.start': timeSlot.start,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Appointment slot already booked. Please select another time slot.'
      });
    }

    // Generate room ID if online consultation
    let consultationRoomId = null;
    if (type === 'online') {
      consultationRoomId = `mbr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorUserId,
      doctorProfile: doctorProfile._id,
      type,
      date,
      timeSlot,
      speciality: speciality || doctorProfile.speciality,
      reason: reason || 'General Consultation',
      patientLanguage: patientLanguage || req.user.preferredLanguage || 'Tamil',
      status: 'confirmed',
      consultationRoomId
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile');

    // Notify connected doctor and patient in real-time via Socket.IO
    try {
      const io = getIO();
      if (io) {
        const docIdStr = doctorUserId ? doctorUserId.toString() : '';
        const patientIdStr = req.user._id ? req.user._id.toString() : '';

        // 1. Direct targeted user notifications
        if (docIdStr) {
          io.to(`user_${docIdStr}`).emit('new_appointment', populatedAppointment);
        }
        if (patientIdStr) {
          io.to(`user_${patientIdStr}`).emit('new_appointment', populatedAppointment);
        }

        // 2. Broadcast to all active dashboards for zero-latency instant synchronization
        io.emit('new_appointment', populatedAppointment);
        io.emit('appointment_list_changed', {
          appointmentId: populatedAppointment._id,
          doctorId: docIdStr,
          patientId: patientIdStr,
          appointment: populatedAppointment
        });
      }
    } catch (socketErr) {
      console.warn('[Socket Notification Warning]', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointments for the logged-in user (patient or doctor)
// @route   GET /api/appointments
// @access  Private
const getMyAppointments = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin can view all
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile')
      .sort({ date: 1, 'timeSlot.start': 1 });

    res.json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Role security check
    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (Confirm, Cancel, Complete)
// @route   PATCH /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const isDoctor = appointment.doctor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this appointment'
      });
    }

    // Patients can only cancel their appointments
    if (isPatient && !isDoctor && !isAdmin && status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Patients may only cancel their appointments'
      });
    }

    if (status) {
      appointment.status = status;
    }
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }

    await appointment.save();

    const updated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone preferredLanguage')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile');

    // Notify connected doctor and patient in real-time via Socket.IO
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${appointment.doctor}`).emit('appointment_updated', updated);
        io.to(`user_${appointment.patient}`).emit('appointment_updated', updated);
        io.emit('appointment_list_changed', {
          appointmentId: updated._id,
          doctorId: appointment.doctor,
          patientId: appointment.patient
        });
      }
    } catch (socketErr) {
      console.warn('[Socket Notification Warning]', socketErr.message);
    }

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked slots for a doctor on a specific date (to disable in slot picker)
// @route   GET /api/appointments/booked-slots
// @access  Public
const getBookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date are required'
      });
    }

    // Resolve doctor user ID
    let doctorUserId = doctorId;
    const profile = await DoctorProfile.findOne({
      $or: [{ _id: doctorId }, { user: doctorId }]
    });
    if (profile) {
      doctorUserId = profile.user;
    }

    const appointments = await Appointment.find({
      doctor: doctorUserId,
      date,
      status: { $in: ['pending', 'confirmed'] }
    }).select('timeSlot');

    const bookedStarts = appointments.map(a => a.timeSlot.start);

    res.json({
      success: true,
      data: bookedStarts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getBookedSlots
};

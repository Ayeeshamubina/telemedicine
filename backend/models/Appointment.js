const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    doctorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true
    },
    type: {
      type: String,
      enum: ['in-clinic', 'online'],
      required: true
    },
    date: {
      type: String, // Store as YYYY-MM-DD for straightforward timezone-safe slot comparison
      required: true
    },
    timeSlot: {
      start: { type: String, required: true },
      end: { type: String, required: true }
    },
    speciality: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      trim: true,
      default: 'General Consultation'
    },
    patientLanguage: {
      type: String,
      default: 'English'
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed' // Or 'pending' if doctor approval is configured
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    consultationRoomId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent double-booking for the same doctor on same date and start time
appointmentSchema.index(
  { doctor: 1, date: 1, 'timeSlot.start': 1, status: 1 }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
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
    interpreter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    patientLanguage: {
      type: String,
      default: 'English'
    },
    doctorLanguage: {
      type: String,
      default: 'English'
    },
    status: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'cancelled'],
      default: 'waiting'
    },
    startedAt: {
      type: Date,
      default: null
    },
    endedAt: {
      type: Date,
      default: null
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Consultation', consultationSchema);

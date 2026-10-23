const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Medicine name is required'], trim: true },
    dosage: { type: String, required: [true, 'Dosage is required (e.g. 500mg)'], trim: true },
    frequency: { type: String, required: [true, 'Frequency is required (e.g. Twice daily after meals)'], trim: true },
    duration: { type: String, required: [true, 'Duration is required (e.g. 5 days)'], trim: true }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
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
      ref: 'DoctorProfile'
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation'
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    diagnosis: {
      type: String,
      required: [true, 'Clinical diagnosis is required'],
      trim: true
    },
    clinicalNotes: {
      type: String,
      default: '',
      trim: true
    },
    medicines: {
      type: [medicineSchema],
      required: true,
      validate: [v => Array.isArray(v) && v.length > 0, 'Please add at least one prescribed medicine']
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    },
    followUpDate: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Prescription', prescriptionSchema);

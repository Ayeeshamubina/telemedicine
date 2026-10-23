const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // e.g. "09:00"
    end: { type: String, required: true },   // e.g. "09:30"
    mode: { type: String, enum: ['online', 'in-clinic', 'both'], default: 'both' }
  },
  { _id: false }
);

const dayAvailabilitySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    enabled: { type: Boolean, default: true },
    slots: [slotSchema]
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    speciality: {
      type: String,
      required: [true, 'Please provide doctor speciality'],
      trim: true,
      enum: [
        'Cardiology',
        'Dermatology',
        'Dentistry',
        'Gynecology',
        'Neurology',
        'Orthopedics',
        'Pediatrics',
        'General Physician',
        'Nutrition'
      ]
    },
    experience: {
      type: Number,
      required: [true, 'Please enter years of professional experience'],
      min: [0, 'Experience cannot be negative']
    },
    languages: {
      type: [String],
      required: [true, 'Please specify at least one spoken language'],
      validate: [v => Array.isArray(v) && v.length > 0, 'At least one language must be specified']
    },
    clinicHospitalInfo: {
      type: String,
      required: [true, 'Please provide clinic or hospital affiliation info'],
      trim: true
    },
    professionalBio: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Please enter clinic or practice location'],
      trim: true
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0
    },
    consultationModes: {
      online: { type: Boolean, default: true },
      inClinic: { type: Boolean, default: true }
    },
    availability: {
      type: [dayAvailabilitySchema],
      default: () => [
        {
          day: 'Monday',
          enabled: true,
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Tuesday',
          enabled: true,
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Wednesday',
          enabled: true,
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Thursday',
          enabled: true,
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Friday',
          enabled: true,
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Saturday',
          enabled: true,
          slots: [
            { start: '10:00', end: '12:00', mode: 'both' },
            { start: '14:00', end: '16:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        },
        {
          day: 'Sunday',
          enabled: false,
          slots: []
        }
      ]
    },
    isAvailableNow: {
      type: Boolean,
      default: true
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    rating: {
      type: Number,
      default: 5.0
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for discovery
doctorProfileSchema.index({ speciality: 1, location: 1 });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);

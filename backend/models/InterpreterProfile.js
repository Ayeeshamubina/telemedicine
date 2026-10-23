const mongoose = require('mongoose');

const interpreterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    supportedLanguages: {
      type: [String],
      required: [true, 'Please specify supported languages'],
      validate: [v => Array.isArray(v) && v.length >= 2, 'Interpreters must support at least two languages to facilitate bridge translation']
    },
    experience: {
      type: Number,
      required: [true, 'Please specify years of interpretation experience'],
      min: 0
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    bio: {
      type: String,
      default: '',
      trim: true
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: false
    },
    activeConsultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      default: null
    },
    completedSessions: {
      type: Number,
      default: 0
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

interpreterProfileSchema.index({ supportedLanguages: 1, isAvailable: 1 });

module.exports = mongoose.model('InterpreterProfile', interpreterProfileSchema);

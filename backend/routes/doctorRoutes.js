const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  updateDoctorProfile,
  updateAvailability,
  getSpecialities
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/specialities', getSpecialities);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.patch('/profile', protect, authorize('doctor'), updateDoctorProfile);
router.patch('/availability', protect, authorize('doctor'), updateAvailability);

module.exports = router;

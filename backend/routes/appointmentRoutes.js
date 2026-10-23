const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getBookedSlots
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/booked-slots', getBookedSlots);
router.post('/', protect, createAppointment);
router.get('/', protect, getMyAppointments);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, updateAppointmentStatus);

module.exports = router;

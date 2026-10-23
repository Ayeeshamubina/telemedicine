const express = require('express');
const router = express.Router();
const {
  adminLogin,
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  toggleDoctorApproval,
  getAllAppointments,
  getAllConsultations
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public admin login
router.post('/login', adminLogin);

// Protected admin endpoints
router.get('/stats', protect, authorize('admin'), getAdminStats);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.patch('/users/:id/status', protect, authorize('admin'), updateUserStatus);
router.patch('/doctors/:id/approval', protect, authorize('admin'), toggleDoctorApproval);
router.get('/appointments', protect, authorize('admin'), getAllAppointments);
router.get('/consultations', protect, authorize('admin'), getAllConsultations);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateProfile,
  toggleAvailability,
  requestInterpreter,
  getPendingRequests,
  respondToRequest
} = require('../controllers/interpreterController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/profile', protect, authorize('interpreter'), getMyProfile);
router.patch('/profile', protect, authorize('interpreter'), updateProfile);
router.patch('/availability', protect, authorize('interpreter'), toggleAvailability);
router.post('/request', protect, requestInterpreter);
router.get('/requests/pending', protect, authorize('interpreter'), getPendingRequests);
router.patch('/requests/:id/respond', protect, authorize('interpreter'), respondToRequest);

module.exports = router;

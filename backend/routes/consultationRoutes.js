const express = require('express');
const router = express.Router();
const {
  startInstantConsultation,
  getConsultationByRoom,
  updateConsultationStatus,
  getConsultationHistory
} = require('../controllers/consultationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/instant', protect, startInstantConsultation);
router.get('/room/:roomId', protect, getConsultationByRoom);
router.patch('/:id/status', protect, updateConsultationStatus);
router.get('/history', protect, getConsultationHistory);

module.exports = router;

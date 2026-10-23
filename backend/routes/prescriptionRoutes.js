const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getMyPrescriptions,
  getPrescriptionById
} = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/', protect, getMyPrescriptions);
router.get('/:id', protect, getPrescriptionById);

module.exports = router;

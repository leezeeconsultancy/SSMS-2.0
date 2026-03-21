import express from 'express';
import { createHoliday, getHolidays, deleteHoliday } from '../controllers/holidayController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/')
  .post(protect, authorize('Admin', 'Super Admin'), createHoliday)
  .get(protect, getHolidays);

router.delete('/:id', protect, authorize('Admin', 'Super Admin'), deleteHoliday);

export default router;

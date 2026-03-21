import express from 'express';
import { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus } from '../controllers/leaveController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/apply', protect, applyLeave);
router.get('/me', protect, getMyLeaves);
router.get('/', protect, authorize('Admin', 'Super Admin', 'Manager'), getAllLeaves);
router.put('/:id/status', protect, authorize('Admin', 'Super Admin', 'Manager'), updateLeaveStatus);

export default router;

import express from 'express';
import { getLeaderboard, getAbsenceAnalytics } from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/leaderboard', protect, authorize('Admin', 'Super Admin', 'Manager'), getLeaderboard);
router.get('/absences', protect, authorize('Admin', 'Super Admin', 'Manager'), getAbsenceAnalytics);

export default router;

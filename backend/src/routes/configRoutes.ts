import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware';
import { getConfig, updateConfig } from '../controllers/configController';

const router = express.Router();

router.get('/', protect, getConfig);
router.put('/', protect, authorize('Admin', 'Super Admin'), updateConfig);

export default router;

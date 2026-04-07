import express from 'express';
import { getDepartments, createDepartment, deleteDepartment } from '../controllers/departmentController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// GET all departments - Protected (Employee needs it too)
router.get('/', protect, getDepartments);

// Admin only routes
router.post('/', protect, authorize('Admin'), createDepartment);
router.delete('/:id', protect, authorize('Admin'), deleteDepartment);

export default router;

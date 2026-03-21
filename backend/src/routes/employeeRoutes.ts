import express from 'express';
import { createEmployee, getEmployees, getEmployeeById, updateEmployee, getMyProfile, deleteEmployee } from '../controllers/employeeController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Employee: Get own profile
router.get('/me', protect, getMyProfile);

// Admin: Manage employees
router.route('/')
  .post(protect, authorize('Admin', 'Super Admin'), createEmployee)
  .get(protect, authorize('Admin', 'Manager', 'Super Admin'), getEmployees);

router.route('/:id')
  .get(protect, getEmployeeById)
  .put(protect, authorize('Admin', 'Super Admin'), updateEmployee)
  .delete(protect, authorize('Admin', 'Super Admin'), deleteEmployee);

export default router;

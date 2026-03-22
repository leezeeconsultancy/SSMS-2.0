import express from 'express';
import { createSalaryRule, getSalaryRules, calculateSalary, getMyPayslip, deleteSalaryRule, toggleSalaryRule } from '../controllers/payrollController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Admin: Manage salary rules
router.post('/rules', protect, authorize('Admin', 'Super Admin'), createSalaryRule);
router.get('/rules', protect, authorize('Admin', 'Super Admin'), getSalaryRules);
router.patch('/rules/:id/toggle', protect, authorize('Admin', 'Super Admin'), toggleSalaryRule);
router.delete('/rules/:id', protect, authorize('Admin', 'Super Admin'), deleteSalaryRule);

// Admin: Calculate salary for any employee
router.get('/calculate', protect, authorize('Admin', 'Super Admin'), calculateSalary);

// Employee: View own payslip
router.get('/my-payslip', protect, getMyPayslip);

export default router;

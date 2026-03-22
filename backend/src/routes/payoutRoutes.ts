import express from 'express';
import { savePayout, getEmployeePayouts, getMyPayouts, deletePayout, getAllPayouts, getMonthlyPayoutSummary } from '../controllers/payoutController';
import { getPayrollCycles, completeCycle } from '../controllers/payrollCycleController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Admin: Manage cyclic logs
router.get('/cycles', protect, authorize('Admin', 'Super Admin'), getPayrollCycles);
router.post('/cycles/complete', protect, authorize('Admin', 'Super Admin'), completeCycle);
router.get('/summary/:month/:year', protect, authorize('Admin', 'Super Admin'), getMonthlyPayoutSummary);

// Admin: Save/Edit Payout for any employee
router.post('/', protect, authorize('Admin', 'Super Admin'), savePayout);

// Admin: Get all payouts (global view with optional filters)
router.get('/all', protect, authorize('Admin', 'Super Admin'), getAllPayouts);

// Employee: View my payout history
router.get('/my/history', protect, getMyPayouts);

// Admin: Get payout history for an employee
router.get('/:employeeId', protect, authorize('Admin', 'Super Admin'), getEmployeePayouts);

// Admin: Delete a payout (non-Paid only)
router.delete('/:id', protect, authorize('Admin', 'Super Admin'), deletePayout);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Payout } from '../models/Payout';
import { Employee } from '../models/Employee';
import mongoose from 'mongoose';

// Admin: Create or Update Payout
export const savePayout = async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, month, year, baseSalary, bonus, deductions, netSalary, holdAmount, payoutDate, remarks, status } = req.body;

    if (netSalary < 0) {
      return res.status(400).json({ message: 'Net salary cannot be negative' });
    }

    const query = { employeeId, month, year };
    const update = {
      baseSalary,
      bonus,
      deductions,
      netSalary,
      holdAmount: holdAmount || 0,
      payoutDate,
      remarks,
      status: status || 'Paid'
    };

    const payout = await Payout.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      runValidators: true
    });

    return res.status(200).json(payout);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// Admin: Get Payout History for an Employee
export const getEmployeePayouts = async (req: AuthRequest, res: Response) => {
  try {
    const payouts = await Payout.find({ employeeId: req.params.employeeId }).sort({ year: -1, month: -1 });
    return res.json(payouts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// Employee: Get My Payouts
export const getMyPayouts = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const payouts = await Payout.find({ employeeId: employee._id }).sort({ year: -1, month: -1 });
    return res.json(payouts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// Admin: Delete a payout (only non-Paid records)
export const deletePayout = async (req: AuthRequest, res: Response) => {
  try {
    const payout = await Payout.findById(req.params.id);
    if (!payout) return res.status(404).json({ message: 'Payout not found' });

    if (payout.status === 'Paid') {
      return res.status(400).json({ message: 'Cannot delete a confirmed Paid payout. Change status first.' });
    }

    await Payout.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Payout deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// Admin: Get all payouts (global view, optional month/year filter)
export const getAllPayouts = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    const filter: any = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const payouts = await Payout.find(filter)
      .populate('employeeId', 'name department employeeId')
      .sort({ year: -1, month: -1, createdAt: -1 });
    return res.json(payouts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};
// Admin: Get summary of all employees' payout status for a specific month
export const getMonthlyPayoutSummary = async (req: AuthRequest, res: Response) => {
  try {
    const month = Number(req.params.month);
    const year = Number(req.params.year);

    const employees = await Employee.find({ status: { $ne: 'Terminated' } })
      .select('name employeeId department salary');
    
    const payouts = await Payout.find({ month, year });

    const summary = employees.map(emp => {
      const payout = payouts.find(p => p.employeeId.toString() === emp._id.toString());
      return {
        _id: emp._id,
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        salary: emp.salary,
        status: payout ? payout.status : 'Pending', // Pending if no record yet
        netSalary: payout ? payout.netSalary : 0,
        payoutDate: payout ? payout.payoutDate : null,
        holdAmount: payout ? payout.holdAmount : 0
      };
    });

    return res.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

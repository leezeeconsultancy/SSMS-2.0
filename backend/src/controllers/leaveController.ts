import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Leave, ILeave } from '../models/Leave';
import { Employee } from '../models/Employee';
import { SystemConfig } from '../models/SystemConfig';
import { getISTStartOfDay } from '../utils/dateUtils';

export const applyLeave = async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, leaveType, reason } = req.body;
  const userId = req.user!._id;

  try {
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Validation: endDate must be >= startDate
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date cannot be before start date' });
    }

    // Validation: No past date leave (configurable)
    const config = await SystemConfig.findOne() || await SystemConfig.create({});
    if (!config.allowPastDateLeave) {
      const today = getISTStartOfDay();
      if (new Date(startDate) < today) {
        return res.status(400).json({ message: 'Cannot apply leave for past dates' });
      }
    }

    // Calculate requested days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance
    if (employee.leaveBalance < requestedDays) {
      return res.status(400).json({ 
        message: `Insufficient leave balance. You have ${employee.leaveBalance} days remaining but requested ${requestedDays} days.` 
      });
    }

    const leave = await Leave.create({
      employeeId: employee._id,
      startDate,
      endDate,
      leaveType,
      reason,
      status: 'Pending',
    });

    return res.status(201).json(leave);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const getMyLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const leaves = await Leave.find({ employeeId: employee._id }).sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const getAllLeaves = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await Leave.find({}).populate('employeeId', 'name department').sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    // If approving, deduct leave balance
    if (status === 'Approved' && leave.status !== 'Approved') {
      const employee = await Employee.findById(leave.employeeId);
      if (employee) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (employee.leaveBalance < leaveDays) {
          return res.status(400).json({ 
            message: `Employee only has ${employee.leaveBalance} days of leave balance. Cannot approve ${leaveDays} days.` 
          });
        }

        employee.leaveBalance -= leaveDays;
        await employee.save();
      }
    }

    // If rejecting a previously approved leave, restore balance
    if (status === 'Rejected' && leave.status === 'Approved') {
      const employee = await Employee.findById(leave.employeeId);
      if (employee) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        employee.leaveBalance += leaveDays;
        await employee.save();
      }
    }

    leave.status = status;
    leave.approvedBy = req.user!._id;
    await leave.save();

    return res.json(leave);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

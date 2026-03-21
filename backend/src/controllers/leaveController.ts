import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Leave, ILeave } from '../models/Leave';
import { Employee } from '../models/Employee';

export const applyLeave = async (req: AuthRequest, res: Response) => {
  const { startDate, endDate, leaveType, reason } = req.body;
  const userId = req.user!._id;

  try {
    const employee = await Employee.findOne({ userId });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

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

    leave.status = status;
    leave.approvedBy = req.user!._id;
    await leave.save();

    return res.json(leave);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

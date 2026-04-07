import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { Payout } from '../models/Payout';

export const createEmployee = async (req: AuthRequest, res: Response) => {
  const { employeeId, name, phone, email, department, designation, salary, joiningDate, role, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'ssms1234', salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Employee',
    });

    const employee = await Employee.create({
      userId: user._id,
      employeeId,
      name,
      phone,
      email,
      department,
      designation,
      salary,
      joiningDate,
      defaultPayoutDay: req.body.defaultPayoutDay || 1,
    });

    return res.status(201).json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};


export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find({}).populate('userId', 'role status');
    
    // Data-driven insight: Check payout status for current month
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const currentPayouts = await Payout.find({
      month: currentMonth,
      year: currentYear
    });

    const employeesWithStatus = employees.map(emp => {
      const payout = currentPayouts.find(p => p.employeeId.toString() === emp._id.toString());
      return {
        ...emp.toObject(),
        payrollStatus: payout ? payout.status : 'Pending'
      };
    });

    return res.json(employeesWithStatus);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('userId', 'role status');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  const { password, role, status, ...employeeData } = req.body;
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If password is provided, update the User model
    if (password && employee.userId) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.findByIdAndUpdate(employee.userId, { password: hashedPassword });
    }

    // Update User role or status if provided
    if ((role || status) && employee.userId) {
      const userUpdate: any = {};
      if (role) userUpdate.role = role;
      if (status) userUpdate.status = status;
      await User.findByIdAndUpdate(employee.userId, userUpdate);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      employeeData,
      { new: true }
    ).populate('userId', 'role status');

    return res.json(updatedEmployee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id }).populate('userId', 'role status email');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    return res.json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }
    await Employee.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};


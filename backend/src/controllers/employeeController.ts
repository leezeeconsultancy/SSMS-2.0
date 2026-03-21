import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee } from '../models/Employee';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

export const createEmployee = async (req: AuthRequest, res: Response) => {
  const { employeeId, name, phone, email, department, designation, salary, joiningDate, role, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // 1. Create Login Credentials (User)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'ssms1234', salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Employee',
    });

    // 2. Create Employee Profile
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
    });

    res.status(201).json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find({}).populate('userId', 'role status');
    res.json(employees);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

export const getEmployeeById = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('userId', 'role status');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedEmployee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id }).populate('userId', 'role status email');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
    res.json(employee);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Delete the linked User account too
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }
    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: errorMessage });
  }
};


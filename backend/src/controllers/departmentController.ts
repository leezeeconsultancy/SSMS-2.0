import { Request, Response } from 'express';
import { Department } from '../models/Department';
import { AuthRequest } from '../middleware/authMiddleware';

// GET all departments
export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    return res.json(departments);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// POST new department
export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description } = req.body;
    const existing = await Department.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Department already exists' });

    const dept = await Department.create({ name, code, description });
    return res.status(201).json(dept);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// DELETE department (soft delete by setting isActive to false)
export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Department.findByIdAndUpdate(id, { isActive: false });
    return res.json({ message: 'Department deactivated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

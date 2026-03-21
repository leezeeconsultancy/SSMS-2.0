import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Holiday } from '../models/Holiday';

export const createHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const holiday = await Holiday.create(req.body);
    return res.status(201).json(holiday);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const holidays = await Holiday.find({}).sort({ date: 1 });
    return res.json(holidays);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) return res.status(404).json({ message: 'Holiday not found' });
    return res.json({ message: 'Holiday deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SystemConfig } from '../models/SystemConfig';

// GET /api/config — Public (needed by frontend for display)
export const getConfig = async (req: AuthRequest, res: Response) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({});
    }
    return res.json(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// PUT /api/config — Admin only
export const updateConfig = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;

    // Validate ranges
    if (updates.lateThresholdHour !== undefined && (updates.lateThresholdHour < 0 || updates.lateThresholdHour > 23)) {
      return res.status(400).json({ message: 'Late threshold hour must be 0-23' });
    }
    if (updates.lateThresholdMinute !== undefined && (updates.lateThresholdMinute < 0 || updates.lateThresholdMinute > 59)) {
      return res.status(400).json({ message: 'Late threshold minute must be 0-59' });
    }
    if (updates.overtimeMultiplier !== undefined && updates.overtimeMultiplier <= 0) {
      return res.status(400).json({ message: 'Overtime multiplier must be positive' });
    }
    if (updates.workingDaysPerMonth !== undefined && (updates.workingDaysPerMonth < 20 || updates.workingDaysPerMonth > 31)) {
      return res.status(400).json({ message: 'Working days per month must be 20-31' });
    }
    if (updates.defaultLeaveBalance !== undefined && updates.defaultLeaveBalance < 0) {
      return res.status(400).json({ message: 'Leave balance cannot be negative' });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create(updates);
    } else {
      Object.assign(config, updates);
      await config.save();
    }

    return res.json({ message: 'Configuration updated successfully', config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

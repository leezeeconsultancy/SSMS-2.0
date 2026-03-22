import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

import fs from 'fs';

const logDebug = (data: any) => {
  const logPath = 'c:\\Users\\OM\\.gemini\\antigravity\\playground\\galactic-lagoon\\backend\\login_debug.log';
  try {
    const timestamp = new Date().toISOString();
    const content = `${timestamp}: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(logPath, content);
  } catch (e) {}
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password, deviceId } = req.body;
  logDebug({ email, deviceId, passwordLength: password?.length });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    logDebug({ foundUser: !!user });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'Suspended') {
        return res.status(401).json({ message: 'Account suspended' });
      }

      // ─── DEVICE BINDING LOGIC ───
      if (user.role === 'Employee') {
        if (!deviceId) {
          return res.status(400).json({ message: 'Device identification required' });
        }

        if (!user.authorizedDeviceId) {
          user.authorizedDeviceId = deviceId;
          await user.save();
        } else if (user.authorizedDeviceId !== deviceId) {
          return res.status(403).json({ 
            message: 'Unauthorized device. You can only login from your registered device.',
            isDeviceMismatch: true 
          });
        }
      }

      const token = generateToken((user._id as mongoose.Types.ObjectId).toString());
      
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        authorizedDeviceId: user.authorizedDeviceId
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const user = await User.findById(req.user._id).select('-password');
    return res.json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: errorMessage });
  }
};

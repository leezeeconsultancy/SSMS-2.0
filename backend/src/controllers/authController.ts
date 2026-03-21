import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password, deviceId } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.password && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'Suspended') {
        return res.status(401).json({ message: 'Account suspended' });
      }

      // ─── DEVICE BINDING LOGIC ───
      if (user.role === 'Employee') { // Usually restricted for employees
        if (!deviceId) {
          return res.status(400).json({ message: 'Device identification required' });
        }

        if (!user.authorizedDeviceId) {
          // Bind the first device
          user.authorizedDeviceId = deviceId;
          await user.save();
        } else if (user.authorizedDeviceId !== deviceId) {
          return res.status(403).json({ 
            message: 'Unauthorized device. You can only login from your registered device.',
            isDeviceMismatch: true 
          });
        }
      }

      const token = generateToken((user._id as any).toString());
      
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
        authorizedDeviceId: user.authorizedDeviceId
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

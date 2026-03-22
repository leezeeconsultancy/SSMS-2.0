
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { connectDB } from './config/db';

dotenv.config();

const resetAdmin = async () => {
    try {
        await connectDB();
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@ssms.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        console.log(`Searching for user with email: ${adminEmail}`);
        const user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log('User not found. Please run npm run seed first.');
            process.exit(1);
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(adminPassword, salt);
        user.status = 'Active'; // Ensure it is active
        user.role = 'Super Admin'; // Ensure correct role
        
        await user.save();
        console.log('✅ Admin password has been reset successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
};

resetAdmin();

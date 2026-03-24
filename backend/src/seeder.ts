import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { connectDB } from './config/db';
import { Employee } from './models/Employee';

dotenv.config();

const seedAdminUser = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ssms.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    console.log('Clearing existing Admin users...');
    await User.deleteMany({ role: 'Super Admin' });
    await Employee.deleteMany({ designation: 'System Owner' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'Super Admin',
      status: 'Active',
    });

    await Employee.create({
      userId: adminUser._id,
      employeeId: 'SSMS-ADMIN-01',
      name: adminName,
      phone: '+91 9999999999',
      email: adminEmail,
      department: 'Administration',
      designation: 'System Owner',
      salary: 100000,
      joiningDate: new Date(),
    });

    console.log('✅ Admin initialized successfully!');
    console.log('─────────────────────────────────────────');
    console.log(`  Email:    ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
    console.log('─────────────────────────────────────────');
    console.log('⚠️  Change this password immediately after first login.');

    process.exit();
  } catch (error) {
    console.error(`Error with seeder: ${error}`);
    process.exit(1);
  }
};

seedAdminUser();

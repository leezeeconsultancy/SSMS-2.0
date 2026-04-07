import cron from 'node-cron';
import { Employee } from '../models/Employee';
import { getISTComponents } from '../utils/dateUtils';
import mongoose from 'mongoose';

/**
 * 🚀 PROACTIVE DATABASE WARMUP CRON
 * Prevents MongoDB Atlas (Free Tier) from sleeping.
 * This runs periodically during morning shift hours to keep the DB hot.
 */
export const initWarmupCron = () => {
    // 1. Regular Heartbeat: Every 15 minutes between 06:00 and 12:00 IST
    // (Translates to 00:30 UTC - 06:30 UTC)
    cron.schedule('*/15 0-7 * * *', async () => {
        const ist = getISTComponents();
        // Only run if between 6:30 AM and 12:30 PM IST (local office morning)
        if (ist.hours >= 6 && ist.hours <= 12) {
            console.log(`[WARMUP] ⚡ Pinging Database for Cold-Start Prevention at ${ist.hours}:${String(ist.minutes).padStart(2, '0')} IST...`);
            try {
                // Perform a very light DB operation
                const count = await Employee.countDocuments();
                console.log(`[WARMUP] ✅ DB is Hot! (Current Employees: ${count})`);
            } catch (err) {
                console.error(`[WARMUP] ❌ Failed to wake up DB:`, err);
            }
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // 2. Extra Wakeup: 15 minutes before any specific shift starts
    cron.schedule('45 * * * *', async () => {
        const ist = getISTComponents();
        const nextHour = (ist.hours + 1) % 24;
        const nextHourStr = `${String(nextHour).padStart(2, '0')}:00`;

        // Check if anyone starts at the next hour
        const startsSoon = await Employee.exists({ shiftStartTime: nextHourStr });
        if (startsSoon) {
            console.log(`[WARMUP] 📢 Detected shift start at ${nextHourStr}. Pre-warming database...`);
            await Employee.findOne(); // Wakeup call
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    console.log(`[CRON] 🛡️ Cold-Start Prevention Service Initialized.`);
};

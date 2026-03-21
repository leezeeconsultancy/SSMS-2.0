import cron from 'node-cron';
import { Employee } from '../models/Employee';
import { DailyQR, generateDailyToken } from '../models/DailyQR';

const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Auto-generate QR tokens for all active employees at midnight
export const startDailyQRCron = () => {
  // Run at 00:01 AM every day
  cron.schedule('1 0 * * *', async () => {
    console.log('[CRON] Auto-generating daily QR tokens...');
    try {
      const today = getTodayString();
      const employees = await Employee.find({ status: 'Active' });
      let count = 0;

      for (const emp of employees) {
        const existing = await DailyQR.findOne({ employeeId: emp._id, date: today });
        if (existing) continue;

        const token = generateDailyToken(emp._id.toString(), today);
        await DailyQR.create({ employeeId: emp._id, token, date: today, used: false });
        count++;
      }

      console.log(`[CRON] ✅ Generated ${count} QR tokens for ${today}`);
    } catch (error) {
      console.error('[CRON] ❌ Failed to generate QR tokens:', error);
    }
  });

  console.log('[CRON] Daily QR auto-generation scheduled at 00:01 AM');

  // Also run immediately on server start to ensure today's tokens exist
  generateTodayTokens();
};

// Run once on server startup
const generateTodayTokens = async () => {
  try {
    const today = getTodayString();
    const employees = await Employee.find({ status: 'Active' });
    let count = 0;

    for (const emp of employees) {
      const existing = await DailyQR.findOne({ employeeId: emp._id, date: today });
      if (existing) continue;

      const token = generateDailyToken(emp._id.toString(), today);
      await DailyQR.create({ employeeId: emp._id, token, date: today, used: false });
      count++;
    }

    if (count > 0) {
      console.log(`[STARTUP] Auto-generated ${count} QR tokens for ${today}`);
    }
  } catch (error) {
    console.error('[STARTUP] Failed to generate QR tokens:', error);
  }
};

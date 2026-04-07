import cron from 'node-cron';
import { Employee } from '../models/Employee';
import { DailyQR, generateDailyToken } from '../models/DailyQR';

/**
 * Returns today's date string in IST (Asia/Kolkata) as YYYY-MM-DD.
 * Server runs in UTC — this ensures QR tokens are generated for the correct IST date.
 */
const getTodayStringIST = (): string => {
  const now = new Date();
  const istStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istStr);
  return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`;
};

// Auto-generate QR tokens for all active employees at midnight IST
export const startDailyQRCron = () => {
  // Run at 00:01 AM IST every day
  // IST is UTC+5:30, so 00:01 IST = 18:31 UTC (previous day)
  cron.schedule('31 18 * * *', async () => {
    console.log('[CRON] Auto-generating daily QR tokens (IST midnight)...');
    try {
      const today = getTodayStringIST();
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

  console.log('[CRON] Daily QR auto-generation scheduled at 00:01 AM IST (18:31 UTC)');

  // Also run immediately on server start to ensure today's tokens exist
  generateTodayTokens();
};

// Run once on server startup
const generateTodayTokens = async () => {
  try {
    const today = getTodayStringIST();
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

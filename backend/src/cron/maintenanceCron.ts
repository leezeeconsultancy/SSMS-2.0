import cron from 'node-cron';
import { Attendance } from '../models/Attendance';
import fs from 'fs';
import path from 'path';

/**
 * Maintenance Cron:
 * 1. Runs on the 1st of every month at 02:00 AM.
 * 2. Backs up attendance records older than 3 months.
 * 3. Deletes them from the active database to keep it lightweight.
 */
export const initMaintenanceCron = () => {
    // Schedule: 1st of every month at 2:00 AM
    cron.schedule('0 2 1 * *', async () => {
        console.log('[Maintenance] Starting monthly attendance cleanup...');
        
        try {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

            // 1. Find records to archive
            const recordsToArchive = await Attendance.find({
                date: { $lt: threeMonthsAgo }
            }).populate('employeeId', 'name employeeId');

            if (recordsToArchive.length === 0) {
                console.log('[Maintenance] No old records to archive.');
                return;
            }

            // 2. Create Backup Directory
            const backupDir = path.join(process.cwd(), 'backups', 'attendance');
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }

            // 3. Save as JSON file
            const timestamp = new Date().toISOString().slice(0, 10);
            const fileName = `archive_${timestamp}_count_${recordsToArchive.length}.json`;
            const filePath = path.join(backupDir, fileName);
            
            fs.writeFileSync(filePath, JSON.stringify(recordsToArchive, null, 2));
            console.log(`[Maintenance] Archives saved to: ${filePath}`);

            // 4. Delete from Database
            const result = await Attendance.deleteMany({
                date: { $lt: threeMonthsAgo }
            });

            console.log(`[Maintenance] Successfully cleaned up ${result.deletedCount} old records.`);
        } catch (error) {
            console.error('[Maintenance] Cleanup failed:', error);
        }
    });

    console.log('✅ Maintenance Cron Initialized (Monthly Cleanup)');
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import PayrollLog from '../models/PayrollLog';
import { Payout } from '../models/Payout';
import { Employee } from '../models/Employee';

export const getPayrollCycles = async (req: AuthRequest, res: Response) => {
    try {
        const currentDate = new Date();
        const cycles = [];

        // Look back 6 months
        for (let i = 0; i < 6; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();

            let log = await PayrollLog.findOne({ month: m, year: y });
            
            // Calculate real-time stats
            const totalEmployees = await Employee.countDocuments({ status: { $ne: 'Terminated' } }); // Approx
            const paidPayouts = await Payout.find({ month: m, year: y, status: 'Paid' });
            const totalPaidAmount = paidPayouts.reduce((sum, p) => sum + p.netSalary, 0);

            if (!log) {
                // Return virtual log if not closed
                cycles.push({
                    month: m,
                    year: y,
                    status: 'Open',
                    totalEmployees,
                    completedEmployees: paidPayouts.length,
                    totalPayout: totalPaidAmount,
                    isVirtual: true
                });
            } else {
                cycles.push(log);
            }
        }

        return res.json(cycles);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch cycles' });
    }
};

export const completeCycle = async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.body;
        
        const totalEmployees = await Employee.countDocuments({ status: { $ne: 'Terminated' } });
        const paidPayouts = await Payout.find({ month, year, status: 'Paid' });
        const totalPaidAmount = paidPayouts.reduce((sum, p) => sum + p.netSalary, 0);

        const log = await PayrollLog.findOneAndUpdate(
            { month, year },
            {
                status: 'Closed',
                totalEmployees,
                completedEmployees: paidPayouts.length,
                totalPayout: totalPaidAmount,
                completedAt: new Date(),
                completedBy: req.user?._id
            },
            { upsert: true, new: true }
        );

        return res.json(log);
    } catch (error) {
        return res.status(500).json({ message: 'Failed to complete cycle' });
    }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { SystemConfig } from '../models/SystemConfig';
import { getISTMonthBoundaries } from '../utils/dateUtils';

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
 
    const { start: startDate, end: endDate } = getISTMonthBoundaries(Number(year), Number(month));

    const employees = await Employee.find({});
    const leaderBoard: any[] = [];

    for (const emp of employees) {
      const records = await Attendance.find({
        employeeId: emp._id,
        date: { $gte: startDate, $lte: endDate },
      });

      const totalWorkingDays = records.length;
      if (totalWorkingDays === 0) continue;

      let presentDays = 0;
      let lateDays = 0;
      let totalWorkHours = 0;

      records.forEach(r => {
        if (r.status === 'Present' || r.status === 'Late') presentDays++;
        if (r.status === 'Late') lateDays++;
        totalWorkHours += r.totalWorkingHours || 0;
      });

      const config = await SystemConfig.findOne() || await SystemConfig.create({});
      const attendanceScore = (presentDays / totalWorkingDays) * 40;
      const punctualityScore = presentDays > 0 ? ((presentDays - lateDays) / presentDays) * 30 : 0;
      const expectedHours = totalWorkingDays * (emp.workHoursPerDay || config.defaultWorkHoursPerDay);
      const workHourRatio = totalWorkHours / expectedHours;
      const workHourScore = (workHourRatio > 1 ? 1 : workHourRatio) * 30;
      const totalScore = Math.round(attendanceScore + punctualityScore + workHourScore);

      leaderBoard.push({
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        totalScore,
        metrics: {
          attendanceScore: Math.round(attendanceScore),
          punctualityScore: Math.round(punctualityScore),
          workHourScore: Math.round(workHourScore)
        }
      });
    }

    leaderBoard.sort((a, b) => b.totalScore - a.totalScore);
    return res.json(leaderBoard);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const getAbsenceAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    const { start: startDate, end: endDate } = getISTMonthBoundaries(Number(year), Number(month));

    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate('employeeId', 'name department');

    const empStats: Record<string, any> = {};

    records.forEach(r => {
      const empId = r.employeeId._id.toString();
      if (!empStats[empId]) {
        empStats[empId] = {
          name: (r.employeeId as any).name,
          department: (r.employeeId as any).department,
          totalDays: 0,
          absentDays: 0,
        };
      }
      empStats[empId].totalDays++;
      if (r.status === 'Absent') {
        empStats[empId].absentDays++;
      }
    });

    const analytics = Object.values(empStats).map(stat => ({
      name: stat.name,
      department: stat.department,
      absences: stat.absentDays,
      absenceRate: stat.totalDays > 0 ? ((stat.absentDays / stat.totalDays) * 100).toFixed(2) + '%' : '0%',
    }));

    analytics.sort((a, b) => parseFloat(b.absenceRate) - parseFloat(a.absenceRate));
    return res.json(analytics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

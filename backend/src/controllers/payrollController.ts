import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { SalaryRule } from '../models/SalaryRule';
import { Employee } from '../models/Employee';
import { Attendance } from '../models/Attendance';
import { SystemConfig } from '../models/SystemConfig';
import { getISTMonthBoundaries, getISTComponents } from '../utils/dateUtils';

// Basic CRUD for Salary Rules
export const createSalaryRule = async (req: AuthRequest, res: Response) => {
  try {
    const rule = await SalaryRule.create(req.body);
    return res.status(201).json(rule);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const getSalaryRules = async (req: AuthRequest, res: Response) => {
  try {
    const rules = await SalaryRule.find({});
    return res.json(rules);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

export const deleteSalaryRule = async (req: AuthRequest, res: Response) => {
    try {
      await SalaryRule.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Rule deleted' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ message });
    }
  };
  
  export const toggleSalaryRule = async (req: AuthRequest, res: Response) => {
    try {
      const rule = await SalaryRule.findById(req.params.id);
      if (!rule) return res.status(404).json({ message: 'Rule not found' });
      rule.isActive = !rule.isActive;
      await rule.save();
      return res.json(rule);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ message });
    }
  };

// Shared salary calculation logic
const computeSalary = async (employeeId: string, month: number, year: number) => {
  const employee = await Employee.findById(employeeId);
  if (!employee) throw new Error('Employee not found');
 
  const { start: startDate, end: endDate } = getISTMonthBoundaries(year, month);

  const attendanceRecords = await Attendance.find({
    employeeId: employee._id,
    date: { $gte: startDate, $lte: endDate },
  });

  const rules = await SalaryRule.find({ isActive: true });

  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalHalfDays = 0, totalOvertimeHours = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'Present') totalPresent++;
    else if (record.status === 'Late') { totalPresent++; totalLate++; }
    else if (record.status === 'Half Day') totalHalfDays++;
    else if (record.status === 'Absent') totalAbsent++;
    totalOvertimeHours += record.overTimeHours || 0;
  });

  // Fetch dynamic config
  const config = await SystemConfig.findOne() || await SystemConfig.create({});

  const baseSalary = employee.salary;
  const perDaySalary = baseSalary / config.workingDaysPerMonth; // DYNAMIC instead of /30
  const workHoursPerDay = employee.workHoursPerDay || config.defaultWorkHoursPerDay;
  let totalDeductions = 0;
  const deductionsBreakdown: any[] = [];

  rules.forEach(rule => {
    let count = 0;
    if (rule.triggerType === 'Late') count = totalLate;
    else if (rule.triggerType === 'Half Day') count = totalHalfDays;
    else if (rule.triggerType === 'Absent') count = totalAbsent;

    if (count > 0) {
      let deductionAmount = 0;
      if (rule.deductionType === 'FixedAmount') deductionAmount = rule.deductionValue * count;
      else if (rule.deductionType === 'FullDayCut') deductionAmount = perDaySalary * count;
      else if (rule.deductionType === 'Percentage') deductionAmount = (baseSalary * (rule.deductionValue / 100)) * count;

      totalDeductions += deductionAmount;
      deductionsBreakdown.push({
        ruleName: rule.ruleName, count, deductionAmount: Math.round(deductionAmount),
      });
    }
  });

  const hourlyRate = baseSalary / (config.workingDaysPerMonth * workHoursPerDay);
  const overtimePay = Math.round(totalOvertimeHours * (hourlyRate * config.overtimeMultiplier)); // DYNAMIC multiplier
  const finalSalary = Math.round((baseSalary + overtimePay) - totalDeductions);

  return {
    employeeName: employee.name,
    employeeId: employee.employeeId,
    month, year, baseSalary,
    workHoursPerDay,
    overtimeHours: totalOvertimeHours,
    overtimePay,
    totalDeductions: Math.round(totalDeductions),
    deductionsBreakdown,
    finalSalary: finalSalary < 0 ? 0 : finalSalary,
    attendanceSummary: { totalPresent, totalAbsent, totalLate, totalHalfDays },
  };
};

// Admin: Calculate salary for any employee
export const calculateSalary = async (req: AuthRequest, res: Response) => {
  const { employeeId, month, year } = req.query;
  try {
    const result = await computeSalary(employeeId as string, Number(month), Number(year));
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

// Employee: View own payslip
export const getMyPayslip = async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });
 
    const ist = getISTComponents();
    const m = month ? Number(month) : ist.month + 1;
    const y = year ? Number(year) : ist.year;

    const result = await computeSalary(employee._id.toString(), m, y);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
};

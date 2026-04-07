import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Attendance } from '../models/Attendance';
import { Employee } from '../models/Employee';
import { Holiday } from '../models/Holiday';
import { DailyQR, generateDailyToken } from '../models/DailyQR';
import { AttendanceRequest } from '../models/AttendanceRequest';
import { OfficeLocation } from '../models/OfficeLocation';
import { SystemConfig } from '../models/SystemConfig';

// ═══════════════════════════════════════════════════════════
//  VALIDATION CONFIG — Anti-Manipulation Rules
// ═══════════════════════════════════════════════════════════
const VALIDATION_RULES = {
  // Check-In Window: Only allow between 5:00 AM and 1:00 PM
  CHECK_IN_START_HOUR: 5,     // 5:00 AM earliest
  CHECK_IN_END_HOUR: 13,      // 1:00 PM latest (no arriving after lunch)

  // Check-Out Window: Only between 11:00 AM and 11:59 PM
  CHECK_OUT_START_HOUR: 11,    // 11:00 AM earliest (prevent instant check-out)
  CHECK_OUT_END_HOUR: 23,     // 11:00 PM latest (no midnight/next-day fraud)
  CHECK_OUT_END_MINUTE: 59,

  // Time Gaps
  MIN_WORK_MINUTES: 30,       // Minimum 30 min between check-in and check-out
  MAX_WORK_HOURS: 16,         // Maximum 16 hours (prevent overnight fraud)
  MIN_CHECKOUT_AFTER_CHECKIN_HOURS: 1, // Must work at least 1 hour before checkout

  // Location Rules
  MAX_LOCATION_DISTANCE_KM: 50, // If check-in and check-out locations differ by > 50km, flag it

  // Overtime Cap
  MAX_OVERTIME_HOURS: 4,       // Cap overtime at 4 hours per day (no one works 18 hours)
};

// ═══════════════════════════════════════════════════════════
//  IST TIMEZONE HELPERS
//  Server runs in UTC — all business logic must use IST
//  (Asia/Kolkata, UTC+5:30)
// ═══════════════════════════════════════════════════════════
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds

/**
 * Returns current IST time components for business logic comparisons.
 * Uses Intl timezone conversion for accuracy (handles DST edge cases).
 */
const getISTComponents = () => {
  const now = new Date();
  const istStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istStr);
  return {
    hours: istDate.getHours(),
    minutes: istDate.getMinutes(),
    day: istDate.getDay(), // 0 = Sunday
    date: istDate.getDate(),
    month: istDate.getMonth(),
    year: istDate.getFullYear(),
    dateString: `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, '0')}-${String(istDate.getDate()).padStart(2, '0')}`,
  };
};

/**
 * Returns UTC Date representing IST midnight (start of today in IST).
 * Used for MongoDB date range queries.
 */
const getISTStartOfDay = (): Date => {
  const ist = getISTComponents();
  // Create UTC date for IST midnight, then subtract offset to get true UTC equivalent
  const utcMidnight = new Date(Date.UTC(ist.year, ist.month, ist.date, 0, 0, 0, 0));
  utcMidnight.setTime(utcMidnight.getTime() - IST_OFFSET_MS);
  return utcMidnight;
};

/**
 * Returns today's date in IST as YYYY-MM-DD string.
 */
const getTodayString = (): string => {
  return getISTComponents().dateString;
};

// ═══════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════
const calculateHours = (checkIn: Date, checkOut: Date): number => {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return diffTime / (1000 * 60 * 60);
};

const calculateMinutes = (checkIn: Date, checkOut: Date): number => {
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  return diffTime / (1000 * 60);
};

// Calculate distance between two GPS points in km (Haversine formula)
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 0; // Skip if no GPS
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Check if today is a Sunday (using IST day)
const isSunday = (): boolean => getISTComponents().day === 0;

// Check if today is a holiday (using IST day boundaries)
const isHoliday = async (): Promise<boolean> => {
  const istStartOfDay = getISTStartOfDay();
  const istEndOfDay = new Date(istStartOfDay.getTime() + 24 * 60 * 60 * 1000);
  const holiday = await Holiday.findOne({ date: { $gte: istStartOfDay, $lt: istEndOfDay } });
  return !!holiday;
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: Request Late Check-in
// ═══════════════════════════════════════════════════════════
export const requestLateCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const { reason } = req.body;
    const today = getTodayString();

    const existing = await AttendanceRequest.findOne({ employeeId: employee._id, date: today });
    if (existing) return res.status(400).json({ message: 'Request already submitted for today.' });

    const request = await AttendanceRequest.create({
      employeeId: employee._id,
      date: today,
      reason,
      status: 'Pending',
      type: 'Late Check-in'
    });

    return res.status(201).json({ message: 'Request submitted to admin successfully.', request });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: Get all attendance requests
// ═══════════════════════════════════════════════════════════
export const getAttendanceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await AttendanceRequest.find().populate('employeeId', 'name employeeId department').sort({ createdAt: -1 });
    return res.json(requests);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: Update request status
// ════════════════════════════════════════════════━━━━━━━━━━━
export const updateRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const request = await AttendanceRequest.findByIdAndUpdate(id, { status, adminNote }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    return res.json({ message: `Request ${status} successfully`, request });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: Generate daily QR tokens
// ═══════════════════════════════════════════════════════════
export const generateDailyQRs = async (req: AuthRequest, res: Response) => {
  try {
    const today = getTodayString();
    const employees = await Employee.find({ status: 'Active' });

    const results: any[] = [];
    for (const emp of employees) {
      const existing = await DailyQR.findOne({ employeeId: emp._id, date: today });
      if (existing) {
        results.push({ employeeId: emp.employeeId, name: emp.name, token: existing.token, status: 'already_generated' });
        continue;
      }
      const token = generateDailyToken(emp._id.toString(), today);
      await DailyQR.create({ employeeId: emp._id, token, date: today, used: false });
      results.push({ employeeId: emp.employeeId, name: emp.name, token, status: 'new' });
    }

    return res.json({ message: `QR tokens generated for ${today}`, date: today, count: results.length, tokens: results });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: Get my today's QR token
// ═══════════════════════════════════════════════════════════
export const getMyDailyQR = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const today = getTodayString();
    let qr = await DailyQR.findOne({ employeeId: employee._id, date: today });

    if (!qr) {
      const token = generateDailyToken(employee._id.toString(), today);
      qr = await DailyQR.create({ employeeId: employee._id, token, date: today, used: false });
    }

    return res.json({
      token: qr.token, date: today, used: qr.used,
      employeeName: employee.name, employeeId: employee.employeeId,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: CHECK-IN — With Full Anti-Manipulation
// ═══════════════════════════════════════════════════════════
export const checkIn = async (req: AuthRequest, res: Response) => {
  const { qrToken, latitude, longitude, deviceId } = req.body;
  const userId = req.user!._id;

  try {
    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const user = employee.userId as any;

    // Use SERVER time only (client time can be faked)
    const serverNow = new Date();
    // Use IST for all time validations (server runs in UTC)
    const ist = getISTComponents();
    const currentHour = ist.hours;
    const currentMinute = ist.minutes;
    const today = ist.dateString;
    const flags: string[] = [];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 0: Device Authorization
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (user.authorizedDeviceId && deviceId !== user.authorizedDeviceId) {
      return res.status(403).json({
        message: '🚫 Unauthorized device. Use your registered device to mark attendance.',
        validation: 'INVALID_DEVICE'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 1: Holiday Check
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (await isHoliday()) {
      return res.status(403).json({
        message: '🚫 Today is a holiday. No attendance required!',
        validation: 'HOLIDAY_BLOCKED'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 3: Check-In Time Window
    //  Only 5:00 AM to 1:00 PM — no fake early/late entries
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (currentHour < VALIDATION_RULES.CHECK_IN_START_HOUR) {
      return res.status(403).json({
        message: `🚫 Too early! Check-in opens at ${VALIDATION_RULES.CHECK_IN_START_HOUR}:00 AM. Current time: ${currentHour}:${String(currentMinute).padStart(2, '0')}`,
        validation: 'TOO_EARLY_CHECKIN'
      });
    }
    if (currentHour >= VALIDATION_RULES.CHECK_IN_END_HOUR) {
      // Check if Admin has approved a late check-in request for today
      const approvedRequest = await AttendanceRequest.findOne({
        employeeId: employee._id,
        date: today,
        status: 'Approved',
        type: 'Late Check-in'
      });

      if (!approvedRequest) {
        return res.status(403).json({
          message: `🚫 Check-in window closed. You cannot check in after ${VALIDATION_RULES.CHECK_IN_END_HOUR > 12 ? VALIDATION_RULES.CHECK_IN_END_HOUR - 12 : VALIDATION_RULES.CHECK_IN_END_HOUR}:00 ${VALIDATION_RULES.CHECK_IN_END_HOUR >= 12 ? 'PM' : 'AM'}. Submit a request for Admin approval.`,
          validation: 'LATE_CHECKIN_BLOCKED'
        });
      }
      
      // If approved, mark as admin approved late
      flags.push('ADMIN_APPROVED_LATE');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 4: QR Token Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const qr = await DailyQR.findOne({ employeeId: employee._id, date: today });
    if (!qr) return res.status(400).json({ message: '🚫 No QR token for today. Please wait or contact admin.' });
    if (qr.token !== qrToken) return res.status(400).json({ message: '🚫 Invalid QR token. Possible tampering detected.', validation: 'INVALID_TOKEN' });
    if (qr.used) return res.status(400).json({ message: '🚫 Token already used. You have already marked attendance today.', validation: 'TOKEN_REUSE' });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 5: Duplicate Check-In Protection
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const startOfDay = getISTStartOfDay();
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: startOfDay },
    });
    if (existingAttendance) {
      return res.status(400).json({ message: '🚫 Already checked in today. Cannot mark twice.', validation: 'DUPLICATE_CHECKIN' });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 6: GPS Validation — Must provide location
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      flags.push('NO_GPS_CHECKIN');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 7: GEO-FENCE — Must be at office location
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const officeLocation = await OfficeLocation.findOne({ isActive: true });
    if (officeLocation && latitude && longitude && latitude !== 0 && longitude !== 0) {
      const distanceKm = haversineDistance(latitude, longitude, officeLocation.latitude, officeLocation.longitude);
      const distanceMeters = distanceKm * 1000;
      if (distanceMeters > officeLocation.radiusMeters) {
        return res.status(403).json({
          message: `🚫 You are ${Math.round(distanceMeters)}m away from ${officeLocation.name}. You must be within ${officeLocation.radiusMeters}m to mark attendance.`,
          validation: 'OUTSIDE_GEOFENCE',
          distance: Math.round(distanceMeters),
          requiredRadius: officeLocation.radiusMeters,
        });
      }
    }

    // Fetch dynamic config for late threshold
    const config = await SystemConfig.findOne() || await SystemConfig.create({});

    // Determine Status (server time only) — DYNAMIC threshold
    let status: string = 'Present';
    if (currentHour > config.lateThresholdHour || (currentHour === config.lateThresholdHour && currentMinute > config.lateThresholdMinute)) {
      status = 'Late';
    }

    const attendance = await Attendance.create({
      employeeId: employee._id,
      date: serverNow,
      checkIn: {
        time: serverNow, // Use SERVER time, not client time
        location: { latitude: latitude || 0, longitude: longitude || 0 },
        deviceType: 'Web App',
      },
      status,
      flags,
      serverCheckInTime: serverNow, // Immutable server timestamp
    });

    // Mark QR as used
    qr.used = true;
    await qr.save();

    return res.status(201).json({ message: `✅ Check-in successful (${status}) at ${serverNow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, attendance });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: CHECK-OUT — With Full Anti-Manipulation
// ═══════════════════════════════════════════════════════════
export const checkOut = async (req: AuthRequest, res: Response) => {
  const { latitude, longitude, deviceId } = req.body;
  const userId = req.user!._id;

  try {
    const employee = await Employee.findOne({ userId }).populate('userId');
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const user = employee.userId as any;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 0: Device Authorization
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (user.authorizedDeviceId && deviceId !== user.authorizedDeviceId) {
      return res.status(403).json({
        message: '🚫 Unauthorized device. Use your registered device to check out.',
        validation: 'INVALID_DEVICE'
      });
    }

    const startOfDay = getISTStartOfDay();

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: { $gte: startOfDay },
    });

    if (!attendance) {
      return res.status(400).json({ message: '🚫 No check-in record found for today. Check in first.' });
    }
    if (attendance.checkOut?.time) {
      return res.status(400).json({ message: '🚫 Already checked out today. Cannot check out twice.', validation: 'DUPLICATE_CHECKOUT' });
    }

    // Use SERVER time only — IST for validations
    const serverNow = new Date();
    const ist = getISTComponents();
    const currentHour = ist.hours;
    const currentMinute = ist.minutes;
    const flags: string[] = [...(attendance.flags || [])];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 1: Check-Out Time Window
    //  No check-out before 11 AM or after 11:59 PM
    //  Prevents: midnight fraud, next-day check-out
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (currentHour >= VALIDATION_RULES.CHECK_OUT_END_HOUR && currentMinute > VALIDATION_RULES.CHECK_OUT_END_MINUTE) {
      return res.status(403).json({
        message: '🚫 Check-out window closed. You cannot check out after 11:59 PM. Contact admin.',
        validation: 'MIDNIGHT_CHECKOUT_BLOCKED'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 2: Minimum Time Between Check-In & Check-Out
    //  Must have worked at least 30 minutes — prevents instant checkout fraud
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const minutesSinceCheckIn = calculateMinutes(attendance.checkIn.time, serverNow);

    if (minutesSinceCheckIn < VALIDATION_RULES.MIN_WORK_MINUTES) {
      return res.status(403).json({
        message: `🚫 Too soon! You must work at least ${VALIDATION_RULES.MIN_WORK_MINUTES} minutes before checking out. You've only been here ${Math.round(minutesSinceCheckIn)} minutes.`,
        validation: 'TOO_SOON_CHECKOUT'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 3: Maximum Work Hours Cap
    //  Prevents: leaving early, coming back at night to click checkout
    //  No one genuinely works 16+ hours
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const hoursSinceCheckIn = calculateHours(attendance.checkIn.time, serverNow);

    if (hoursSinceCheckIn > VALIDATION_RULES.MAX_WORK_HOURS) {
      flags.push('EXCESSIVE_HOURS');
      return res.status(403).json({
        message: `🚫 Suspicious! You checked in ${Math.round(hoursSinceCheckIn)} hours ago. Maximum allowed is ${VALIDATION_RULES.MAX_WORK_HOURS} hours. This has been flagged. Contact admin.`,
        validation: 'EXCESSIVE_HOURS_BLOCKED'
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  VALIDATION 4: GPS Location Drift Check
    //  If check-in and check-out locations are > 50 km apart, flag it
    //  Prevents: checking in at office, leaving, checking out from home
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (latitude && longitude && attendance.checkIn.location) {
      const distance = haversineDistance(
        attendance.checkIn.location.latitude,
        attendance.checkIn.location.longitude,
        latitude,
        longitude
      );
      if (distance > VALIDATION_RULES.MAX_LOCATION_DISTANCE_KM) {
        flags.push(`LOCATION_DRIFT_${Math.round(distance)}KM`);
      }
    }

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      flags.push('NO_GPS_CHECKOUT');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  CALCULATE HOURS (All server-side, can't be faked)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalHours = calculateHours(attendance.serverCheckInTime || attendance.checkIn.time, serverNow);
    const validatedHours = parseFloat(totalHours.toFixed(2));

    // Per-employee work hours
    const requiredHours = employee.workHoursPerDay || 9;
    const halfDayThreshold = requiredHours / 2;

    // Set status based on validated hours
    let finalStatus = attendance.status; // Keep Late status if already late

    if (validatedHours < halfDayThreshold) {
      finalStatus = 'Half Day';
    }

    // Calculate overtime with cap (DYNAMIC from config)
    const config = await SystemConfig.findOne() || await SystemConfig.create({});
    let overtimeHours = 0;
    if (validatedHours > requiredHours) {
      overtimeHours = parseFloat((validatedHours - requiredHours).toFixed(2));
      // Cap overtime — dynamic value
      if (overtimeHours > config.maxOvertimeHoursPerDay) {
        flags.push(`OVERTIME_CAPPED_FROM_${overtimeHours}H`);
        overtimeHours = config.maxOvertimeHoursPerDay;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    //  SAVE — All times are server-recorded
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    attendance.checkOut = {
      time: serverNow,
      location: { latitude: latitude || 0, longitude: longitude || 0 },
      deviceType: 'Web App',
    };
    attendance.totalWorkingHours = validatedHours;
    attendance.overTimeHours = overtimeHours;
    attendance.status = finalStatus;
    attendance.flags = flags;
    attendance.serverCheckOutTime = serverNow;

    await attendance.save();

    const flagMsg = flags.length > 0 ? ` ⚠️ ${flags.length} flag(s) recorded.` : '';
    return res.json({
      message: `✅ Check-out at ${serverNow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}. Worked ${validatedHours}h (required: ${requiredHours}h).${flagMsg}`,
      attendance,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: My attendance history
// ═══════════════════════════════════════════════════════════
export const getMyAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findOne({ userId: req.user!._id });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const records = await Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(60);
    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: All attendance (with flags visible)
// ═══════════════════════════════════════════════════════════
export const getAllAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({}).populate('employeeId', 'name department employeeId').sort({ date: -1 });
    return res.json(records);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  EMPLOYEE: Check if current location is within geo-fence
// ═══════════════════════════════════════════════════════════
export const checkLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.query;
    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'Latitude and longitude are required', withinRange: false });
    }

    const officeLocation = await OfficeLocation.findOne({ isActive: true });
    if (!officeLocation) {
      // No office location configured — allow attendance from anywhere
      return res.json({ withinRange: true, distance: 0, officeName: 'Not Configured', radiusMeters: 0, noOfficeConfigured: true });
    }

    const distanceKm = haversineDistance(lat, lng, officeLocation.latitude, officeLocation.longitude);
    const distanceMeters = Math.round(distanceKm * 1000);
    const withinRange = distanceMeters <= officeLocation.radiusMeters;

    return res.json({
      withinRange,
      distance: distanceMeters,
      officeName: officeLocation.name,
      radiusMeters: officeLocation.radiusMeters,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message, withinRange: false });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: Get all office locations
// ═══════════════════════════════════════════════════════════
export const getOfficeLocations = async (req: AuthRequest, res: Response) => {
  try {
    const locations = await OfficeLocation.find().sort({ createdAt: -1 });
    return res.json(locations);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// ═══════════════════════════════════════════════════════════
//  ADMIN: Create or update office location
// ═══════════════════════════════════════════════════════════
export const setOfficeLocation = async (req: AuthRequest, res: Response) => {
  try {
    const { name, latitude, longitude, radiusMeters, isActive } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }

    // Deactivate all other locations if this one is active
    if (isActive !== false) {
      await OfficeLocation.updateMany({}, { isActive: false });
    }

    const location = await OfficeLocation.create({
      name,
      latitude,
      longitude,
      radiusMeters: radiusMeters || 200,
      isActive: isActive !== false,
    });

    return res.status(201).json({ message: 'Office location saved successfully', location });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateAttendanceRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { checkInTime, checkOutTime, status, adminNote } = req.body;

    const record = await Attendance.findById(id).populate('employeeId');
    if (!record) return res.status(404).json({ message: 'Record not found' });

    const employee = record.employeeId as any;
    const requiredHours = employee.workHoursPerDay || 9;

    if (checkInTime) record.checkIn.time = new Date(checkInTime);
    if (checkOutTime) {
      if (!record.checkOut) {
        record.checkOut = { 
          time: new Date(checkOutTime), 
          location: { latitude: 0, longitude: 0 },
          deviceType: 'Admin Override'
        };
      } else {
        record.checkOut.time = new Date(checkOutTime);
      }
    }
    if (status) record.status = status;
    
    // Recalculate hours
    if (record.checkIn.time && record.checkOut?.time) {
        const diffTime = Math.abs(record.checkOut.time.getTime() - record.checkIn.time.getTime());
        const totalHours = diffTime / (1000 * 60 * 60);
        record.totalWorkingHours = parseFloat(totalHours.toFixed(2));
        
        if (record.totalWorkingHours > requiredHours) {
            record.overTimeHours = parseFloat((record.totalWorkingHours - requiredHours).toFixed(2));
        } else {
            record.overTimeHours = 0;
        }
    }

    if (adminNote) {
        record.flags = [...(record.flags || []), `ADMIN_MODIFIED: ${adminNote}`];
    }

    await record.save();
    return res.json({ message: 'Attendance record updated manually', record });
  } catch (error: any) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error' });
  }
};

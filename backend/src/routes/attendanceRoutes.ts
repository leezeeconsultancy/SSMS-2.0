import express from 'express';
import { 
  checkIn, checkOut, getMyAttendance, getAllAttendance, 
  generateDailyQRs, getMyDailyQR,
  requestLateCheckIn, getAttendanceRequests, updateRequestStatus,
  checkLocation, getOfficeLocations, createOfficeLocation, updateOfficeLocation, deleteOfficeLocation, updateAttendanceRecord
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Admin: QR generation
router.post('/generate-qr', protect, authorize('Admin', 'Super Admin'), generateDailyQRs);

router.get('/office-locations', protect, authorize('Admin', 'Super Admin'), getOfficeLocations);
router.post('/office-locations', protect, authorize('Admin', 'Super Admin'), createOfficeLocation);
router.put('/office-locations/:id', protect, authorize('Admin', 'Super Admin'), updateOfficeLocation);
router.delete('/office-locations/:id', protect, authorize('Admin', 'Super Admin'), deleteOfficeLocation);

// Employee: Check geo-fence
router.get('/check-location', protect, checkLocation);

// Requests (Late Check-in)
router.post('/request-late-checkin', protect, requestLateCheckIn);
router.get('/requests', protect, authorize('Admin', 'Super Admin'), getAttendanceRequests);
router.patch('/requests/:id', protect, authorize('Admin', 'Super Admin'), updateRequestStatus);

// Employee: Get token
router.get('/my-qr', protect, getMyDailyQR);

// Check-in / Check-out
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/me', protect, getMyAttendance);

// Admin: View and update all attendance
router.get('/', protect, authorize('Admin', 'Manager', 'Super Admin'), getAllAttendance);
router.patch('/:id', protect, authorize('Admin', 'Super Admin'), updateAttendanceRecord);

export default router;


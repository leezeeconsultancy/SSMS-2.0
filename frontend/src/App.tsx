import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/Dashboard';
import Employees from './pages/admin/Employees';
import AttendanceRecords from './pages/admin/AttendanceRecords';
import PayrollLeave from './pages/admin/PayrollLeave';
import AttendanceRequests from './pages/admin/AttendanceRequests';
import AdminSettings from './pages/admin/Settings';
import EmployeeDashboard from './pages/employee/Dashboard';
import Attendance from './pages/employee/Attendance';
import LeaveRequests from './pages/employee/LeaveRequests';
import EmployeeProfile from './pages/employee/Profile';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="requests" element={<AttendanceRequests />} />
            <Route path="payroll" element={<PayrollLeave />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Employee Routes */}
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leaves" element={<LeaveRequests />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

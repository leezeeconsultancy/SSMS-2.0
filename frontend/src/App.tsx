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
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const App = () => {
  useEffect(() => {
    // Axios Interceptor for Database Connection Errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 503 && error.response.data?.code === 'DB_CONNECTION_ERROR') {
          toast.error('❌ Database Connection Offline. Some features may not work.', {
            id: 'db-error', // Prevent multiple toasts
            duration: 10000,
            style: { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fee2e2' }
          });
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthProvider>
      <Toaster position="top-center" />
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

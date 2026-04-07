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
      async (error) => {
        if (error.response?.status === 503 && error.response.data?.code === 'DB_CONNECTION_ERROR') {
          // Show a friendly, non-alarming message for free-tier cold starts
          toast('⏳ Service is waking up — please wait a moment...', {
            id: 'db-waking', // Prevent multiple toasts
            duration: 5000,
            icon: '🔄',
            style: { background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe', fontWeight: 600 }
          });

          // Auto-retry the failed request after a short delay if server says it's retryable
          if (error.response.data?.retryable && error.config && !error.config._retried) {
            error.config._retried = true;
            await new Promise(resolve => setTimeout(resolve, 5000));
            return axios(error.config);
          }
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

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Clock, CalendarCheck, TrendingUp, AlertTriangle, IndianRupee, Briefcase } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, attendanceRes, payslipRes] = await Promise.allSettled([
          axios.get('/api/employees/me'),
          axios.get('/api/attendance/me'),
          axios.get('/api/payroll/my-payslip'),
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value.data);
        if (payslipRes.status === 'fulfilled') setPayslip(payslipRes.value.data);
      } catch (error) {
        toast.error('Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-40 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-2 gap-4"><div className="h-24 bg-gray-200 rounded-xl"></div><div className="h-24 bg-gray-200 rounded-xl"></div></div>
      </div>
    );
  }

  const totalPresent = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const totalLate = attendance.filter(a => a.status === 'Late').length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0);

  return (
    <div className="space-y-5">
      <Toaster position="top-center" />
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-0.5">Hello, {profile?.name || user?.name}!</h2>
        <p className="text-primary-200 text-xs mb-5">{profile?.department} • {profile?.designation}</p>

        <div className="flex items-center justify-between bg-white/10 rounded-xl p-3.5 backdrop-blur-sm border border-white/20">
          <div>
            <p className="text-[10px] text-primary-200 uppercase tracking-wider mb-0.5">This Month's Salary</p>
            <div className="flex items-end space-x-1">
              <IndianRupee className="h-5 w-5 text-emerald-300" />
              <span className="text-2xl font-bold">{payslip ? payslip.finalSalary.toLocaleString() : '—'}</span>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-400/20 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
          <CalendarCheck className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
          <span className="text-lg font-bold text-gray-900">{totalPresent}</span>
          <span className="block text-[10px] text-gray-500 uppercase">Present</span>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
          <span className="text-lg font-bold text-gray-900">{totalLate}</span>
          <span className="block text-[10px] text-gray-500 uppercase">Late</span>
        </div>
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 text-center">
          <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
          <span className="text-lg font-bold text-gray-900">{totalHours.toFixed(0)}h</span>
          <span className="block text-[10px] text-gray-500 uppercase">Hours</span>
        </div>
      </div>

      {/* Payslip Breakdown */}
      {payslip && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
            <Briefcase className="h-4 w-4 mr-2 text-primary-500" />
            Payslip — {payslip.month}/{payslip.year}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Base Salary</span><span className="font-medium text-gray-900">₹{payslip.baseSalary.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Overtime Pay</span><span className="font-medium text-emerald-600">+₹{payslip.overtimePay.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Deductions</span><span className="font-medium text-red-600">-₹{payslip.totalDeductions.toLocaleString()}</span></div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Net Pay</span>
              <span className="font-bold text-primary-600 text-base">₹{payslip.finalSalary.toLocaleString()}</span>
            </div>
          </div>
          {payslip.deductionsBreakdown.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Deduction Details</p>
              {payslip.deductionsBreakdown.map((d: any, i: number) => (
                <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                  <span>{d.ruleName} (×{d.count})</span>
                  <span className="text-red-500">-₹{d.deductionAmount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-sm">Recent Attendance</h3>
        <div className="space-y-2">
          {attendance.length > 0 ? attendance.slice(0, 7).map((record, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-xs font-medium text-gray-800">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p className="text-[10px] text-gray-400">
                  {record.checkIn ? new Date(record.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  {' → '}
                  {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600">{record.totalWorkingHours ? `${record.totalWorkingHours}h` : '—'}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                  record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                  record.status === 'Half Day' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                }`}>{record.status}</span>
              </div>
            </div>
          )) : (
            <p className="text-center text-xs text-gray-400 py-4">No attendance records yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

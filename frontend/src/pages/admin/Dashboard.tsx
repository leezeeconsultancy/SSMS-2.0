import { useState, useEffect } from 'react';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle2, IndianRupee, TrendingUp, Settings, FileText, BarChart3, Info } from 'lucide-react';
import SilkTooltip from '../../components/Tooltip';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [empRes, attRes] = await Promise.allSettled([
          axios.get('/api/employees'),
          axios.get('/api/attendance'),
        ]);

        if (empRes.status === 'fulfilled') setEmployees(empRes.value.data);
        if (attRes.status === 'fulfilled') {
          const today = new Date().toISOString().slice(0, 10);
          const todayRecords = attRes.value.data.filter((r: any) => r.date?.slice(0, 10) === today);
          setTodayAttendance(todayRecords);
        }
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const totalEmployees = employees.length;
  const totalPresent = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const totalAbsent = totalEmployees - totalPresent;
  const totalLate = todayAttendance.filter(a => a.status === 'Late').length;

  // Payroll completion stats (data-driven from employee payrollStatus)
  const totalPaid = employees.filter((e: any) => e.payrollStatus === 'Paid').length;
  const totalPending = totalEmployees - totalPaid;
  const payrollPercent = totalEmployees > 0 ? Math.round((totalPaid / totalEmployees) * 100) : 0;

  // Department breakdown for chart
  const deptMap: any = {};
  employees.forEach(e => {
    const dept = e.department || 'Other';
    if (!deptMap[dept]) deptMap[dept] = { total: 0, present: 0 };
    deptMap[dept].total++;
  });
  todayAttendance.forEach(a => {
    const dept = a.employeeId?.department || 'Other';
    if (deptMap[dept]) deptMap[dept].present++;
  });
  const deptChartData = Object.keys(deptMap).map(dept => ({
    name: dept,
    total: deptMap[dept].total,
    present: deptMap[dept].present,
  }));

  const stats = [
    { name: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', tip: 'Total active employees in system' },
    { name: 'Present Today', value: totalPresent, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', tip: 'Employees who checked in' },
    { name: 'Absent Today', value: totalAbsent, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', tip: 'Employees not seen today' },
    { name: 'Late Today', value: totalLate, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', tip: 'Checked in after threshold' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8"><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Welcome Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <button onClick={() => navigate('/admin/payroll')} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-700 transition-all shadow-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Payroll
          </button>
          <button onClick={() => navigate('/admin/settings')} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-gray-50 transition-all">
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className={`bg-white p-5 rounded-2xl border ${item.border} hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-3">
              <div className={`rounded-xl p-2.5 ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <SilkTooltip content={item.tip} position="top">
                <Info className="h-3 w-3 text-gray-300 cursor-help" />
              </SilkTooltip>
            </div>
            <p className="text-2xl font-black text-gray-900">{item.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{item.name}</p>
          </div>
        ))}
      </div>

      {/* Payroll Completion Card */}
      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><IndianRupee className="h-24 w-24" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2">
            <p className="text-[10px] font-black text-primary-200 uppercase tracking-widest mb-2">This Month's Payroll Progress</p>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-4xl font-black">{payrollPercent}%</div>
              <div className="text-sm text-primary-100">
                <span className="font-bold text-white">{totalPaid}</span> of {totalEmployees} employees paid
              </div>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-emerald-400 h-3 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${payrollPercent}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-primary-200">
              <span>{totalPending} pending</span>
              <span>{totalPaid} completed</span>
            </div>
          </div>
          <div className="flex flex-col justify-center items-start md:items-end space-y-2">
            <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-[10px] text-primary-200 font-bold uppercase">Paid</p>
              <p className="text-lg font-black flex items-center"><CheckCircle2 className="h-4 w-4 mr-1 text-emerald-400" />{totalPaid}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm">
              <p className="text-[10px] text-primary-200 font-bold uppercase">Pending</p>
              <p className="text-lg font-black flex items-center"><TrendingUp className="h-4 w-4 mr-1 text-amber-400" />{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Today's Check-Ins</h3>
          <div className="flow-root">
            {todayAttendance.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {todayAttendance.slice(0, 8).map((record: any, idx: number) => (
                  <li key={idx} className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-black text-xs uppercase">
                        {record.employeeId?.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900">{record.employeeId?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          In: {record.checkIn ? new Date(record.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {record.checkOut?.time && ` | Out: ${new Date(record.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                      record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                      record.status === 'Late' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-50 text-gray-700'
                    }`}>{record.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No check-ins recorded today</p>
                <p className="text-[10px] text-gray-300 mt-1">Attendance data will appear once staff check in via QR</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Department Attendance</h3>
          <div className="h-72">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 700 }} 
                  />
                  <Bar dataKey="total" fill="#E0E7FF" name="Total" radius={[8, 8, 0, 0]} maxBarSize={35} />
                  <Bar dataKey="present" fill="#6366F1" name="Present" radius={[8, 8, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <BarChart3 className="h-8 w-8 text-gray-200 mb-3" />
                <p className="text-sm font-bold text-gray-400">No department data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto QR Status */}
      <div className="flex justify-center">
        <div className="inline-flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
          <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
          QR Codes Auto-Generated Daily
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

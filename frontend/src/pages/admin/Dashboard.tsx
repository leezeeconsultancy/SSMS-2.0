import { useState, useEffect } from 'react';
import axios from 'axios';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    { name: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Present Today', value: totalPresent, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Absent Today', value: totalAbsent, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-100' },
    { name: 'Late Today', value: totalLate, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8"><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>;
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Auto QR Status */}
      <div className="flex justify-end">
        <div className="inline-flex items-center px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          QR Codes Auto-Generated Daily
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="bg-white pt-5 px-4 pb-5 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className={`rounded-lg p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Attendance List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Today's Check-Ins</h3>
          <div className="flow-root">
            {todayAttendance.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {todayAttendance.slice(0, 10).map((record: any, idx: number) => (
                  <li key={idx} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs uppercase">
                        {record.employeeId?.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{record.employeeId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          In: {record.checkIn ? new Date(record.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {record.checkOut?.time && ` | Out: ${new Date(record.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                      record.status === 'Late' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{record.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-sm text-gray-400 py-8">No attendance records today yet.</p>
            )}
          </div>
        </div>

        {/* Department Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Department Attendance</h3>
          <div className="h-72">
            {deptChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total" fill="#c7d2fe" name="Total" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="present" fill="#6366f1" name="Present" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex justify-center items-center text-sm text-gray-400">No data yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, UserX, AlertCircle, CheckCircle2, IndianRupee, TrendingUp, Settings, FileText, Info, MapPin } from 'lucide-react';
import SilkTooltip from '../../components/Tooltip';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [empRes, attRes, locRes] = await Promise.allSettled([
          axios.get('/api/employees'),
          axios.get('/api/attendance'),
          axios.get('/api/attendance/office-locations'),
        ]);

        if (empRes.status === 'fulfilled') setEmployees(empRes.value.data);
        if (locRes.status === 'fulfilled') setLocations(locRes.value.data);
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

  const totalPaid = employees.filter((e: any) => e.payrollStatus === 'Paid').length;
  const totalPending = totalEmployees - totalPaid;
  const payrollPercent = totalEmployees > 0 ? Math.round((totalPaid / totalEmployees) * 100) : 0;

  const locationStats = locations.map(loc => ({
    name: loc.name,
    count: employees.filter(e => (e.assignedLocation?._id || e.assignedLocation) === loc._id).length
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button onClick={() => navigate('/admin/assignments')} className="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all shrink-0">
            <MapPin className="h-3.5 w-3.5 mr-1.5" /> Assignments
          </button>
          <button onClick={() => navigate('/admin/payroll')} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary-700 transition-all shadow-sm shrink-0">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Payroll
          </button>
          <button onClick={() => navigate('/admin/settings')} className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-50 transition-all shrink-0">
            <Settings className="h-3.5 w-3.5 mr-1.5" /> Settings
          </button>
        </div>
      </div>

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

      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10"><IndianRupee className="h-20 w-20 sm:h-24 sm:w-24" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="md:col-span-2">
            <p className="text-[10px] font-black text-primary-200 uppercase tracking-widest mb-2">This Month's Payroll Progress</p>
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-3xl sm:text-4xl font-black">{payrollPercent}%</div>
              <div className="text-xs sm:text-sm text-primary-100 italic">
                <span className="font-bold text-white">{totalPaid}</span> of {totalEmployees} employees paid
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
              <div 
                className="bg-emerald-400 h-3 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${payrollPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="flex flex-row md:flex-col justify-center items-center md:items-end gap-3 sm:gap-2">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm flex-1 md:flex-none">
              <p className="text-[9px] text-primary-200 font-bold uppercase">Paid</p>
              <p className="text-sm sm:text-lg font-black flex items-center"><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-emerald-400" />{totalPaid}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 backdrop-blur-sm flex-1 md:flex-none">
              <p className="text-[9px] text-primary-200 font-bold uppercase">Pending</p>
              <p className="text-sm sm:text-lg font-black flex items-center"><TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-amber-400" />{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Today's Check-Ins</h3>
            <button onClick={() => navigate('/admin/attendance')} className="text-[10px] font-black text-primary-600 uppercase">View All</button>
          </div>
          <div className="flow-root flex-1">
            {todayAttendance.length > 0 ? (
              <ul className="divide-y divide-gray-50">
                {todayAttendance.slice(0, 5).map((record: any, idx: number) => (
                  <li key={idx} className="py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center">
                      <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 font-black text-xs uppercase">
                        {record.employeeId?.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{record.employeeId?.name || 'Unknown'}</p>
                        <p className="text-[9px] text-gray-500 font-medium tracking-tighter">
                          In: {record.checkIn ? new Date(record.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          {record.checkOut?.time && ` | Out: ${new Date(record.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
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
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch Distribution</h3>
              <button onClick={() => navigate('/admin/assignments')} className="text-[10px] font-black text-primary-600 uppercase">Manage</button>
           </div>
           <div className="space-y-4">
              {locationStats.length > 0 ? locationStats.map((loc, idx) => (
                <div key={idx} className="group cursor-pointer hover:bg-gray-50 p-2 rounded-xl transition-all" onClick={() => navigate('/admin/assignments')}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{loc.name}</span>
                    </div>
                    <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">{loc.count} Staff</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${employees.length > 0 ? (loc.count / employees.length) * 100 : 0}%` }}></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-400">No offices configured</p>
                </div>
              )}
           </div>
        </div>
      </div>

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

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

  const [filter, setFilter] = useState<'All' | 'Late' | 'Absent' | 'Present'>('All');
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [empRes, attRes, locRes, reqRes] = await Promise.allSettled([
          axios.get('/api/employees'),
          axios.get('/api/attendance'),
          axios.get('/api/attendance/office-locations'),
          axios.get('/api/attendance/requests'),
        ]);

        if (empRes.status === 'fulfilled') setEmployees(empRes.value.data);
        if (locRes.status === 'fulfilled') setLocations(locRes.value.data);
        if (reqRes.status === 'fulfilled') setRequests(reqRes.value.data.filter((r: any) => r.status === 'Pending'));
        
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

  const stats = [
    { name: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', type: 'All' },
    { name: 'Present Today', value: totalPresent, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', type: 'Present' },
    { name: 'Absent Today', value: totalAbsent, icon: UserX, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', type: 'Absent' },
    { name: 'Late Today', value: totalLate, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', type: 'Late' },
  ];

  const filteredAttendance = () => {
    if (filter === 'All') return todayAttendance.slice(0, 10);
    if (filter === 'Present') return todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late');
    if (filter === 'Late') return todayAttendance.filter(a => a.status === 'Late');
    if (filter === 'Absent') {
      const presentIds = new Set(todayAttendance.map(a => a.employeeId?._id));
      return employees.filter(e => !presentIds.has(e._id)).map(e => ({
        employeeId: e,
        status: 'Absent',
        isAbsentPlaceholder: true
      }));
    }
    return todayAttendance;
  };

  if (loading) {
    return <div className="animate-pulse space-y-8 p-4"><div className="h-32 bg-gray-200 rounded-3xl"></div><div className="h-64 bg-gray-200 rounded-3xl"></div></div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Toaster position="bottom-center" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Admin Hub</h2>
          <p className="text-sm font-bold text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* ACTION NEEDED: PENDING REQUESTS */}
      {requests.length > 0 && (
        <div 
          onClick={() => navigate('/admin/requests')}
          className="bg-rose-600 p-4 rounded-[24px] text-white flex items-center justify-between shadow-lg shadow-rose-200 animate-pulse cursor-pointer mx-1"
        >
          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-xl mr-3 font-black">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80">Action Required</p>
              <p className="text-sm font-bold">{requests.length} Pending Attendance Requests</p>
            </div>
          </div>
          <CheckCircle2 className="h-5 w-5 opacity-50" />
        </div>
      )}

      {/* TOP SCROLLABLE QUICK ACTIONS */}
      <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide px-1">
        <button onClick={() => navigate('/admin/branches')} className="flex items-center px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm shrink-0">
          <MapPin className="h-4 w-4 mr-2 text-primary-600" /> Branch Hub
        </button>
        <button onClick={() => navigate('/admin/payroll')} className="flex items-center px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm shrink-0">
          <FileText className="h-4 w-4 mr-2 text-primary-600" /> Payroll
        </button>
        <button onClick={() => navigate('/admin/employees')} className="flex items-center px-5 py-3 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm shrink-0">
          <Users className="h-4 w-4 mr-2 text-primary-600" /> All Staff
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 px-1">
        {stats.map((item) => (
          <div 
            key={item.name} 
            onClick={() => setFilter(item.type as any)}
            className={`bg-white p-4 rounded-[28px] border-2 transition-all cursor-pointer active:scale-95 ${filter === item.type ? 'border-primary-500 shadow-md translate-y-[-2px]' : 'border-transparent shadow-sm'}`}
          >
            <div className={`rounded-2xl p-2 w-fit mb-3 ${item.bg}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-black text-gray-900 leading-none">{item.value}</p>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{item.name}</p>
          </div>
        ))}
      </div>

      <div className="px-1">
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-5 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{filter} List</h3>
              <p className="text-[10px] font-bold text-primary-600 mt-0.5">Today's Live Updates</p>
            </div>
            <button onClick={() => setFilter('All')} className="text-[10px] font-black text-gray-400 uppercase hover:text-primary-600 transition-colors">Clear</button>
          </div>
          
          <div className="flex-1">
            {filteredAttendance().length > 0 ? (
              <ul className="space-y-3">
                {filteredAttendance().map((record: any, idx: number) => (
                  <li key={idx} className="bg-gray-50/50 p-3 rounded-2xl flex items-center justify-between border border-transparent hover:border-gray-100 transition-all">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs uppercase ${record.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 'bg-primary-100 text-primary-700'}`}>
                        {record.employeeId?.name?.charAt(0) || '?'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-black text-gray-900 truncate max-w-[120px]">{record.employeeId?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">
                          {record.status === 'Absent' ? 'Not Checked In' : `In: ${new Date(record.checkIn?.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                       {record.status === 'Absent' && record.employeeId?.phone && (
                         <a href={`tel:${record.employeeId.phone}`} className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors active:scale-90">
                           <Users className="h-4 w-4" /> {/* Replacing with Users as placeholder for Phone if not imported, but tel link is primary */}
                           <span className="sr-only">Call</span>
                         </a>
                       )}
                       <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${
                        record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                        record.status === 'Late' ? 'bg-amber-50 text-amber-700' :
                        record.status === 'Absent' ? 'bg-rose-50 text-rose-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>{record.status}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30">
                <Users className="h-12 w-12 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest italic">No Data Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

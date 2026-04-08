import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, MapPin, 
  Calendar, Loader2, History
} from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceHistory = () => {
  const { id } = useParams(); // For admin view
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<any>(null);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const url = id ? `/api/attendance/employee/${id}` : '/api/attendance/me';
        const res = await axios.get(url);
        setData(res.data);

        if (id) {
            const empRes = await axios.get(`/api/employees/${id}`);
            setEmployee(empRes.data);
        } else {
            const empRes = await axios.get('/api/employees/me');
            setEmployee(empRes.data);
        }
      } catch (error) {
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  const filteredData = data.filter(rec => {
    const d = new Date(rec.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const getStats = () => {
    const present = filteredData.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Late In').length;
    const halfDay = filteredData.filter(r => r.status === 'Half Day').length;
    
    // Calculate Absent Days
    const now = new Date();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const upToDay = isCurrentMonth ? now.getDate() : daysInMonth;

    let workingDaysCount = 0;
    const loggedDays = new Set(filteredData.map(r => new Date(r.date).getDate()));

    for (let i = 1; i <= upToDay; i++) {
        const dayDate = new Date(selectedYear, selectedMonth, i);
        if (dayDate.getDay() !== 0) { // Not Sunday
            workingDaysCount++;
        }
    }

    const absent = Math.max(0, workingDaysCount - filteredData.length);

    return { present, halfDay, absent };
  };

  const { present, halfDay, absent } = getStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-xs font-black uppercase tracking-widest">Loading Logs...</p>
      </div>
    );
  }

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-5 pb-20 pt-4 px-4 max-w-2xl mx-auto stagger-children">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm active:scale-90 transition-transform"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div className="text-right">
          <h2 className="text-lg font-black text-slate-900 leading-none">Activity Log</h2>
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mt-1.5">{employee?.name || 'My Profile'}</p>
        </div>
      </div>

      {/* Summary Header */}
      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between animate-fade-in">
        <div className="bg-white/10 p-4 rounded-2xl">
          <History className="h-8 w-8" />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Monthly Logs</p>
          <p className="text-4xl font-black">{filteredData.length}</p>
          <p className="text-[10px] font-bold text-indigo-100 mt-1 italic">Retaining last 3 months</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up delay-100">
         <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
            <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-1.5">Present</p>
            <p className="text-xl font-black text-emerald-800 leading-none">{present}</p>
         </div>
         <div className="bg-orange-50 rounded-2xl p-3 border border-orange-100 text-center">
            <p className="text-[8px] font-black uppercase text-orange-600 tracking-widest mb-1.5">Half Day</p>
            <p className="text-xl font-black text-orange-800 leading-none">{halfDay}</p>
         </div>
         <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 text-center">
            <p className="text-[8px] font-black uppercase text-rose-600 tracking-widest mb-1.5">Absent</p>
            <p className="text-xl font-black text-rose-800 leading-none">{absent}</p>
         </div>
      </div>

      {/* Month Filter */}
      <div className="flex items-center gap-3">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
          >
            {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <div className="bg-primary-50 text-primary-600 text-[10px] font-black px-4 py-2.5 rounded-xl border border-primary-100 uppercase tracking-widest">
            {selectedYear}
          </div>
      </div>

      <div className="space-y-4">
        {filteredData.length > 0 ? filteredData.map((rec, idx) => (
          <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:border-primary-100 transition-all animate-scale-in">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${
                  rec.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                  rec.status === 'Late' || rec.status === 'Late In' ? 'bg-amber-50 text-amber-600' :
                  rec.status === 'Half Day' ? 'bg-orange-50 text-orange-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">
                    {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    rec.status === 'Present' ? 'bg-emerald-50 text-emerald-700' :
                    rec.status === 'Late' || rec.status === 'Late In' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700'
                  }`}>{rec.status}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-primary-600">{rec.totalWorkingHours?.toFixed(1) || '—'}h</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Worked</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1.5">
                    <Clock className="h-3 w-3 mr-1 text-emerald-400" /> Check In
                  </div>
                  <p className="text-xs font-black text-slate-700">
                    {rec.checkIn?.time ? new Date(rec.checkIn.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400 flex items-center mt-1 truncate">
                    <MapPin className="h-2.5 w-2.5 mr-0.5 opacity-50" />
                    {rec.checkIn?.location?.latitude?.toFixed(4)}, {rec.checkIn?.location?.longitude?.toFixed(4)}
                  </p>
               </div>

               <div className="text-right">
                  <div className="flex items-center justify-end text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-1.5">
                    <Clock className="h-3 w-3 mr-1 text-primary-400" /> Check Out
                  </div>
                  <p className="text-xs font-black text-slate-700">
                    {rec.checkOut?.time ? new Date(rec.checkOut.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400 flex items-center justify-end mt-1 truncate">
                    <MapPin className="h-2.5 w-2.5 mr-0.5 opacity-50" />
                    {rec.checkOut?.location?.latitude?.toFixed(4)}, {rec.checkOut?.location?.longitude?.toFixed(4)}
                  </p>
               </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 px-10 border-2 border-dashed border-slate-100 rounded-[40px] opacity-40">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-sm font-black uppercase tracking-widest italic">No Records Found</p>
            <p className="text-xs font-bold mt-2">No check-in data found for {months[selectedMonth]}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, CalendarCheck, TrendingUp, AlertTriangle, 
  IndianRupee, Briefcase, History, CheckCircle2, 
  CalendarDays, Info, ArrowRight, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, attendanceRes, payoutsRes] = await Promise.allSettled([
          axios.get('/api/employees/me'),
          axios.get('/api/attendance/me'),
          axios.get('/api/payouts/my/history'),
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (attendanceRes.status === 'fulfilled') setAttendance(attendanceRes.value.data);
        if (payoutsRes.status === 'fulfilled') setPayouts(payoutsRes.value.data);
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
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest">Loading Dashboard...</p>
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];
  const hasClockedInToday = attendance.some(a => a.date?.split('T')[0] === today && a.checkIn);
  
  const currentMonthPayout = payouts.find((p: any) => p.month === currentMonth && p.year === currentYear);
  const currentStatus = currentMonthPayout?.status || 'Not Started';
  const isPaidThisMonth = currentStatus === 'Paid';
  
  const salaryStatusConfig: Record<string, { label: string; badge: string; badgeBg: string; iconColor: string; circleBg: string }> = {
    'Paid':        { label: "This Month's Salary",  badge: 'COMPLETED',     badgeBg: 'bg-emerald-500/90', iconColor: 'text-emerald-300', circleBg: 'bg-emerald-400/80' },
    'Processing':  { label: 'Salary Processing',    badge: 'PROCESSING',    badgeBg: 'bg-blue-500/90',    iconColor: 'text-blue-300',    circleBg: 'bg-blue-400/80' },
    'Pending':     { label: 'Salary Draft',          badge: 'DRAFT',         badgeBg: 'bg-amber-500/90',   iconColor: 'text-amber-300',   circleBg: 'bg-amber-400/80' },
    'On Hold':     { label: 'Salary On Hold',        badge: 'ON HOLD',       badgeBg: 'bg-orange-500/90',  iconColor: 'text-orange-300',  circleBg: 'bg-orange-400/80' },
    'Cancelled':   { label: 'Salary Cancelled',      badge: 'CANCELLED',     badgeBg: 'bg-red-500/90',     iconColor: 'text-red-300',     circleBg: 'bg-red-400/80' },
    'Not Started': { label: 'Pending Salary',        badge: 'AWAITING',      badgeBg: 'bg-amber-500/80 animate-pulse', iconColor: 'text-amber-300', circleBg: 'bg-amber-400/80' },
  };
  const sc = salaryStatusConfig[currentStatus] || salaryStatusConfig['Not Started'];
  
  const expectedPayoutDay = profile?.defaultPayoutDay || 1;
  const totalPresent = attendance.filter(a => ['Present', 'Late'].includes(a.status)).length;
  const totalLate = attendance.filter(a => a.status === 'Late').length;
  const totalHours = attendance.reduce((sum, a) => sum + (a.totalWorkingHours || 0), 0);

  return (
    <div className="space-y-4 px-4 pb-20 max-w-lg mx-auto">
      
      {/* ═══ Clock In Action ═══ */}
      {!hasClockedInToday && (
        <div 
          onClick={() => navigate('/employee/attendance')} 
          className="bg-white border-2 border-emerald-500 rounded-3xl p-5 flex items-center justify-between cursor-pointer active:scale-95 transition-transform shadow-lg shadow-emerald-100 mt-2"
        >
           <div className="flex items-center">
              <div className="bg-emerald-50 p-3 rounded-2xl mr-4">
                <Clock className="h-6 w-6 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Time to Clock In!</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Tap here to mark attendance</p>
              </div>
           </div>
           <ArrowRight className="h-5 w-5 text-emerald-500" />
        </div>
      )}

      {/* ═══ Premium Welcome Card ═══ */}
      <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-3 right-4 opacity-[0.06]"><Briefcase className="h-24 w-24" /></div>
        
        <h2 className="text-2xl font-black mb-0.5">Hello, {profile?.name || user?.name}!</h2>
        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-6 opacity-80">{profile?.department} • {profile?.designation}</p>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] text-indigo-100 font-black uppercase tracking-widest mb-1.5">{sc.label}</p>
                <div className="flex items-center space-x-1">
                    <IndianRupee className={`h-5 w-5 ${sc.iconColor}`} />
                    <span className="text-3xl font-black tracking-tight">
                        {currentMonthPayout ? currentMonthPayout.netSalary.toLocaleString() : 'PENDING'}
                    </span>
                </div>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${sc.circleBg}`}>
                {isPaidThisMonth ? <TrendingUp className="h-6 w-6 text-white" /> : <Clock className="h-6 w-6 text-white" />}
            </div>
          </div>
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center text-[10px] font-bold text-indigo-100 italic">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                {isPaidThisMonth 
                    ? `Paid on ${new Date(currentMonthPayout.payoutDate).toLocaleDateString('en-IN')}`
                    : `Expected: ${expectedPayoutDay} ${new Date().toLocaleDateString('en-IN', { month: 'short' })}`
                }
            </div>
            <div className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${sc.badgeBg}`}>
                {sc.badge}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CalendarCheck, value: totalPresent, label: 'Present', color: 'emerald', bg: 'bg-emerald-50' },
          { icon: AlertTriangle, value: totalLate, label: 'Late', color: 'amber', bg: 'bg-amber-50' },
          { icon: Clock, value: `${totalHours.toFixed(0)}h`, label: 'Worked', color: 'blue', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 text-center flex flex-col items-center hover:shadow-sm transition-all shadow-indigo-50">
            <div className={`${stat.bg} p-2 rounded-xl mb-2`}>
              <stat.icon className={`h-4.5 w-4.5 text-${stat.color}-600`} />
            </div>
            <span className="text-xl font-black text-slate-900">{stat.value}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ═══ History ═══ */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4 flex items-center">
          <History className="h-3 w-3 mr-2" />
          Recent Payouts
        </h3>
        <div className="space-y-3">
          {payouts.length > 0 ? payouts.slice(0, 3).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-50">
              <div className="flex items-center">
                <div className="bg-white p-2.5 rounded-xl mr-3 shadow-sm border border-slate-100">
                  <IndianRupee className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{new Date(p.year, p.month - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Paid: {new Date(p.payoutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-sm font-black text-primary-600">₹{p.netSalary.toLocaleString()}</p>
            </div>
          )) : (
            <p className="text-center py-6 text-slate-400 text-[10px] font-black uppercase tracking-widest italic outline-dashed outline-1 outline-slate-100 rounded-2xl">No payouts yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

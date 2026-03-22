import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Clock, CalendarCheck, TrendingUp, AlertTriangle, 
  IndianRupee, Briefcase, History, CheckCircle2, 
  CalendarDays, Info, ArrowRight
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user } = useAuth();
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
      <div className="space-y-4 p-5 animate-pulse">
        <div className="h-44 bg-slate-200/60 rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 bg-slate-200/60 rounded-2xl" />
          <div className="h-24 bg-slate-200/60 rounded-2xl" />
          <div className="h-24 bg-slate-200/60 rounded-2xl" />
        </div>
        <div className="h-48 bg-slate-200/60 rounded-2xl" />
      </div>
    );
  }

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
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
    <div className="space-y-5 p-4 max-w-lg mx-auto stagger-children">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', fontWeight: 600, fontSize: '13px' } }} />
      
      {/* ═══ Premium Welcome Card ═══ */}
      <div className="gradient-hero rounded-3xl p-6 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute top-3 right-4 opacity-[0.06]"><Briefcase className="h-24 w-24" /></div>
        
        <h2 className="text-2xl font-extrabold mb-0.5 relative">Hello, {profile?.name || user?.name}!</h2>
        <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.15em] mb-6 opacity-80">{profile?.department} • {profile?.designation}</p>

        <div className="glass-dark rounded-2xl p-5 border border-white/10 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] text-indigo-200 font-extrabold uppercase tracking-[0.15em] mb-1.5">
                    {sc.label}
                </p>
                <div className="flex items-center space-x-1">
                    <IndianRupee className={`h-5 w-5 ${sc.iconColor}`} />
                    <span className="text-3xl font-black tracking-tight">
                        {currentMonthPayout ? currentMonthPayout.netSalary.toLocaleString() : 'PENDING'}
                    </span>
                </div>
                {currentMonthPayout?.holdAmount > 0 && (
                  <p className="text-[10px] text-orange-300 font-bold mt-1">₹{currentMonthPayout.holdAmount.toLocaleString()} held</p>
                )}
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${sc.circleBg} backdrop-blur-md`}>
                {isPaidThisMonth ? <TrendingUp className="h-6 w-6 text-white" /> : <Clock className="h-6 w-6 text-white" />}
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center text-[10px] font-bold text-indigo-200">
                <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                {isPaidThisMonth 
                    ? `Paid on ${new Date(currentMonthPayout.payoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                    : `Expected Day: ${expectedPayoutDay} ${new Date().toLocaleDateString('en-IN', { month: 'short' })}`
                }
            </div>
            <div className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${sc.badgeBg} backdrop-blur-sm`}>
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
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="silk-card p-4 text-center flex flex-col items-center">
              <div className={`${stat.bg} p-2 rounded-xl mb-2.5`}>
                <Icon className={`h-5 w-5 text-${stat.color}-600`} />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">{stat.value}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ Payout History ═══ */}
      <div className="silk-card p-5 overflow-hidden">
        <h3 className="font-extrabold text-slate-900 mb-4 flex items-center text-xs uppercase tracking-[0.12em]">
          <History className="h-4 w-4 mr-2 text-primary-500" />
          Payout History
        </h3>
        <div className="space-y-3">
          {payouts.length > 0 ? payouts.slice(0, 3).map((p, idx) => (
            <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-primary-200 transition-all duration-200 group">
              <div className="flex items-center">
                <div className="bg-white p-2.5 rounded-xl mr-3 shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow duration-200">
                  <IndianRupee className="h-4 w-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{new Date(p.year, p.month - 1).toLocaleDateString('default', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Paid on {new Date(p.payoutDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-primary-600">₹{p.netSalary.toLocaleString()}</p>
                {p.holdAmount > 0 && (
                  <p className="text-[9px] text-orange-500 font-bold">₹{p.holdAmount.toLocaleString()} held</p>
                )}
                <div className="flex items-center justify-end text-[8px] font-black uppercase mt-0.5">
                    {(() => {
                        const statusMap: Record<string, { color: string; label: string }> = {
                            'Paid':       { color: 'text-emerald-600', label: 'Paid' },
                            'Pending':    { color: 'text-amber-600',   label: 'Pending' },
                            'Processing': { color: 'text-blue-600',    label: 'Processing' },
                            'On Hold':    { color: 'text-orange-600',  label: 'On Hold' },
                            'Cancelled':  { color: 'text-red-600',     label: 'Cancelled' },
                        };
                        const sm = statusMap[p.status] || statusMap['Pending'];
                        return (
                            <span className={`${sm.color} flex items-center`}>
                                {p.status === 'Paid' ? <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> : <Clock className="h-2.5 w-2.5 mr-1" />}
                                {sm.label}
                            </span>
                        );
                    })()}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
                <div className="bg-slate-100 rounded-full p-4 w-fit mx-auto mb-3">
                  <Info className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-[11px] text-slate-400 font-semibold">No salary records yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Info ═══ */}
      <div className="bg-primary-50/60 rounded-2xl p-4 flex items-start border border-primary-100/80">
        <Info className="h-4 w-4 text-primary-400 mt-0.5 mr-2.5 shrink-0" />
        <div>
            <p className="text-[10px] font-extrabold text-primary-700 uppercase tracking-tight">Financial Transparency</p>
            <p className="text-[9px] text-primary-500 mt-0.5 leading-relaxed">Your net salary includes base pay, bonuses, and overtime, after any deduction rules applied by HR. Payout dates may vary per month.</p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

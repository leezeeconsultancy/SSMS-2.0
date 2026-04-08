import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, Briefcase, Building, Calendar, IndianRupee, Shield, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const EmployeeProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/api/employees/me');
        setProfile(res.data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-md mx-auto p-4 animate-pulse">
        <div className="h-44 bg-slate-200/60 rounded-3xl" />
        <div className="h-80 bg-slate-200/60 rounded-3xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 text-slate-400 font-medium">
        <div className="bg-slate-100 rounded-full p-4 w-fit mx-auto mb-3">
          <Shield className="h-8 w-8 text-slate-300" />
        </div>
        Profile not found. Contact your admin.
      </div>
    );
  }

  const fields = [
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Phone, label: 'Phone', value: profile.phone },
    { icon: Briefcase, label: 'Designation', value: profile.designation },
    { icon: Building, label: 'Department', value: profile.department },
    { icon: Clock, label: 'Work Hours / Day', value: `${profile.workHoursPerDay} hours` },
    { icon: Calendar, label: 'Joining Date', value: new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { icon: IndianRupee, label: 'Monthly Salary', value: `₹${profile.salary?.toLocaleString()}` },
    { icon: Calendar, label: 'Leave Balance', value: `${profile.leaveBalance ?? 0} days remaining` },
    { icon: Shield, label: 'Status', value: profile.status },
  ];

  return (
    <div className="space-y-5 max-w-md mx-auto p-4 stagger-children">
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: '16px', fontWeight: 600, fontSize: '13px' } }} />

      {/* Profile Header */}
      <div className="gradient-hero rounded-3xl p-7 text-white text-center shadow-xl shadow-primary-900/20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-8 w-44 h-44 bg-primary-400/10 rounded-full blur-3xl" />
        
        <div className="h-20 w-20 rounded-3xl glass-dark flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg relative">
          <span className="text-3xl font-black">{profile.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">{profile.name}</h2>
        <p className="text-indigo-200 text-sm mt-0.5 font-semibold">{profile.employeeId}</p>
        <p className="text-indigo-300/70 text-xs mt-1 font-medium">{profile.designation} • {profile.department}</p>
      </div>

      {/* Details Card */}
      <div className="silk-card overflow-hidden divide-y divide-slate-100/80">
        {fields.map((field, i) => {
          const Icon = field.icon;
          return (
            <div key={i} className="flex items-center px-5 py-4 group hover:bg-slate-50/50 transition-colors duration-200">
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center mr-4 shrink-0 group-hover:bg-primary-50 transition-colors duration-200">
                <Icon className="h-4 w-4 text-slate-400 group-hover:text-primary-500 transition-colors duration-200" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400 font-semibold">{field.label}</p>
                <p className="text-sm font-semibold text-slate-900 truncate">{field.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        onClick={() => navigate('/employee/history')}
        className="w-full silk-card py-4 font-black text-primary-600 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
      >
        <Clock className="h-4 w-4" /> View Attendance History
      </button>

      <p className="text-center text-[10px] text-slate-400 px-8 font-medium">
        To update your personal information, contact your HR administrator.
      </p>
    </div>
  );
};

export default EmployeeProfile;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Phone, Briefcase, Building, Calendar, IndianRupee, Shield, Clock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const EmployeeProfile = () => {
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
    return <div className="animate-pulse space-y-4"><div className="h-40 bg-gray-200 rounded-xl"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>;
  }

  if (!profile) {
    return <div className="text-center py-16 text-gray-500">Profile not found. Contact your admin.</div>;
  }

  const fields = [
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: Phone, label: 'Phone', value: profile.phone },
    { icon: Briefcase, label: 'Designation', value: profile.designation },
    { icon: Building, label: 'Department', value: profile.department },
    { icon: Clock, label: 'Work Hours / Day', value: `${profile.workHoursPerDay || 9} hours` },
    { icon: Calendar, label: 'Joining Date', value: new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
    { icon: IndianRupee, label: 'Monthly Salary', value: `₹${profile.salary?.toLocaleString()}` },
    { icon: Shield, label: 'Status', value: profile.status },
  ];

  return (
    <div className="space-y-5 max-w-md mx-auto">
      <Toaster position="top-center" />

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white text-center shadow-lg">
        <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
          <span className="text-3xl font-bold">{profile.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-bold">{profile.name}</h2>
        <p className="text-primary-200 text-sm mt-0.5">{profile.employeeId}</p>
        <p className="text-primary-300 text-xs mt-1">{profile.designation} • {profile.department}</p>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {fields.map((field, i) => {
          const Icon = field.icon;
          return (
            <div key={i} className="flex items-center px-5 py-4">
              <div className="h-9 w-9 rounded-lg bg-gray-50 flex items-center justify-center mr-4 shrink-0">
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{field.label}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{field.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[10px] text-gray-400 px-8">
        To update your personal information, contact your HR administrator.
      </p>
    </div>
  );
};

export default EmployeeProfile;

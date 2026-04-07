import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2, LogIn, Shield, Users, BarChart3 } from 'lucide-react';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('ssms_device_id');
  if (!deviceId) {
    deviceId = window.crypto.randomUUID();
    localStorage.setItem('ssms_device_id', deviceId);
  }
  return deviceId;
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const deviceId = getDeviceId();
      const response = await axios.post('/api/auth/login', { 
        email: email.trim().toLowerCase(), 
        password, 
        deviceId 
      });
      const { token, ...userData } = response.data;
      
      toast.dismiss(); // Dismiss all previous toasts (like "waking up")
      login(userData, token);
      toast.success('Login Successful!');

      if (['Admin', 'Super Admin'].includes(userData.role)) {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (error: any) {
      if (!error.response) {
        toast.error('Network Error: Cannot reach the server. Please check your connection.');
      } else {
        toast.error(error.response.data?.message || 'Login failed. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: 'Staff Management' },
    { icon: Shield, text: 'QR Attendance' },
    { icon: BarChart3, text: 'Payroll Automation' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left: Branding Panel */}
        <div className="hidden lg:flex flex-col justify-center bg-gradient-to-br from-primary-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2 inline-flex items-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Grade</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-3">SSMS</h1>
            <p className="text-xl font-bold text-primary-100 mb-2">Smart Staff Management System</p>
            <p className="text-sm text-primary-200 leading-relaxed mb-8">
              Complete workforce management — from attendance tracking to automated payroll processing.
            </p>
            
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center space-x-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right: Login Form */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-black text-primary-600 mb-1">SSMS</h1>
            <p className="text-sm text-gray-500">Smart Staff Management System</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500">Sign in to access your dashboard</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm" 
                placeholder="you@company.com" 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-sm" 
                placeholder="••••••••" 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 text-sm uppercase tracking-widest flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
          
          <p className="text-center text-[10px] text-gray-400 mt-8 font-bold uppercase tracking-wider">
            Powered by SSMS v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

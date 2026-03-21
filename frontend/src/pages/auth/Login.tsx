import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
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
      const response = await axios.post('/api/auth/login', { email, password, deviceId });
      const { token, ...userData } = response.data;
      login(userData, token);
      toast.success('Login Successful!');

      if (['Admin', 'Super Admin'].includes(userData.role)) {
        navigate('/admin');
      } else {
        navigate('/employee');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-primary-600 mb-2">SSMS</h1>
          <h2 className="text-lg font-medium text-gray-600">Smart Staff Management System</h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm" placeholder="admin@ssms.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

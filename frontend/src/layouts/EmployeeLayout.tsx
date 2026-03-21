import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { QrCode, Home, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex justify-center items-center text-gray-500">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/employee', icon: Home },
    { name: 'Scan QR', path: '/employee/scan', icon: QrCode },
    { name: 'Leaves', path: '/employee/leaves', icon: Calendar },
    { name: 'Profile', path: '/employee/profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-bold text-primary-600">SSMS Portal</h1>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link key={link.name} to={link.path} className={`flex flex-col items-center justify-center w-full h-full space-y-0.5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Home, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EmployeeLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return (
    <div className="min-h-screen flex justify-center items-center bg-slate-50">
      <div className="flex flex-col items-center space-y-3">
        <div className="h-10 w-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading...</p>
      </div>
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/employee', icon: Home },
    { name: 'Attendance', path: '/employee/attendance', icon: ClipboardCheck },
    { name: 'Leaves', path: '/employee/leaves', icon: Calendar },
    { name: 'Profile', path: '/employee/profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* Header — Glass Effect */}
      <header className="h-14 glass border-b border-slate-200/50 flex items-center justify-between px-5 sticky top-0 z-20">
        <h1 className="text-base font-extrabold text-gradient tracking-tight">SSMS Portal</h1>
        <button 
          onClick={handleLogout} 
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation — Glass */}
      <nav className="fixed bottom-0 w-full z-50 px-4 pb-1 pt-0">
        <div className="glass rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-900/5 mx-auto max-w-md">
          <div className="flex justify-around items-center h-16">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-200 ${
                    isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-primary-500 animate-scale-in" />
                  )}
                  <div className={`transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] transition-all duration-200 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

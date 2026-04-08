import { useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LayoutDashboard, Calendar, FileText, Settings, LogOut, MessageSquare, Menu, X, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  if (isLoading) return <div className="min-h-screen flex justify-center items-center text-gray-500">Loading...</div>;

  const isAdmin = user && ['Admin', 'Super Admin'].includes(user.role);
  if (!isAdmin) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance', path: '/admin/attendance', icon: Calendar },
    { name: 'Requests', path: '/admin/requests', icon: MessageSquare },
    { name: 'Payroll & Leave', path: '/admin/payroll', icon: FileText },
    { name: 'Branch Hub', path: '/admin/branches', icon: MapPin },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <h1 className="text-xl font-black text-primary-600 tracking-tighter">SSMS Admin</h1>
          <button className="lg:hidden p-2 text-gray-400" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.name} 
                to={link.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-primary-50 text-primary-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-sm font-bold text-rose-600 rounded-xl hover:bg-rose-50 transition-colors">
            <LogOut className="mr-3 h-5 w-5 text-rose-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center">
            <button 
              className="lg:hidden p-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg lg:text-xl font-black text-gray-800 tracking-tight truncate">
              {navLinks.find(link => link.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-4">
            <span className="hidden sm:inline text-sm font-bold text-gray-500">Hi, {user?.name.split(' ')[0]}</span>
            <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black uppercase shadow-md shadow-primary-200">
              {user?.name.charAt(0)}
            </div>
          </div>
        </header>
        
        {/* Scrollable Content with Safe Zone */}
        <div className="flex-1 overflow-y-auto w-full pb-24 lg:pb-8">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>

        {/* BOTTOM NAVIGATION (Mobile-Only) */}
        <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-indigo-200/50 rounded-[28px] p-2 flex items-center justify-around h-18">
            {[navLinks[0], navLinks[1], navLinks[2], navLinks[5]].map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 relative ${
                    isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-200 -translate-y-1' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5.5 w-5.5" strokeWidth={isActive ? 2.5 : 1.8} />
                  {isActive && (
                    <span className="text-[8px] font-black uppercase mt-1 tracking-tighter">{link.name.split(' ')[0]}</span>
                  )}
                </Link>
              );
            })}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl text-gray-400 hover:bg-gray-50"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
          </div>
        </nav>
      </main>
    </div>
  );
};

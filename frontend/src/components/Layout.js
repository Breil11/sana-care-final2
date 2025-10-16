import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X, LayoutDashboard, Users, Building2, Calendar, Clock, FileText, MessageSquare, ArrowLeftRight, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Layout = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const res = await axios.get(`${API}/notifications`);
      const unread = res.data.filter(n => !n.read).length;
      setNotificationCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/users', icon: Users, label: 'Utilisateurs', roles: ['admin'] },
    { path: '/institutions', icon: Building2, label: 'Établissements', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/schedules', icon: Calendar, label: 'Horaires', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/shifts', icon: Clock, label: 'Prestations', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/payslips', icon: FileText, label: 'Fiches de paie', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/messages', icon: MessageSquare, label: 'Messages', roles: ['admin', 'infirmier', 'aide_soignant'] },
    { path: '/exchanges', icon: ArrowLeftRight, label: 'Échanges', roles: ['admin', 'infirmier', 'aide_soignant'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-amber-100">
          <h1 className="text-2xl font-bold gold-text" data-testid="app-logo">Sana-Care</h1>
          <p className="text-sm text-gray-500 mt-1">Infi As Pro</p>
        </div>

        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 font-semibold'
                    : 'text-gray-700 hover:bg-amber-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-100">
          <Link
            to="/profile"
            data-testid="nav-profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-amber-50 transition-all mb-2"
            onClick={() => setSidebarOpen(false)}
          >
            <User size={20} />
            <span>Profil</span>
          </Link>
          <button
            data-testid="logout-button"
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all w-full"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-amber-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              data-testid="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-gray-800">
                Bonjour, {user.first_name} {user.last_name}
              </h2>
            </div>

            <Link to="/notifications" data-testid="notifications-bell">
              <button className="relative p-2 rounded-lg hover:bg-amber-50 transition-colors">
                <Bell size={24} className="text-gray-700" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

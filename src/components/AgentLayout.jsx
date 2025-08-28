import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiZap,
  FiHome,
  FiCreditCard,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiUser,
  FiUsers,
  FiLogOut,
  FiShield,
  FiBell,
  FiHelpCircle,
} from 'react-icons/fi';

const agentSidebarLinks = [
  { to: '/agent-dashboard', icon: FiHome, label: 'Dashboard' },
  { to: '/agent/customers', icon: FiUsers, label: 'My Customers' },
  { to: '/agent/expenses', icon: FiFileText, label: 'Expenses' },
  { to: '/agent/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/agent/profile', icon: FiUser, label: 'Profile' },
  { to: '/agent/settings', icon: FiSettings, label: 'Settings' },
];

const AgentLayout = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }

  // Role checking is now handled at the route level
  const userRole = user?.role || user?.Role?.name;
  console.log('AgentLayout: User role:', userRole);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/agent/profile');
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    navigate('/agent/settings');
  };

  const handleNotificationsClick = () => {
    setDropdownOpen(false);
    navigate('/agent/notifications');
  };

  const handleHelpClick = () => {
    setDropdownOpen(false);
    navigate('/help');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        id="sidebar"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AgentPanel</h1>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="px-4 py-6">
          <div className="space-y-2">
            {agentSidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg border-r-4 transition-colors ${
                    isActive || location.pathname === link.to
                      ? 'text-gray-700 bg-green-50 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                  }`
                }
                end={link.to === '/dashboard'}
                onClick={() => setSidebarOpen(false)}
              >
                <link.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{link.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen((v) => !v)}
              >
                <FiMenu className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 capitalize">
                {agentSidebarLinks.find((l) => l.to === location.pathname)?.label ||
                  'Agent Dashboard'}
              </h2>
            </div>
            <div
              className="relative flex items-center space-x-3"
              ref={dropdownRef}
            >
              <div className="relative">
                <img
                  src={
                    user?.profile_pic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.name || 'Agent'
                    )}&background=10b981&color=fff&size=32`
                  }
                  alt="Agent"
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 hover:border-green-300 transition-colors"
                  onClick={() => setDropdownOpen((v) => !v)}
                />
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiUser className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={handleSettingsClick}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiSettings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleNotificationsClick}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiBell className="w-4 h-4 mr-2" />
                      Notifications
                    </button>
                    <button
                      onClick={handleHelpClick}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiHelpCircle className="w-4 h-4 mr-2" />
                      Help
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AgentLayout; 
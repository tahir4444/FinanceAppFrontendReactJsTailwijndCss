import React, { useEffect, useState, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiZap,
  FiHome,
  FiUsers,
  FiCreditCard,
  FiFileText,
  FiCheckSquare,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiShield,
  FiBell,
  FiHelpCircle,
  FiDownload,
} from 'react-icons/fi';

const AdminSidebarLayout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Get user role
  const role = user?.role || user?.Role?.name;
  const isSuperAdmin = role === 'superadmin';

  // Define sidebar links with conditional rendering for super admin only
  const sidebarLinks = [
    { to: 'dashboard', icon: FiHome, label: 'Dashboard' },
    { to: 'users', icon: FiUsers, label: 'Users' },
    { to: 'loans', icon: FiCreditCard, label: 'Loans' },
    { to: 'expenses', icon: FiFileText, label: 'Expenses' },
    { to: 'todos', icon: FiCheckSquare, label: 'Tasks' },
    // Roles - only for super admin
    ...(isSuperAdmin ? [{ to: 'roles', icon: FiSettings, label: 'Roles' }] : []),
    { to: 'reports', icon: FiBarChart2, label: 'Reports' },
    { to: 'support-messages', icon: FiFileText, label: 'Support' },
    { to: 'loans/agent-collections', icon: FiCreditCard, label: 'Agent Collections' },
    // App Updates - only for super admin
    ...(isSuperAdmin ? [{ to: 'app-updates', icon: FiDownload, label: 'App Updates' }] : []),
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

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

  // DEBUG: Log user object
  console.log('AdminSidebarLayout user:', user);
  console.log('AdminSidebarLayout isAuthenticated:', isAuthenticated);
  console.log('AdminSidebarLayout isLoading:', isLoading);

  // Robust role check
  console.log('Current location:', location.pathname); // Debug log
  console.log('User role:', role); // Debug log
  console.log('Is super admin:', isSuperAdmin);
  console.log('Sidebar links:', sidebarLinks);
  
  if (
    isAuthenticated &&
    !['admin', 'superadmin'].includes(role)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </div>
          <div className="text-gray-600">
            You don't have permission to access the admin area.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('profile');
  };

  const handleSettingsClick = () => {
    setDropdownOpen(false);
    navigate('settings');
  };

  const handleNotificationsClick = () => {
    setDropdownOpen(false);
    navigate('notifications');
  };

  const handleHelpClick = () => {
    setDropdownOpen(false);
    navigate('help');
  };

  const handleUpgradeManagementClick = () => {
    setDropdownOpen(false);
    navigate('upgrade-management');
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AdminPanel</h1>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <nav className="px-4 py-6">
          <div className="space-y-2">
            {sidebarLinks.map((link) => {
              console.log('Rendering sidebar link:', link.to, link.label);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg border-r-4 transition-colors ${
                      isActive || location.pathname.endsWith(link.to)
                        ? 'text-gray-700 bg-blue-50 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
                    }`
                  }
                  end={link.to === 'dashboard'}
                  onClick={() => {
                    console.log('Navigating to:', link.to); // Debug log
                    setSidebarOpen(false);
                  }}
                >
                  <link.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{link.label}</span>
                </NavLink>
              );
            })}
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
                 {sidebarLinks.find((l) => location.pathname.endsWith(l.to))?.label ||
                   'Admin'}
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
                      user?.name || 'Admin'
                    )}&background=3b82f6&color=fff&size=32`
                  }
                  alt="Admin"
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 hover:border-blue-300 transition-colors"
                  onClick={() => setDropdownOpen((v) => !v)}
                />
                {/* Online status indicator */}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role || 'Super Admin'}
                </div>
              </div>

              {/* Enhanced Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 top-12 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          user?.profile_pic ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            user?.name || 'Admin'
                          )}&background=3b82f6&color=fff&size=40`
                        }
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-gray-200"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {user?.name || 'Admin User'}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user?.role || 'Super Admin'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user?.email || 'admin@example.com'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className="py-2">
                    {/* Only show for superadmin */}
                    {role === 'superadmin' && (
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                        onClick={handleUpgradeManagementClick}
                      >
                        <FiSettings className="w-4 h-4 mr-3 text-blue-500" />
                        Upgrade Management
                      </button>
                    )}
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleProfileClick}
                    >
                      <FiUser className="w-4 h-4 mr-3 text-gray-500" />
                      My Profile
                    </button>

                    {/*
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleSettingsClick}
                    >
                      <FiSettings className="w-4 h-4 mr-3 text-gray-500" />
                      Settings
                    </button>

                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleNotificationsClick}
                    >
                      <FiBell className="w-4 h-4 mr-3 text-gray-500" />
                      Notifications
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        3
                      </span>
                    </button>
                   

                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={handleHelpClick}
                    >
                      <FiHelpCircle className="w-4 h-4 mr-3 text-gray-500" />
                      Help & Support
                    </button>
 */}
                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <FiLogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminSidebarLayout;

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../services/axios';
import {
  FiUser,
  FiShield,
  FiBell,
  FiGlobe,
  FiMoon,
  FiSun,
  FiEye,
  FiEyeOff,
  FiSave,
  FiKey,
  FiClock,
  FiDownload,
  FiUpload,
  FiTrash2,
  FiCheck,
  FiX,
  FiSettings,
  FiLock,
  FiMail,
  FiSmartphone,
  FiMonitor,
  FiDatabase,
  FiActivity,
  FiUsers,
  FiFileText,
} from 'react-icons/fi';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    language: 'en',
    timezone: 'UTC',
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
    passwordExpiry: 90,
  });

  // Application Settings
  const [appSettings, setAppSettings] = useState({
    theme: 'light',
    dashboardLayout: 'grid',
    autoRefresh: true,
    refreshInterval: 5,
    defaultPage: 'dashboard',
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    activityTracking: true,
    dataSharing: false,
    analytics: true,
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    apiKey: 'sk_test_...',
    webhookUrl: '',
    backupFrequency: 'daily',
    dataRetention: 365,
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAccountSettingsChange = (field, value) => {
    setAccountSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSecuritySettingsChange = (field, value) => {
    setSecuritySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAppSettingsChange = (field, value) => {
    setAppSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrivacySettingsChange = (field, value) => {
    setPrivacySettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSystemSettingsChange = (field, value) => {
    setSystemSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async (settingsType) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`${settingsType} settings saved successfully!`);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.put('/users/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'application', label: 'Application', icon: FiSettings },
    { id: 'privacy', label: 'Privacy', icon: FiEye },
    { id: 'system', label: 'System', icon: FiDatabase },
  ];

  const renderAccountSettings = () => (
    <div className="space-y-8">
      {/* Email Preferences */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiMail className="w-5 h-5 mr-2 text-blue-500" />
          Email Preferences
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-xs text-gray-500">
                Receive notifications via email
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accountSettings.emailNotifications}
                onChange={(e) =>
                  handleAccountSettingsChange(
                    'emailNotifications',
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                SMS Notifications
              </label>
              <p className="text-xs text-gray-500">
                Receive notifications via SMS
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accountSettings.smsNotifications}
                onChange={(e) =>
                  handleAccountSettingsChange(
                    'smsNotifications',
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Marketing Emails
              </label>
              <p className="text-xs text-gray-500">
                Receive promotional emails
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={accountSettings.marketingEmails}
                onChange={(e) =>
                  handleAccountSettingsChange(
                    'marketingEmails',
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiGlobe className="w-5 h-5 mr-2 text-green-500" />
          Language & Region
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <select
              value={accountSettings.language}
              onChange={(e) =>
                handleAccountSettingsChange('language', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={accountSettings.timezone}
              onChange={(e) =>
                handleAccountSettingsChange('timezone', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="UTC">UTC</option>
              <option value="EST">Eastern Time</option>
              <option value="PST">Pacific Time</option>
              <option value="IST">Indian Standard Time</option>
              <option value="GMT">GMT</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      {/* Password Change */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiLock className="w-5 h-5 mr-2 text-red-500" />
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showNew ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading || !currentPassword || !newPassword || !confirmPassword
            }
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Changing Password...
              </>
            ) : (
              <>
                <FiLock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </button>
        </form>
      </div>

      {/* Security Options */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiShield className="w-5 h-5 mr-2 text-orange-500" />
          Security Options
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Two-Factor Authentication
              </label>
              <p className="text-xs text-gray-500">
                Add an extra layer of security
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.twoFactorAuth}
                onChange={(e) =>
                  handleSecuritySettingsChange(
                    'twoFactorAuth',
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Login Alerts
              </label>
              <p className="text-xs text-gray-500">
                Get notified of new login attempts
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.loginAlerts}
                onChange={(e) =>
                  handleSecuritySettingsChange('loginAlerts', e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) =>
                handleSecuritySettingsChange(
                  'sessionTimeout',
                  parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password Expiry (days)
            </label>
            <select
              value={securitySettings.passwordExpiry}
              onChange={(e) =>
                handleSecuritySettingsChange(
                  'passwordExpiry',
                  parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationSettings = () => (
    <div className="space-y-8">
      {/* Theme Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiMonitor className="w-5 h-5 mr-2 text-purple-500" />
          Appearance
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={appSettings.theme === 'light'}
                  onChange={(e) =>
                    handleAppSettingsChange('theme', e.target.value)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-8 rounded-lg border-2 cursor-pointer flex items-center justify-center ${
                    appSettings.theme === 'light'
                      ? 'border-purple-500 bg-yellow-100'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <FiSun className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="ml-2 text-sm">Light</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={appSettings.theme === 'dark'}
                  onChange={(e) =>
                    handleAppSettingsChange('theme', e.target.value)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-8 rounded-lg border-2 cursor-pointer flex items-center justify-center ${
                    appSettings.theme === 'dark'
                      ? 'border-purple-500 bg-gray-800'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <FiMoon className="w-5 h-5 text-gray-300" />
                </div>
                <span className="ml-2 text-sm">Dark</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dashboard Layout
            </label>
            <select
              value={appSettings.dashboardLayout}
              onChange={(e) =>
                handleAppSettingsChange('dashboardLayout', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="grid">Grid Layout</option>
              <option value="list">List Layout</option>
              <option value="compact">Compact Layout</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiActivity className="w-5 h-5 mr-2 text-indigo-500" />
          Performance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Auto Refresh
              </label>
              <p className="text-xs text-gray-500">
                Automatically refresh data
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={appSettings.autoRefresh}
                onChange={(e) =>
                  handleAppSettingsChange('autoRefresh', e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Interval (minutes)
            </label>
            <select
              value={appSettings.refreshInterval}
              onChange={(e) =>
                handleAppSettingsChange(
                  'refreshInterval',
                  parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value={1}>1 minute</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Page
            </label>
            <select
              value={appSettings.defaultPage}
              onChange={(e) =>
                handleAppSettingsChange('defaultPage', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="dashboard">Dashboard</option>
              <option value="loans">Loans</option>
              <option value="expenses">Expenses</option>
              <option value="users">Users</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-8">
      {/* Profile Privacy */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiUsers className="w-5 h-5 mr-2 text-teal-500" />
          Profile Privacy
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Visibility
            </label>
            <select
              value={privacySettings.profileVisibility}
              onChange={(e) =>
                handlePrivacySettingsChange('profileVisibility', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="friends">Friends Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Activity Tracking
              </label>
              <p className="text-xs text-gray-500">
                Track your activity for analytics
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.activityTracking}
                onChange={(e) =>
                  handlePrivacySettingsChange(
                    'activityTracking',
                    e.target.checked
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Data Sharing
              </label>
              <p className="text-xs text-gray-500">
                Share data with third parties
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.dataSharing}
                onChange={(e) =>
                  handlePrivacySettingsChange('dataSharing', e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Analytics
              </label>
              <p className="text-xs text-gray-500">
                Help improve the application
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.analytics}
                onChange={(e) =>
                  handlePrivacySettingsChange('analytics', e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-8">
      {/* API Settings */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiKey className="w-5 h-5 mr-2 text-amber-500" />
          API Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={systemSettings.apiKey}
                onChange={(e) =>
                  handleSystemSettingsChange('apiKey', e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter API key"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <FiEye className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={systemSettings.webhookUrl}
              onChange={(e) =>
                handleSystemSettingsChange('webhookUrl', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="https://your-webhook-url.com"
            />
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FiDatabase className="w-5 h-5 mr-2 text-emerald-500" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backup Frequency
            </label>
            <select
              value={systemSettings.backupFrequency}
              onChange={(e) =>
                handleSystemSettingsChange('backupFrequency', e.target.value)
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Retention (days)
            </label>
            <select
              value={systemSettings.dataRetention}
              onChange={(e) =>
                handleSystemSettingsChange(
                  'dataRetention',
                  parseInt(e.target.value)
                )
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>

          <div className="flex space-x-4 pt-4">
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center">
              <FiDownload className="w-4 h-4 mr-2" />
              Export Data
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center">
              <FiUpload className="w-4 h-4 mr-2" />
              Import Data
            </button>
            <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex items-center">
              <FiTrash2 className="w-4 h-4 mr-2" />
              Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountSettings();
      case 'security':
        return renderSecuritySettings();
      case 'application':
        return renderApplicationSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'system':
        return renderSystemSettings();
      default:
        return renderAccountSettings();
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Settings
              </h1>
              <p className="text-gray-600">
                Manage your account preferences and application settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {renderContent()}

              {/* Save Button */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleSaveSettings(activeTab)}
                    disabled={loading}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Saving Settings...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-5 h-5 mr-3" />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsPage;

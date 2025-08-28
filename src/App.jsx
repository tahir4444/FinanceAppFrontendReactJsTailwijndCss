import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import AgentDashboard from './pages/AgentDashboard';
import AdminLayout from './components/AdminLayout';
import AgentLayout from './components/AgentLayout';
import TodosPage from './pages/TodosPage';
import RolesManager from './pages/RolesManager';
import UsersManager from './pages/UsersManager';
import ExpensesPage from './pages/ExpensesPage';

import MyLoansPage from './pages/MyLoansPage.jsx';
import SupportMessagesPage from './pages/SupportMessagesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SupportHelpPage from './pages/SupportHelpPage';
import Navbar from './components/layout/Navbar';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import CreditReportsPage from './pages/CreditReportsPage';
import AdminSidebarLayout from './components/AdminLayout';
import NotificationsPage from './pages/NotificationsPage';
import SendNotificationPage from './pages/SendNotificationPage';
import AgentCollectionsReport from './pages/AgentCollectionsReport';
import UpgradeManagementPage from './pages/UpgradeManagementPage';
import AppUpdatePage from './pages/AppUpdatePage';

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  const userRole = user?.role || user?.Role?.name;
  
  console.log('RoleBasedRedirect: User role:', userRole);
  
  if (userRole === 'agent') {
    console.log('RoleBasedRedirect: Redirecting agent to /agent-dashboard');
    return <Navigate to="/agent-dashboard" replace />;
  } else {
    console.log('RoleBasedRedirect: Redirecting admin/superadmin to /admin/dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/admin/login" />;
  }

  // Check role-based access if requiredRoles is specified
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = user.role || user.Role?.name;
    console.log('ProtectedRoute: Checking roles:', { userRole, requiredRoles });
    if (!requiredRoles.includes(userRole)) {
      console.log('ProtectedRoute: Access denied, redirecting to unauthorized');
      return <Navigate to="/unauthorized" />;
    }
  }

  console.log('ProtectedRoute: Access granted for user:', user.role || user.Role?.name);
  return children;
};

const App = () => {
  const { user } = useAuth();

  console.log('Current user data:', user); // Debug log
  console.log('App component loaded at:', new Date().toLocaleTimeString()); // Test hot reload

  return (
    <div className="min-vh-100 bg-light">
      <Routes>
        {/* Ensure /admin/login and /admin/register are matched first */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/register" element={<RegisterPage />} />
        {/* Redirect old admin URLs to new /admin URLs */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleBasedRedirect />
          </ProtectedRoute>
        } />
        <Route path="/users" element={<Navigate to="/admin/users" replace />} />
        <Route path="/loans" element={<Navigate to="/admin/loans" replace />} />
        <Route path="/expenses" element={<Navigate to="/admin/expenses" replace />} />
        <Route path="/todos" element={<Navigate to="/admin/todos" replace />} />
        <Route path="/roles" element={<Navigate to="/admin/roles" replace />} />
        <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
        <Route path="/support-messages" element={<Navigate to="/admin/support-messages" replace />} />
        <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
        <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/support-help" element={<Navigate to="/admin/support-help" replace />} />
        <Route path="/send-notification" element={<Navigate to="/admin/send-notification" replace />} />
        <Route path="/loans/agent-collections" element={<Navigate to="/admin/loans/agent-collections" replace />} />
        <Route path="/agent-collections" element={<Navigate to="/admin/agent-collections" replace />} />
        
        {/* Protected routes with role-based access */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          }
        />
        
        {/* Admin-only routes with AdminSidebarLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <AdminSidebarLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="loans" element={<LoansPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="roles" element={
            <ProtectedRoute requiredRoles={['superadmin']}>
              <RolesManager />
            </ProtectedRoute>
          } />
          <Route path="reports" element={<CreditReportsPage />} />
          <Route path="support-messages" element={<SupportMessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="support-help" element={<SupportHelpPage />} />
          <Route
            path="send-notification"
            element={
              <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
                <div>
                  <Navbar />
                  <SendNotificationPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="loans/agent-collections" element={<AgentCollectionsReport />} />
          <Route path="agent-collections" element={<Navigate to="loans/agent-collections" replace />} />
          <Route path="upgrade-management" element={
            <ProtectedRoute requiredRoles={['superadmin']}>
              <UpgradeManagementPage />
            </ProtectedRoute>
          } />
          <Route path="app-updates" element={
            <ProtectedRoute requiredRoles={['superadmin']}>
              <AppUpdatePage />
            </ProtectedRoute>
          } />
          <Route path="audit-logs" element={
            <ProtectedRoute requiredRoles={['superadmin']}>
              <AuditLogsPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Agent Dashboard */}
        <Route
          path="/agent-dashboard"
          element={
            <ProtectedRoute requiredRoles={['agent']}>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentDashboard />} />
        </Route>

        {/* Agent routes with AgentLayout */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute requiredRoles={['agent']}>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
                      <Route path="my-loans" element={<MyLoansPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="customers" element={<UsersManager />} />
        </Route>

        {/* User routes with global navbar */}
        <Route
          path="/my-loans"
          element={
            <ProtectedRoute>
              <div>
                <Navbar />
                <MyLoansPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <div>
                <Navbar />
                <NotificationsPage />
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <div className="container py-5">
              <div className="text-center">
                <h1 className="display-4">Unauthorized Access</h1>
                <p className="lead">
                  You don't have permission to access this page.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </button>
              </div>
            </div>
          }
        />
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;

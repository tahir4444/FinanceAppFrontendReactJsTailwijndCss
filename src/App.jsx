import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import AdminLayout from './components/AdminLayout';
import AgentLayout from './components/AgentLayout';
import TodosPage from './pages/TodosPage';
import RolesManager from './pages/RolesManager';
import UsersManager from './pages/UsersManager';
import ExpensesPage from './pages/ExpensesPage';
import LoansPage from './pages/LoansPage.jsx';
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

// Protected Route Component
const ProtectedRoute = ({ children }) => {
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
    return <Navigate to="/login" />;
  }

  return children;
};

const App = () => {
  const { user } = useAuth();

  console.log('Current user data:', user); // Debug log
  console.log('App component loaded at:', new Date().toLocaleTimeString()); // Test hot reload

  return (
    <div className="min-vh-100 bg-light">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes with role-based access */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard route - handles role-based routing internally */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes with AdminSidebarLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminSidebarLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersManager />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/roles" element={<RolesManager />} />
          <Route path="/reports" element={<CreditReportsPage />} />
          <Route path="/support-messages" element={<SupportMessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support-help" element={<SupportHelpPage />} />
          <Route
            path="/send-notification"
            element={
              <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
                <div>
                  <Navbar />
                  <SendNotificationPage />
                </div>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Agent routes with AgentLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/agent-dashboard" element={<AgentDashboard />} />
          <Route path="/agent/my-loans" element={<MyLoansPage />} />
          <Route path="/agent/expenses" element={<ExpensesPage />} />
          <Route path="/agent/notifications" element={<NotificationsPage />} />
          <Route path="/agent/profile" element={<ProfilePage />} />
          <Route path="/agent/settings" element={<SettingsPage />} />
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
      </Routes>
    </div>
  );
};

export default App;

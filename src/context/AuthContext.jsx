import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Only fetch user if we don't already have user data
      if (!user) {
        fetchUser();
      } else {
        setLoading(false);
        setIsAuthenticated(true);
      }
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await authService.getMe();
      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      if (location.pathname !== '/admin/login') {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Login successful', { toastId: 'login-success' });
        
        // Redirect based on user role
        const userRole = response.user?.role || response.user?.Role?.name;
        if (userRole === 'agent') {
          navigate('/agent-dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.dismiss('login-error');
      toast.error(error.response?.data?.message || 'Login failed', { toastId: 'login-error' });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        toast.success('Registration successful', { toastId: 'register-success' });
        
        // Redirect based on user role
        const userRole = response.user?.role || response.user?.Role?.name;
        if (userRole === 'agent') {
          navigate('/agent-dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        throw new Error('Invalid registration response');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.dismiss('register-error');
      toast.error(error.response?.data?.message || 'Registration failed', { toastId: 'register-error' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/admin/login');
      toast.success('Logged out successfully', { toastId: 'logout-success' });
    }
  };

  // Helper to get the user's role regardless of backend structure
  const getUserRole = () => user?.role || user?.Role?.name;

  const hasRole = (roleName) => {
    return getUserRole() === roleName;
  };

  const hasAnyRole = (roleNames) => {
    return roleNames.includes(getUserRole());
  };

  const hasAllRoles = (roleNames) => {
    return roleNames.includes(getUserRole());
  };

  const hasPermission = (resource, action) => {
    if (!user || !user.Role || !user.Role.permissions) {
      return false;
    }
    if (user.Role.name === 'superadmin') {
      return true;
    }
    const permissions = user.Role.permissions || [];
    return permissions.some(
      (p) => p.resource === resource && p.actions.includes(action)
    );
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        hasRole,
        hasAnyRole,
        hasAllRoles,
        hasPermission,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    if (location.pathname !== '/admin/login') {
      navigate('/admin/login');
      return null;
    }
    // If already on /admin/login, allow rendering
    return children;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    navigate('/unauthorized');
    return null;
  }

  return children;
};

export { AuthProvider, useAuth, ProtectedRoute };

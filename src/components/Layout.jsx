import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const Layout = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  // Redirect to login if not authenticated and loading is complete
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-xl font-semibold text-gray-800 dark:text-white">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/'}
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-primary-light dark:hover:text-primary-dark transition-colors"
              >
                Todo App
              </Link>
              {isAuthenticated && (
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  Welcome, {user?.name || user?.email || 'User'}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle Button */}
              <IconButton
                onClick={toggleTheme}
                aria-label="toggle theme"
                color="inherit"
                className="text-gray-700 dark:text-gray-200"
              >
                {theme === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-700 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

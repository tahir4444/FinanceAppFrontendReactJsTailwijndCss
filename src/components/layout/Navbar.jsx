import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
// Remove react-bootstrap imports
// import { Nav, NavDropdown } from 'react-bootstrap';

const Navbar = () => {
  const { user, logout, hasAnyRole, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-2xl text-blue-700 tracking-tight hover:text-purple-600 transition-colors duration-200"
        >
          <span className="bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow">
            M
          </span>
          MyFinanceApp
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/todos">
                    Todos
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/notifications">
                    Notifications
                  </Link>
                </li>
                {user &&
                  (user.role === 'admin' || user.role === 'superadmin') && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/send-notification">
                        Send Notification
                      </Link>
                    </li>
                  )}
                {user &&
                  (user.role === 'admin' ||
                    user.role === 'agent' ||
                    user.role === 'superadmin') && (
                    <li className="nav-item">
                      <Link className="nav-link" to="/loans">
                        Loan
                      </Link>
                    </li>
                  )}
                {user && user.role === 'user' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/my-loans">
                      My Loans
                    </Link>
                  </li>
                )}
                {hasAnyRole(['superadmin', 'admin']) && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/users">
                      Users
                    </Link>
                  </li>
                )}
                {hasPermission('read_reports') && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/reports">
                      Credit Reports
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {user ? (
              <li className="nav-item dropdown" ref={dropdownRef}>
                <button
                  className="nav-link dropdown-toggle d-flex align-items-center gap-2 btn btn-link text-white"
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="d-flex flex-column align-items-end">
                    <span className="fw-bold" style={{ fontSize: '0.9rem' }}>
                      {user.name || user.email}
                    </span>
                    <small
                      className="text-white-50"
                      style={{ fontSize: '0.75rem' }}
                    >
                      {user.role || 'User'}
                    </small>
                  </div>
                  <div
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                    style={{
                      width: '32px',
                      height: '32px',
                      color: '#0d6efd',
                      overflow: 'hidden',
                    }}
                  >
                    {user.profile_pic ? (
                      <img
                        src={user.profile_pic}
                        alt="Profile"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <i className="bi bi-person-fill"></i>
                    )}
                  </div>
                </button>
                <div
                  className={`dropdown-menu ${showDropdown ? 'show' : ''}`}
                  style={{
                    right: 0,
                    left: 'auto',
                    minWidth: 220,
                    padding: '0.75rem 1rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: 'none',
                    borderRadius: 16,
                    zIndex: 3000,
                    opacity: showDropdown ? 1 : 0,
                    transform: showDropdown
                      ? 'translateY(0) scale(1)'
                      : 'translateY(-8px) scale(0.98)',
                    transition: 'opacity 0.2s, transform 0.2s',
                    pointerEvents: showDropdown ? 'auto' : 'none',
                  }}
                >
                  <div className="px-3 py-2 mb-2 border-bottom">
                    <div
                      className="fw-bold text-primary"
                      style={{ fontSize: '0.9rem' }}
                    >
                      Account
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {user.email}
                    </div>
                  </div>
                  {isAdmin && (
                    <>
                      <Link
                        className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                        to="/users"
                        onClick={() => setShowDropdown(false)}
                        style={{
                          transition: 'all 0.2s',
                          color: '#495057',
                          fontSize: '0.9rem',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.color = '#0d6efd';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#495057';
                        }}
                      >
                        <i
                          className="bi bi-people-fill"
                          style={{ fontSize: '1rem' }}
                        ></i>
                        User Management
                      </Link>
                      <Link
                        className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                        to="/roles"
                        onClick={() => setShowDropdown(false)}
                        style={{
                          transition: 'all 0.2s',
                          color: '#495057',
                          fontSize: '0.9rem',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.color = '#0d6efd';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#495057';
                        }}
                      >
                        <i
                          className="bi bi-shield-lock-fill"
                          style={{ fontSize: '1rem' }}
                        ></i>
                        Roles Management
                      </Link>
                      <Link
                        className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                        to="/support-messages"
                        onClick={() => setShowDropdown(false)}
                        style={{
                          transition: 'all 0.2s',
                          color: '#495057',
                          fontSize: '0.9rem',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.color = '#0d6efd';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#495057';
                        }}
                      >
                        <i
                          className="bi bi-chat-dots-fill"
                          style={{ fontSize: '1rem' }}
                        ></i>
                        Support Messages
                      </Link>
                    </>
                  )}
                  <Link
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      transition: 'all 0.2s',
                      color: '#495057',
                      fontSize: '0.9rem',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.color = '#0d6efd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#495057';
                    }}
                  >
                    <i
                      className="bi bi-person-circle"
                      style={{ fontSize: '1rem' }}
                    ></i>
                    Profile Settings
                  </Link>
                  <Link
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                    to="/expenses"
                    onClick={() => setShowDropdown(false)}
                    style={{
                      transition: 'all 0.2s',
                      color: '#495057',
                      fontSize: '0.9rem',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.color = '#0d6efd';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#495057';
                    }}
                  >
                    <i
                      className="bi bi-cash-stack"
                      style={{ fontSize: '1rem' }}
                    ></i>
                    Expense Manager
                  </Link>
                  <div className="dropdown-divider my-2"></div>
                  <button
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded"
                    onClick={() => {
                      setShowDropdown(false);
                      handleLogout();
                    }}
                    style={{
                      transition: 'all 0.2s',
                      color: '#dc3545',
                      fontSize: '0.9rem',
                      border: 'none',
                      background: 'transparent',
                      width: '100%',
                      textAlign: 'left',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff5f5';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <i
                      className="bi bi-box-arrow-right"
                      style={{ fontSize: '1rem' }}
                    ></i>
                    Logout
                  </button>
                </div>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  Login
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

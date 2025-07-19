import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiCreditCard,
  FiFileText,
  FiCheckSquare,
  FiBarChart2,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiCalendar,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios';

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [agentCount, setAgentCount] = useState(null);
  const [agentLoading, setAgentLoading] = useState(true);
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [acceptedLoans, setAcceptedLoans] = useState(null);
  const [acceptedLoansLoading, setAcceptedLoansLoading] = useState(true);
  const [expenses, setExpenses] = useState(null);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [tasks, setTasks] = useState({
    total: null,
    completed: null,
    pending: null,
  });
  const [tasksLoading, setTasksLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({});
  const [dashboardStatsLoading, setDashboardStatsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setUserLoading(true);
    setAgentLoading(true);
    setRevenueLoading(true);
    setAcceptedLoansLoading(true);
    setExpensesLoading(true);
    setTasksLoading(true);
    setDashboardStatsLoading(true);
    axiosInstance
      .get('/users?role=user')
      .then((response) => {
        setUserCount(response.data.total || 0);
        setUserLoading(false);
      })
      .catch(() => {
        setUserCount(0);
        setUserLoading(false);
      });
    axiosInstance
      .get('/users?role=agent')
      .then((response) => {
        setAgentCount(response.data.total || 0);
        setAgentLoading(false);
      })
      .catch(() => {
        setAgentCount(0);
        setAgentLoading(false);
      });
    axiosInstance
      .get('/stats/revenue')
      .then((response) => {
        setRevenue(response.data.revenue || 0);
        setRevenueLoading(false);
      })
      .catch(() => {
        setRevenue(0);
        setRevenueLoading(false);
      });
    axiosInstance
      .get('/loans?status=accepted')
      .then((response) => {
        setAcceptedLoans(response.data.total || 0);
        setAcceptedLoansLoading(false);
      })
      .catch(() => {
        setAcceptedLoans(0);
        setAcceptedLoansLoading(false);
      });
    axiosInstance
      .get('/expenses/total')
      .then((response) => {
        setExpenses(response.data.total || 0);
        setExpensesLoading(false);
      })
      .catch(() => {
        setExpenses(0);
        setExpensesLoading(false);
      });
    axiosInstance
      .get('/todos/stats')
      .then((response) => {
        setTasks({
          total: response.data.total || 0,
          completed: response.data.completed || 0,
          pending: response.data.pending || 0,
        });
        setTasksLoading(false);
      })
      .catch(() => {
        setTasks({ total: 0, completed: 0, pending: 0 });
        setTasksLoading(false);
      });
    axiosInstance
      .get('/loans/admin-dashboard')
      .then((response) => {
        setDashboardStats(response.data || {});
        setDashboardStatsLoading(false);
      })
      .catch(() => {
        setDashboardStats({});
        setDashboardStatsLoading(false);
      });
  }, [isAuthenticated, navigate]);

  return (
    <>
      {/* Dashboard Content */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, Admin!{' '}
          <span role="img" aria-label="wave">
            👋
          </span>
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your finance application today.
        </p>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Users
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {userLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  userCount
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">+12%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Agent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Agent Users
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {agentLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  agentCount
                )}
              </p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">+5%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {revenueLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${revenue.toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">+8%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Accepted Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Accepted Loans
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {acceptedLoansLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  acceptedLoans
                )}
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-lg">
              <FiCreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">+15%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Expenses</p>
              <p className="text-2xl font-bold text-gray-900">
                {expensesLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${expenses.toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingDown className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-sm font-medium text-red-600">-3%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.total
                )}
              </p>
            </div>
            <div className="p-3 bg-green-500 rounded-lg">
              <FiCheckSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">+10%</span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Completed Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.completed
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Pending Tasks
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.pending
                )}
              </p>
            </div>
            <div className="p-3 bg-yellow-500 rounded-lg">
              <FiClock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Total Principal Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Total Principal Amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${(dashboardStats.totalPrincipal || 0).toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-lg">
              <FiBarChart2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Amount Recovered */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Amount Recovered
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${(dashboardStats.amountRecovered || 0).toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Interest Earned */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Interest Earned
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${(dashboardStats.interestEarned || 0).toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-yellow-600 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Today's EMIs Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Today's EMIs Count
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.todaysEmisCount || 0
                )}
              </p>
            </div>
            <div className="p-3 bg-indigo-600 rounded-lg">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* All Penalties/Charges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                All Penalties/Charges
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${(dashboardStats.totalPenalties || 0).toLocaleString()}`
                )}
              </p>
            </div>
            <div className="p-3 bg-red-600 rounded-lg">
              <FiTrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Overdue EMIs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Overdue EMIs
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.overdueEmisCount || 0
                )}
              </p>
            </div>
            <div className="p-3 bg-orange-600 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Loan Status Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover col-span-1 md:col-span-2 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Loan Status Breakdown
              </p>
              <div className="flex gap-6 mt-2">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  Object.entries(dashboardStats.loanStatusBreakdown || {}).map(
                    ([status, count]) => (
                      <div key={status} className="flex flex-col items-center">
                        <span className="text-lg font-semibold text-gray-800 capitalize">
                          {status}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {count}
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
            <div className="p-3 bg-gray-600 rounded-lg">
              <FiBarChart2 className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      {/* Management Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Loans Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Loans</h3>
            <FiCreditCard className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Accepted Loans</span>
              <span className="font-semibold text-gray-900">
                {acceptedLoansLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  acceptedLoans
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Approval</span>
              <span className="font-semibold text-yellow-600">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.loanStatusBreakdown?.pending || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Amount</span>
              <span className="font-semibold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${(dashboardStats.totalPrincipal || 0).toLocaleString()}`
                )}
              </span>
            </div>
            <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
              Manage Loans
            </button>
          </div>
        </div>
        {/* Expenses Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
            <FiFileText className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-semibold text-gray-900">
                {expensesLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  `₹${expenses.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Claims</span>
              <span className="font-semibold text-yellow-600">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.expensesBreakdown?.pendingClaims || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="font-semibold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.expensesBreakdown?.categories || 0
                )}
              </span>
            </div>
            <button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
              Manage Expenses
            </button>
          </div>
        </div>
        {/* Tasks Management */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tasks</h3>
            <FiCheckSquare className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Tasks</span>
              <span className="font-semibold text-gray-900">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.total
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completed</span>
              <span className="font-semibold text-green-600">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.completed
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">
                {tasksLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  tasks.pending
                )}
              </span>
            </div>
            <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium">
              Manage Tasks
            </button>
          </div>
        </div>
      </div>
      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">John Doe</p>
                  <p className="text-sm text-gray-600">Loan Approved</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹5,000</p>
                  <p className="text-xs text-gray-500">2m ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Jane Smith</p>
                  <p className="text-sm text-gray-600">Payment Received</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹1,200</p>
                  <p className="text-xs text-gray-500">10m ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Bob Lee</p>
                  <p className="text-sm text-gray-600">Expense Added</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹800</p>
                  <p className="text-xs text-gray-500">1h ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                System Status
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  All Systems Operational
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-gray-900">Database</span>
                    <p className="text-sm text-gray-600">Operational</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">99.9% uptime</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-gray-900">
                      API Services
                    </span>
                    <p className="text-sm text-gray-600">Operational</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">100% uptime</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-gray-900">
                      Payment Gateway
                    </span>
                    <p className="text-sm text-gray-600">Operational</p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">99.8% uptime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import React, { useState, useEffect, useRef } from 'react';
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
  FiSettings,
  FiArrowRight,
} from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axios';
import { toast } from 'react-toastify';

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
  const [currentMonthUsers, setCurrentMonthUsers] = useState(0);
  const [lastMonthUsers, setLastMonthUsers] = useState(0);
  const [userPercentChange, setUserPercentChange] = useState(0);
  const [agentPercentChange, setAgentPercentChange] = useState(0);
  const [revenuePercentChange, setRevenuePercentChange] = useState(0);
  const [approvedLoansPercentChange, setApprovedLoansPercentChange] = useState(0);
  const [expensesPercentChange, setExpensesPercentChange] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [recovered, setRecovered] = useState(0);
  const [interest, setInterest] = useState(0);
  const [todaysEmis, setTodaysEmis] = useState(0);
  const [todaysUnpaidEmis, setTodaysUnpaidEmis] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [overdueEmis, setOverdueEmis] = useState(0);
  const [overdueEmisAmount, setOverdueEmisAmount] = useState(0);
  const [interestMetrics, setInterestMetrics] = useState({
    interestCollectedThisMonth: null,
    expectedInterest: null,
    avgInterestRate: null,
    paidInterest: null,
    collectedVsExpected: null,
  });
  const [financialHealth, setFinancialHealth] = useState({
    totalPrincipal: null,
    amountRecovered: null,
    interestEarned: null,
    inflow30: null,
    inflow60: null,
    inflow90: null,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ overall: '', services: [] });
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);
  const [systemStatusError, setSystemStatusError] = useState(null);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeProgress, setUpgradeProgress] = useState(0);
  const [upgradeState, setUpgradeState] = useState('idle'); // idle | fail | success | in_progress
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const updateToastShown = useRef(false);
  const upgradeTimerRef = useRef(null);

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
    // Fetch monthly user stats for percentage
    axiosInstance.get('/users/stats/monthly').then(res => {
      setCurrentMonthUsers(res.data.currentMonthCount || 0);
      setLastMonthUsers(res.data.lastMonthCount || 0);
      const last = res.data.lastMonthCount || 0;
      const curr = res.data.currentMonthCount || 0;
      const percent = last ? ((curr - last) / last) * 100 : 0;
      setUserPercentChange(percent);
    }).catch(() => {
      setCurrentMonthUsers(0);
      setLastMonthUsers(0);
      setUserPercentChange(0);
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
        setRevenue(response.data.totalRevenue || 0);
        setRevenueLoading(false);
      })
      .catch(() => {
        setRevenue(0);
        setRevenueLoading(false);
      });
    axiosInstance
      .get('/loans?status=approved')
      .then((response) => {
        setAcceptedLoans(response.data.total || 0);
        setAcceptedLoansLoading(false);
      })
      .catch(() => {
        setAcceptedLoans(0);
        setAcceptedLoansLoading(false);
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
    // Fetch admin dashboard stats for principal, recovered, interest, etc.
    axiosInstance.get('/loans/admin-dashboard').then(res => {
      setPrincipal(res.data.totalPrincipal || 0);
      setRecovered(res.data.amountRecovered || 0);
      setInterest(res.data.interestEarned || 0);
      setTodaysEmis(res.data.todaysEmisCount || 0);
      setTodaysUnpaidEmis(res.data.todaysUnpaidEmisCount || 0);
      setPenalties(res.data.totalPenalties || 0);
      setOverdueEmis(res.data.overdueEmisCount || 0);
      setOverdueEmisAmount(res.data.overdueEmisAmount || 0);
      setDashboardStats((prev) => ({ ...prev, ...res.data }));
      setDashboardStatsLoading(false);
    }).catch(() => {
      setPrincipal(0);
      setRecovered(0);
      setInterest(0);
      setTodaysEmis(0);
      setTodaysUnpaidEmis(0);
      setPenalties(0);
      setOverdueEmis(0);
      setOverdueEmisAmount(0);
      setDashboardStats({});
      setDashboardStatsLoading(false);
    });
    // Fetch /expenses/dashboard for pendingClaims and categories
    axiosInstance.get('/expenses/dashboard').then(res => {
      setDashboardStats((prev) => ({ ...prev, ...res.data }));
    }).catch(() => {
      // Silently fail for expenses dashboard
    });
    // Fetch agent users monthly stats
    axiosInstance.get('/users/stats/agents/monthly').then(res => {
      const last = res.data.lastMonthCount || 0;
      const curr = res.data.currentMonthCount || 0;
      const percent = last ? ((curr - last) / last) * 100 : 0;
      setAgentPercentChange(percent);
    }).catch(() => {
      setAgentPercentChange(0);
    });
    // Fetch revenue monthly stats
    axiosInstance.get('/stats/revenue/monthly').then(res => {
      const last = res.data.lastMonth || 0;
      const curr = res.data.currentMonth || 0;
      const percent = last ? ((curr - last) / last) * 100 : 0;
      setRevenuePercentChange(percent);
    }).catch(() => {
      setRevenuePercentChange(0);
    });
    // Fetch approved loans monthly stats
    axiosInstance.get('/stats/loans/approved/monthly').then(res => {
      const last = res.data.lastMonth || 0;
      const curr = res.data.currentMonth || 0;
      const percent = last ? ((curr - last) / last) * 100 : 0;
      setApprovedLoansPercentChange(percent);
    }).catch(() => {
      setApprovedLoansPercentChange(0);
    });
    // Fetch expenses monthly stats
    axiosInstance.get('/stats/expenses/monthly').then(res => {
      const last = res.data.lastMonth || 0;
      const curr = res.data.currentMonth || 0;
      setExpenses(curr); // Set the current month's expenses value
      const percent = last ? ((curr - last) / last) * 100 : 0;
      setExpensesPercentChange(percent);
      setExpensesLoading(false);
    }).catch(() => {
      setExpenses(0);
      setExpensesLoading(false);
    });
    // Fetch interest metrics alternatives
    axiosInstance.get('/stats/interest-metrics').then(res => {
      setInterestMetrics(res.data);
    }).catch(() => {
      setInterestMetrics({
        interestCollectedThisMonth: 0,
        expectedInterest: 0,
        avgInterestRate: 0,
        paidInterest: 0,
        collectedVsExpected: 0,
      });
    });
    // Fetch financial health metrics
    axiosInstance.get('/loans/financial-health').then(res => {
      setFinancialHealth(res.data);
    }).catch(() => {
      setFinancialHealth({
        totalPrincipal: 0,
        amountRecovered: 0,
        interestEarned: 0,
        inflow30: 0,
        inflow60: 0,
        inflow90: 0,
      });
    });
    setRecentLoading(true);
    axiosInstance
      .get('/loans/dashboard/admin/recent-activities')
      .then((res) => {
        // Flatten and normalize activities for display
        const activities = [];
        (res.data.recentLoans || []).forEach((loan) => {
          activities.push({
            type: 'loan',
            user: loan.customer?.name || 'Unknown',
            detail: 'Loan Approved',
            amount: loan.loan_amount,
            time: loan.created_at,
            color: 'green',
          });
        });
        (res.data.recentPayments || []).forEach((emi) => {
          activities.push({
            type: 'payment',
            user: emi.customer_name || 'Payment',
            detail: 'Payment Received',
            amount: emi.amount,
            time: emi.paid_at,
            color: 'green',
          });
        });
        (res.data.recentBounces || []).forEach((emi) => {
          activities.push({
            type: 'bounce',
            user: emi.customer_name || 'Payment',
            detail: 'EMI Bounced',
            amount: emi.amount,
            time: emi.updated_at,
            color: 'red',
          });
        });
        (res.data.recentUsers || []).forEach((user) => {
          activities.push({
            type: 'user',
            user: user.name || 'New User',
            detail: 'User Registered',
            amount: null,
            time: user.created_at,
            color: 'blue',
          });
        });
        // Sort by time desc, take top 8
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        setRecentActivities(activities.slice(0, 8));
        setRecentLoading(false);
      })
      .catch((err) => {
        setRecentError('Failed to load recent activity');
        setRecentLoading(false);
      });
    setSystemStatusLoading(true);
    axiosInstance.get('/stats/system/status')
      .then(res => {
        setSystemStatus(res.data);
        setSystemStatusLoading(false);
      })
      .catch(() => {
        setSystemStatusError('Failed to load system status');
        setSystemStatusLoading(false);
      });
    // Fetch update status
    axiosInstance.get('/update-status').then(res => {
      setUpdateStatus(res.data);
      const role = user?.role || user?.Role?.name;
      setIsSuperadmin(role === 'superadmin');
      setIsAdmin(role === 'admin');
      // Show notification if update is required, but only once
      if (
        (res.data.status === 'required' || res.data.status === 'permitted') &&
        !updateToastShown.current
      ) {
        toast.info('A new app update is available!', { toastId: 'update-available' });
        updateToastShown.current = true;
      }
    }).catch(() => {
      setUpdateStatus({ status: 'unknown' });
      setIsSuperadmin(false);
      setIsAdmin(false);
    });
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (upgradeState === 'success') {
      toast.success('App has been updated successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    }
  }, [upgradeState]);

  const handleRequestUpgrade = async () => {
    if (upgradeState === 'in_progress') return; // Prevent multiple upgrades
    setShowUpgradeModal(true);
    setUpgradeState('in_progress');
    setUpgradeProgress(0);
    let duration = 5000;
    let permitted = (updateStatus.status === 'permitted');
    if (permitted) duration = 10000;
    let elapsed = 0;
    if (upgradeTimerRef.current) clearInterval(upgradeTimerRef.current);
    upgradeTimerRef.current = setInterval(() => {
      elapsed += 100;
      setUpgradeProgress(Math.min(100, (elapsed / duration) * 100));
      if (elapsed >= duration) {
        clearInterval(upgradeTimerRef.current);
        upgradeTimerRef.current = null;
        if (!permitted) {
          setUpgradeState('fail');
          setTimeout(() => setShowUpgradeModal(false), 2000);
          toast.error('Update failed: Permission not granted by superadmin.');
        } else {
          setUpgradeState('success');
          setTimeout(() => setShowUpgradeModal(false), 2000);
          axiosInstance.post('/update-status', { status: 'up_to_date' }).then(() => {
            axiosInstance.get('/update-status').then(res => setUpdateStatus(res.data));
          });
        }
      }
    }, 100);
    // Only call backend if permitted
    if (permitted) {
      try {
        await axiosInstance.post('/update-status', { status: 'in_progress' });
      } catch (e) {
        setUpgradeState('fail');
        if (upgradeTimerRef.current) clearInterval(upgradeTimerRef.current);
        upgradeTimerRef.current = null;
        setTimeout(() => setShowUpgradeModal(false), 2000);
        toast.error('Failed to start upgrade. Please try again.');
        return;
      }
    }
  };

  const handleApproveUpgrade = async () => {
    await axiosInstance.post('/update-status', { status: 'permitted' });
    toast.success('Upgrade permitted for admin.');
    axiosInstance.get('/update-status').then(res => setUpdateStatus(res.data));
  };

  const handleManageLoans = () => navigate('/loans');
  const handleManageExpenses = () => navigate('/expenses');
  const handleManageTasks = () => navigate('/todos');
  const handleAgentCollections = () => navigate('/loans/agent-collections');

  useEffect(() => {
    return () => {
      if (upgradeTimerRef.current) clearInterval(upgradeTimerRef.current);
    };
  }, []);

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
        {/* Agent Collections Quick Link */}
        <div 
          className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-sm border border-gray-200 p-6 card-hover cursor-pointer transform transition-all duration-200 hover:scale-105"
          onClick={handleAgentCollections}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-white mb-1">
                Agent Collections
              </p>
              <p className="text-2xl font-bold text-white">
                Quick Access
              </p>
            </div>
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FiCreditCard className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiArrowRight className="w-4 h-4 text-white mr-1" />
            <span className="text-sm font-medium text-white">
              View Collections
            </span>
          </div>
        </div>
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
            <span className="text-sm font-medium text-green-600">
              {userPercentChange > 0 ? '+' : ''}{userPercentChange.toFixed(1)}%
            </span>
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
            <span className="text-sm font-medium text-green-600">
              {agentPercentChange > 0 ? '+' : ''}{agentPercentChange.toFixed(1)}%
            </span>
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
            <span className="text-sm font-medium text-green-600">
              {revenuePercentChange > 0 ? '+' : ''}{revenuePercentChange.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>
        {/* Approved Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Approved Loans</p>
              <p className="text-2xl font-bold text-gray-900">
                {acceptedLoansLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  acceptedLoans
                )}
              </p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              {approvedLoansPercentChange > 0 ? '+' : ''}{approvedLoansPercentChange.toFixed(1)}%
            </span>
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
                  `₹${expenses?.toLocaleString?.() ?? expenses}`
                )}
              </p>
            </div>
            <div className="p-3 bg-red-500 rounded-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex items-center">
            <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm font-medium text-green-600">
              {expensesPercentChange > 0 ? '+' : ''}{expensesPercentChange.toFixed(1)}%
            </span>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Total Principal Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{principal.toLocaleString()}</p>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Amount Recovered</p>
              <p className="text-2xl font-bold text-gray-900">₹{recovered.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-600 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Today's EMIs Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Today's EMIs Count</p>
              <p className="text-2xl font-bold text-gray-900">{todaysEmis}</p>
            </div>
            <div className="p-3 bg-indigo-600 rounded-lg">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* EMIs Due Today (Unpaid) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">EMIs Due Today (Unpaid)</p>
              <p className="text-2xl font-bold text-gray-900">{todaysUnpaidEmis}</p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-lg">
              <FiClock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* All Penalties/Charges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">All Penalties/Charges</p>
              <p className="text-2xl font-bold text-gray-900">₹{penalties.toLocaleString()}</p>
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
              <p className="text-sm font-medium text-gray-600 mb-1">Overdue EMIs</p>
              <p className="text-2xl font-bold text-gray-900">{overdueEmis}</p>
              <p className="text-xs text-gray-500">Amount: ₹{overdueEmisAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-600 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        {/* Financial Health: Interest vs Principal Recovery */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Interest vs Principal Recovery</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Principal Recovered:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.totalPrincipal !== null ? financialHealth.totalPrincipal.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Interest Earned:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.interestEarned !== null ? financialHealth.interestEarned.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Recovered:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.amountRecovered !== null ? financialHealth.amountRecovered.toLocaleString() : '--'}</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-indigo-500 rounded-lg ml-6">
            <FiBarChart2 className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Financial Health: Cash Flow Projection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Cash Flow Projection</p>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Next 30 days:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.inflow30 !== null ? financialHealth.inflow30.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Next 60 days:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.inflow60 !== null ? financialHealth.inflow60.toLocaleString() : '--'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Next 90 days:</span>
                <span className="font-bold text-2xl text-gray-900">₹{financialHealth.inflow90 !== null ? financialHealth.inflow90.toLocaleString() : '--'}</span>
              </div>
            </div>
          </div>
          <div className="p-3 bg-green-500 rounded-lg ml-6">
            <FiTrendingUp className="w-6 h-6 text-white" />
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
            <button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              onClick={handleManageLoans}
            >
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
                  `₹${expenses?.toLocaleString?.() ?? expenses}`
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pending Claims</span>
              <span className="font-semibold text-yellow-600">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.pendingClaims ?? '-'
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Categories</span>
              <span className="font-semibold text-gray-900">
                {dashboardStatsLoading ? (
                  <span className="animate-pulse">-</span>
                ) : (
                  dashboardStats.categories ?? '-'
                )}
              </span>
            </div>
            <button className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              onClick={handleManageExpenses}
            >
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
            <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
              onClick={handleManageTasks}
            >
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
            {recentLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : recentError ? (
              <div className="text-red-500">{recentError}</div>
            ) : recentActivities.length === 0 ? (
              <div className="text-gray-500">No recent activity.</div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        activity.color === 'green'
                          ? 'bg-green-500'
                          : activity.color === 'yellow'
                          ? 'bg-yellow-500'
                          : activity.color === 'red'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.user}</p>
                      <p className="text-sm text-gray-600">{activity.detail}</p>
                    </div>
                    <div className="text-right">
                      {activity.amount !== null && (
                        <p className="font-medium text-gray-900">₹{Number(activity.amount).toLocaleString()}</p>
                      )}
                      <p className="text-xs text-gray-500">{dayjs(activity.time).fromNow()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  {systemStatusLoading ? 'Loading...' : systemStatusError ? 'Error' : systemStatus.overall}
                </span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {systemStatusLoading ? (
              <div className="text-gray-500">Loading...</div>
            ) : systemStatusError ? (
              <div className="text-red-500">{systemStatusError}</div>
            ) : (
              <div className="space-y-4">
                {systemStatus.services.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium text-gray-900">{service.name}</span>
                        <p className="text-sm text-gray-600">{service.status}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">{service.uptime} uptime</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* App Upgrade Notification/Modal */}
      {updateStatus && (
        <div className="mb-6 mt-10 p-6 bg-gradient-to-r from-yellow-50 via-yellow-100 to-yellow-50 border-l-8 border-yellow-400 shadow-lg rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 min-w-[350px] w-full">
          <div className="flex items-center gap-4 flex-1 min-w-[250px]">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-200 border-4 border-yellow-400 shadow">
              <FiSettings className="w-8 h-8 text-yellow-700" />
            </div>
            <div className="min-w-[200px]">
              {(() => {
                // Support both snake_case and camelCase for backend compatibility
                const currentVersion = (updateStatus.current_version ?? updateStatus.currentVersion ?? '').trim() || '1.0.0';
                const requiredVersion = (updateStatus.required_version ?? updateStatus.requiredVersion ?? '').trim() || '';
                const status = updateStatus.status ?? updateStatus.Status ?? '';
                return (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-yellow-900">App Version</span>
                      <span className="inline-block px-2 py-0.5 text-xs font-bold bg-gray-200 text-gray-700 rounded-full border border-gray-300">{currentVersion}</span>
                      {requiredVersion && requiredVersion !== currentVersion && (
                        <>
                          <FiArrowRight className="w-4 h-4 text-yellow-600 mx-1" />
                          <span className="inline-block px-2 py-0.5 text-xs font-bold bg-yellow-300 text-yellow-900 rounded-full border border-yellow-400 animate-pulse">{requiredVersion}</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm text-yellow-800 mb-2">
                      {status === 'required' && requiredVersion && requiredVersion !== currentVersion && 'A new update is available and requires superadmin approval.'}
                      {status === 'permitted' && requiredVersion && requiredVersion !== currentVersion && 'Update permitted by superadmin. You can now update.'}
                      {(!requiredVersion || requiredVersion === currentVersion) && 'Your app is up to date.'}
                    </div>
                    {/* Version selection dropdown for admin */}
                    {isAdmin && (
                      <div className="mt-1 min-w-[180px]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Select Version to Update:</label>
                        <select
                          className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
                          value={requiredVersion && requiredVersion !== currentVersion ? requiredVersion : currentVersion}
                          onChange={() => {}} // keep enabled for UI consistency
                          disabled={!requiredVersion || requiredVersion === currentVersion}
                        >
                          <option value={currentVersion}>Current: {currentVersion}</option>
                          {requiredVersion && requiredVersion !== currentVersion && (
                            <option value={requiredVersion}>Update: {requiredVersion}</option>
                          )}
                        </select>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isAdmin && (updateStatus.required_version ?? updateStatus.requiredVersion ?? '').trim() && (updateStatus.required_version ?? updateStatus.requiredVersion) !== (updateStatus.current_version ?? updateStatus.currentVersion) && (
              <button
                className={`px-6 py-2 rounded-lg font-semibold shadow transition-colors text-white ${(updateStatus.status ?? updateStatus.Status) === 'required' || (updateStatus.status ?? updateStatus.Status) === 'permitted' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' : 'bg-gray-300 cursor-not-allowed'}`}
                onClick={handleRequestUpgrade}
                disabled={upgradeState === 'in_progress'}
              >
                {upgradeState === 'in_progress' ? 'Updating...' : (updateStatus.status ?? updateStatus.Status) === 'required' || (updateStatus.status ?? updateStatus.Status) === 'permitted' ? 'Update Now' : 'Up to Date'}
              </button>
            )}
            {isSuperadmin && (updateStatus.status ?? updateStatus.Status) === 'required' && (updateStatus.required_version ?? updateStatus.requiredVersion ?? '').trim() && (updateStatus.required_version ?? updateStatus.requiredVersion) !== (updateStatus.current_version ?? updateStatus.currentVersion) && (
              <button
                className="px-6 py-2 rounded-lg font-semibold shadow bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                onClick={handleApproveUpgrade}
              >
                <FiCheckCircle className="inline-block mr-2 -mt-1" /> Approve Upgrade
              </button>
            )}
          </div>
        </div>
      )}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{upgradeState === 'fail' ? 'Upgrade Failed' : upgradeState === 'success' ? 'Upgrade Successful' : 'Processing Upgrade...'}</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full ${upgradeState === 'fail' ? 'bg-red-500' : upgradeState === 'success' ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${upgradeProgress}%` }}
              ></div>
            </div>
            {upgradeState === 'fail' && <div className="text-red-600">Update failed: Permission not granted by superadmin.</div>}
            {upgradeState === 'success' && <div className="text-green-600">Upgrade completed successfully!</div>}
            {upgradeState === 'in_progress' && <div className="text-gray-600">Please wait while the upgrade is processed...</div>}
          </div>
        </div>
      )}
    </>
  );
}

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  getExpenses,
  createExpense,
  getUsersForDropdown,
} from '../services/expense.service';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ExpenseTable from '../components/expenses/ExpenseTable';
import ExpenseForm from '../components/expenses/ExpenseForm';
import { FaFilter, FaSyncAlt } from 'react-icons/fa';
import {
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiPlus,
  FiDownload,
  FiSearch,
} from 'react-icons/fi';
import Select from 'react-select';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const ExpensesPage = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [form, setForm] = useState({
    expense_name: '',
    reason: '',
    amount_paid: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const observer = useRef();
  const sentinelRef = useRef();
  const [search, setSearch] = useState('');
  const searchTimeout = useRef();
  const filtersRef = useRef({
    search: '',
    selectedUser: '',
    startDate: null,
    endDate: null,
  });
  const [total, setTotal] = useState(0);

  // Calculate stats
  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce(
      (sum, expense) => sum + (parseFloat(expense.amount_paid) || 0),
      0
    ),
    thisMonth: expenses
      .filter((expense) => {
        const expenseDate = new Date(expense.created_at);
        const now = new Date();
        return (
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, expense) => sum + (parseFloat(expense.amount_paid) || 0),
        0
      ),
    averageAmount:
      expenses.length > 0
        ? expenses.reduce(
            (sum, expense) => sum + (parseFloat(expense.amount_paid) || 0),
            0
          ) / expenses.length
        : 0,
  };

  // Modified fetchExpenses to support append and search
  const fetchExpenses = async (
    pageNum = 1,
    append = false,
    searchTerm,
    userId,
    sDate,
    eDate
  ) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: 20 };
      if (sDate && eDate) {
        const start = new Date(sDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(eDate);
        end.setHours(23, 59, 59, 999);
        params.startDate = start.toISOString();
        params.endDate = end.toISOString();
      }
      if (userId) {
        params.userId = userId;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const res = await getExpenses(params);
      if (append) {
        setExpenses((prev) => [...prev, ...(res.data.expenses || res.data)]);
      } else {
        setExpenses(res.data.expenses || res.data);
      }
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.totalExpenses || 0);
    } catch (err) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      filtersRef.current = {
        search,
        selectedUser,
        startDate,
        endDate,
      };
      setPage(1);
      setExpenses([]);
      fetchExpenses(1, false, search, selectedUser, startDate, endDate);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search, selectedUser, startDate, endDate]);

  // Infinite scroll: fetch next page when sentinel is visible
  const lastExpenseElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, page, totalPages]
  );

  // Fetch on page change (infinite scroll)
  useEffect(() => {
    if (page === 1) return; // Already handled by search/filter effect
    const { search, selectedUser, startDate, endDate } = filtersRef.current;
    fetchExpenses(page, true, search, selectedUser, startDate, endDate);
  }, [page]);

  // Reset page and expenses on filter/search change (except search, which is handled above)
  useEffect(() => {
    if (!searchTimeout.current) {
      filtersRef.current = {
        search,
        selectedUser,
        startDate,
        endDate,
      };
      setPage(1);
      setExpenses([]);
      fetchExpenses(1, false, search, selectedUser, startDate, endDate);
    }
  }, [startDate, endDate, selectedUser, user]);

  const fetchUsers = async () => {
    try {
      const res = await getUsersForDropdown();
      const list = Array.isArray(res.data) ? res.data : res;
      // Exclude superadmin users from dropdown
      const filtered = list.filter((u) => {
        const role = (u.Role?.name || u.role || '').toString().toLowerCase();
        return role !== 'superadmin';
      });
      setUsers(filtered);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
  };

  useEffect(() => {
    if (user) {
      if (user.role === 'agent') {
        // If user is an agent, set the filter to their ID and don't fetch other users.
        setSelectedUser(user.id);
        // For agents, immediately fetch their expenses
        fetchExpenses(1, false, '', user.id, null, null);
      } else {
        // If user is not an agent (e.g., admin), fetch all users for the dropdown.
        fetchUsers();
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.expense_name.trim() || !form.reason.trim() || !form.amount_paid) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await createExpense(form);
      toast.success('Expense added');
      setShowForm(false);
      setForm({ expense_name: '', reason: '', amount_paid: '' });
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    if (user?.role === 'agent') {
      setSelectedUser(user.id); // Keep agent's ID for agents
    } else {
      setSelectedUser('');
    }
    setSearch('');
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Expense Management
            </h1>
            <p className="text-gray-600">
              Track and manage all expenses, monitor spending patterns, and
              generate reports.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.thisMonth.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Average Amount
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{stats.averageAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters Section */}
      {user?.role === 'agent' ? (
        /* Agent Filters - Modern Card Style */
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 mb-6">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <FaFilter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">My Expenses</h3>
                  <p className="text-sm text-gray-600">Filter and search your expense records</p>
                </div>
              </div>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <FaSyncAlt className="w-4 h-4 mr-2" />
                Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search Filter - Modern Style */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FiSearch className="w-4 h-4 inline mr-2 text-blue-500" />
                  Search Expenses
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search expenses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-4 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-200"></div>
                  </div>
                </div>
              </div>

              {/* Date Range Filter - Combined Style */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <FiCalendar className="w-4 h-4 inline mr-2 text-blue-500" />
                  Date Range
                </label>
                <div className="flex space-x-1">
                  {/* From Date */}
                  <div className="relative group w-50">
                    <DatePicker
                      selected={startDate}
                      onChange={(date) => setStartDate(date)}
                      className="w-full pl-4 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                      placeholderText="Start date"
                      dateFormat="dd/MM/yyyy"
                      maxDate={endDate || new Date()}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiCalendar className="w-4 h-4 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="relative group w-50">
                    <DatePicker
                      selected={endDate}
                      onChange={(date) => setEndDate(date)}
                      className="w-full pl-4 pr-10 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                      placeholderText="End date"
                      dateFormat="dd/MM/yyyy"
                      minDate={startDate}
                      maxDate={new Date()}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiCalendar className="w-4 h-4 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display - Modern Style */}
            {((search && search.trim() !== '') || startDate || endDate) && (
              <div className="mt-6 pt-6 border-t border-blue-200">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
                  <div className="flex flex-wrap gap-3">
                    {search && search.trim() !== '' && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <FiSearch className="w-3 h-3 mr-1.5" />
                        "{search}"
                        <button
                          onClick={() => setSearch('')}
                          className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {startDate && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                        <FiCalendar className="w-3 h-3 mr-1.5" />
                        From: {dayjs(startDate).format('DD/MM/YYYY')}
                        <button
                          onClick={() => setStartDate(null)}
                          className="ml-2 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-0.5 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {endDate && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        <FiCalendar className="w-3 h-3 mr-1.5" />
                        To: {dayjs(endDate).format('DD/MM/YYYY')}
                        <button
                          onClick={() => setEndDate(null)}
                          className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Admin Filters - Original Layout */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaFilter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              </div>
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <FaSyncAlt className="w-3 h-3 mr-1.5" />
                Clear All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
              {/* Search Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Search Expenses
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* User Filter - Only show for admins */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Filter by User
                </label>
                <div className="relative">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none bg-white"
                  >
                    <option value="">All Users</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="w-full pr-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Select start date"
                    dateFormat="dd/MM/yyyy"
                    maxDate={endDate || new Date()}
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative">
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="w-full pr-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholderText="Select end date"
                    dateFormat="dd/MM/yyyy"
                    minDate={startDate}
                    maxDate={new Date()}
                  />
                  <div className="absolute inset-y-0 right-1 flex items-center pointer-events-none">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Filters Display for Admins */}
            {((search && search.trim() !== '') || selectedUser || startDate || endDate) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {search && search.trim() !== '' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Search: "{search}"
                        <button
                          onClick={() => setSearch('')}
                          className="ml-1.5 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedUser && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        User: {users.find(u => u.id == selectedUser)?.name || 'Unknown'}
                        <button
                          onClick={() => setSelectedUser('')}
                          className="ml-1.5 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {startDate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        From: {dayjs(startDate).format('DD/MM/YYYY')}
                        <button
                          onClick={() => setStartDate(null)}
                          className="ml-1.5 text-yellow-600 hover:text-yellow-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {endDate && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        To: {dayjs(endDate).format('DD/MM/YYYY')}
                        <button
                          onClick={() => setEndDate(null)}
                          className="ml-1.5 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense, index) => (
                <tr key={expense.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.expense_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{parseFloat(expense.amount_paid).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.user_name || expense.User?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {expense.created_at
                        ? new Date(expense.created_at).toLocaleDateString()
                        : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {expenses.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="text-gray-500">No expenses found</div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Name
                  </label>
                  <input
                    type="text"
                    name="expense_name"
                    value={form.expense_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter expense name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reason for expense"
                    rows="3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount_paid"
                    value={form.amount_paid}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpensesPage;

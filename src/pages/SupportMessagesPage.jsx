import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllSupportMessages,
  updateSupportMessageStatus,
} from '../services/support.service';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { FiMail, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

// Define status options
const STATUS_OPTIONS = ['Pending', 'In-Progress', 'Resolved'];
const STATUS_ICONS = {
  'Pending': <FiClock className="w-6 h-6" />,
  'In-Progress': <FiAlertCircle className="w-6 h-6" />,
  'Resolved': <FiCheckCircle className="w-6 h-6" />,
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'Resolved':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✓',
        bgGradient: 'from-green-50 to-green-100',
        dotColor: 'bg-green-500',
      };
    case 'In-Progress':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳',
        bgGradient: 'from-yellow-50 to-yellow-100',
        dotColor: 'bg-yellow-500',
      };
    case 'Pending':
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: '⏰',
        bgGradient: 'from-gray-50 to-gray-100',
        dotColor: 'bg-gray-500',
      };
  }
};

const ITEMS_PER_PAGE = 10;

const SupportMessagesPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const fetchMessages = async (pageNum, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await getAllSupportMessages(
        pageNum,
        ITEMS_PER_PAGE,
        filters
      );

      let rows = [];
      if (Array.isArray(response)) {
        rows = response;
      } else if (Array.isArray(response?.rows)) {
        rows = response.rows;
      } else if (Array.isArray(response?.messages)) {
        rows = response.messages;
      } else {
        rows = [];
      }

      if (pageNum === 1) {
        setMessages(rows);
      } else {
        setMessages((prev) => [...prev, ...rows]);
      }

      setTotalRecords(response.count || rows.length || 0);
      setTotalPages(Math.ceil((response.count || rows.length || 0) / ITEMS_PER_PAGE));
      setHasMore(rows.length === ITEMS_PER_PAGE);
    } catch (error) {
      toast.error('Failed to fetch support messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setMessages([]);
    fetchMessages(1);
  }, [filters]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMessages(nextPage, true);
  };

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      await updateSupportMessageStatus(messageId, newStatus);
      toast.success('Status updated successfully');
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      );
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          You don't have permission to view this page.
        </div>
      </div>
    );
  }

  const startRecord = messages.length > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endRecord = messages.length > 0 ? startRecord + messages.length - 1 : 0;

  return (
    <>
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-lg text-white">
            <FiMail className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Support Messages</h1>
            <p className="text-gray-500 text-base">Manage and respond to user support requests</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
          <div className="text-gray-500">Total Messages</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {STATUS_OPTIONS.map((status) => {
          const count = messages.filter((msg) => msg.status === status).length;
          const config = getStatusConfig(status);
          return (
            <div
              key={status}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover flex items-center justify-between`}
            >
              <div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-gray-600 font-medium">{status}</div>
              </div>
              <div className={`p-3 rounded-lg ml-4 ${status === 'Pending' ? 'bg-gray-400' : status === 'In-Progress' ? 'bg-yellow-400' : 'bg-green-500'} text-white`}>
                {STATUS_ICONS[status]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Messages</label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            placeholder="Search by subject or message..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center my-12">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-blue-600 transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading support messages...
          </div>
        </div>
      ) : (
        <>
          {/* Messages Grid */}
          <div className="space-y-4">
            {messages.map((message, index) => {
              const statusConfig = getStatusConfig(message.status);
              return (
                <div
                  key={message.id}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 flex items-start gap-6"
                >
                  {/* Status Bar */}
                  <div className={`w-2 rounded-xl h-full ${message.status === 'Resolved' ? 'bg-green-500' : message.status === 'In-Progress' ? 'bg-yellow-400' : 'bg-gray-400'}`}></div>
                  {/* Main Content */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                      {/* Move customer name to the very left */}
                      <div className="text-sm text-gray-500 font-medium md:text-left md:min-w-[120px]">{message.user?.name || 'Unknown User'}</div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{message.subject}</h3>
                    </div>
                    <p className="text-gray-600 line-clamp-2 mb-3">{message.message}</p>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{dayjs(message.createdAt).format('MMM DD, YYYY')}</span>
                        <span>•</span>
                        <span>{dayjs(message.createdAt).format('HH:mm')}</span>
                        <span>•</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs ${statusConfig.color} border`}>{statusConfig.icon} {message.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 md:mt-0">
                        <select
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          value={message.status}
                          onChange={(e) => handleStatusChange(message.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        {/* <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200">
                          Reply
                        </button> */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {messages.length === 0 ? (
            <div className="text-center my-12">
              <div className="bg-gray-50 rounded-xl p-8 border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">📬</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Support Messages</h3>
                <p className="text-gray-500">No messages found matching your current filters.</p>
              </div>
            </div>
          ) : (
            <div className="text-center my-8">
              {hasMore ? (
                <button
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Load More Messages
                    </>
                  )}
                </button>
              ) : (
                <div className="text-gray-500 bg-gray-50 rounded-lg px-6 py-3 inline-block">
                  <span className="font-medium">✨ All caught up!</span> No more messages to load
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
};

export default SupportMessagesPage;

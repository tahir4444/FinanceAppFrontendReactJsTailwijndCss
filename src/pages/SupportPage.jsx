import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getSupportMessages,
  updateSupportMessage,
  deleteSupportMessage,
} from '../services/support.service';
import {
  FiMessageSquare,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiMail,
} from 'react-icons/fi';

const SupportPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculate stats
  const stats = {
    total: messages.length,
    pending: messages.filter((msg) => msg.status === 'pending').length,
    resolved: messages.filter((msg) => msg.status === 'resolved').length,
    inProgress: messages.filter((msg) => msg.status === 'in_progress').length,
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await getSupportMessages();
      setMessages(response.data || response);
    } catch (error) {
      toast.error('Failed to fetch support messages');
      console.error('Error fetching support messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (messageId, newStatus) => {
    try {
      await updateSupportMessage(messageId, { status: newStatus });
      setMessages(
        messages.map((msg) =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      );
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      toast.error('Reply text is required');
      return;
    }

    setSubmitting(true);
    try {
      await updateSupportMessage(selectedMessage.id, {
        status: 'in_progress',
        reply: replyText,
      });
      setMessages(
        messages.map((msg) =>
          msg.id === selectedMessage.id
            ? { ...msg, status: 'in_progress', reply: replyText }
            : msg
        )
      );
      setShowReplyForm(false);
      setSelectedMessage(null);
      setReplyText('');
      toast.success('Reply sent successfully');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteSupportMessage(messageId);
        setMessages(messages.filter((msg) => msg.id !== messageId));
        toast.success('Message deleted successfully');
      } catch (error) {
        toast.error('Failed to delete message');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Support Management
            </h1>
            <p className="text-gray-600">
              Manage customer support messages, track issues, and provide timely
              responses.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiMessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Messages
              </p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <FiClock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.resolved}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Messages Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <div className="flex justify-center items-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <div className="text-center py-8">
                      <FiMessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No support messages
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No support messages found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {message.user_name ||
                          message.User?.name ||
                          'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {message.user_email ||
                          message.User?.email ||
                          'No email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {message.subject || 'No subject'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {message.message || 'No message content'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          message.status
                        )}`}
                      >
                        {getStatusText(message.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {message.created_at
                          ? new Date(message.created_at).toLocaleDateString()
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedMessage(message);
                            setShowReplyForm(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Reply to message"
                        >
                          <FiMail className="w-4 h-4" />
                        </button>
                        <select
                          value={message.status}
                          onChange={(e) =>
                            handleStatusUpdate(message.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete message"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyForm && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Reply to Support Message</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Original Message:
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>From:</strong>{' '}
                {selectedMessage.user_name ||
                  selectedMessage.User?.name ||
                  'Unknown User'}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Subject:</strong>{' '}
                {selectedMessage.subject || 'No subject'}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Message:</strong>{' '}
                {selectedMessage.message || 'No message content'}
              </p>
            </div>
            <form onSubmit={handleReply}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Reply
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your reply..."
                  rows="4"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportPage;

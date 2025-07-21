import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axios';

const statusOptions = [
  { value: 'required', label: 'Required' },
  { value: 'permitted', label: 'Permitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'up_to_date', label: 'Up to Date' },
];

const UpgradeManagementPage = () => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [requiredVersion, setRequiredVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [status, setStatus] = useState('required');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState('');

  // Upgrade history state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVersion, setFilterVersion] = useState('');

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  // Set status to 'required' by default unless editing an existing upgrade
  useEffect(() => {
    if (currentStatus && currentStatus.status) {
      if (['required', 'permitted', 'in_progress'].includes(currentStatus.status)) {
        setStatus(currentStatus.status);
      } else {
        setStatus('required');
      }
    } else {
      setStatus('required');
    }
  }, [currentStatus]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/update-status');
      setCurrentStatus(res.data);
      setRequiredVersion(res.data.required_version || res.data.requiredVersion || '');
      setCurrentVersion(res.data.current_version || res.data.currentVersion || '');
      setStatus(res.data.status || 'required');
      setComments(res.data.comments || '');
    } catch (e) {
      setMessage('Failed to fetch current status');
    }
    setLoading(false);
  };

  const fetchHistory = async (page = 1, user = '', status = '', version = '') => {
    setHistoryLoading(true);
    try {
      const params = { page, limit: 10 };
      if (user) params.userId = user;
      if (status) params.status = status;
      if (version) params.version = version;
      const res = await axiosInstance.get('/update-status/history', { params });
      setHistory(res.data.records || []);
      setHistoryPage(res.data.page || 1);
      setHistoryTotalPages(res.data.totalPages || 1);
    } catch (e) {
      // ignore
    }
    setHistoryLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axiosInstance.post('/update-status', {
        required_version: requiredVersion,
        current_version: currentVersion,
        status,
        comments,
      });
      setMessage('Upgrade status updated successfully!');
      fetchStatus();
      fetchHistory();
    } catch (e) {
      setMessage('Failed to update status');
    }
    setLoading(false);
  };

  // Approve/permit or mark as up_to_date from grid
  const handleGridAction = async (id, action) => {
    setHistoryLoading(true);
    try {
      await axiosInstance.post('/update-status', { status: action });
      fetchStatus();
      fetchHistory(historyPage, filterUser, filterStatus, filterVersion);
    } catch (e) {
      // ignore
    }
    setHistoryLoading(false);
  };

  // Filter handlers
  const handleFilter = () => {
    fetchHistory(1, filterUser, filterStatus, filterVersion);
  };

  return (
    <div className="max-w-5xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Upgrade Management</h2>
      {currentStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <div className="mb-1 text-sm text-gray-700">Current Version: <b>{currentStatus.current_version || currentStatus.currentVersion}</b></div>
          <div className="mb-1 text-sm text-gray-700">Required Version: <b>{currentStatus.required_version || currentStatus.requiredVersion}</b></div>
          <div className="mb-1 text-sm text-gray-700">Status: <b>{currentStatus.status}</b></div>
          <div className="mb-1 text-sm text-gray-700">Comments: <b>{currentStatus.comments || '-'}</b></div>
          <div className="mb-1 text-xs text-gray-400">Last Updated: {currentStatus.last_updated_at ? new Date(currentStatus.last_updated_at).toLocaleString() : '-'}</div>
          <div className="mb-1 text-xs text-gray-400">Updated By: {currentStatus.user?.name || currentStatus.user?.email || currentStatus.user_id || '-'}</div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Version</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={requiredVersion}
            onChange={e => setRequiredVersion(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Version (optional)</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={currentVersion}
            onChange={e => setCurrentVersion(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={status}
            onChange={e => setStatus(e.target.value)}
            required
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 min-h-[60px]"
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Add comments or notes about this upgrade..."
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Set Upgrade Status'}
        </button>
        {message && <div className={`mt-2 text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{message}</div>}
      </form>

      {/* Upgrade History Grid */}
      <div className="mt-10">
        <h3 className="text-xl font-bold mb-4 text-gray-900">Upgrade History</h3>
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Filter by User ID or Email"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded px-3 py-2"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Filter by Version"
            value={filterVersion}
            onChange={e => setFilterVersion(e.target.value)}
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleFilter}>Apply Filters</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">ID</th>
                <th className="px-4 py-2 border-b">Current Version</th>
                <th className="px-4 py-2 border-b">Required Version</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Comments</th>
                <th className="px-4 py-2 border-b">Updated By</th>
                <th className="px-4 py-2 border-b">Updated At</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading ? (
                <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4">No upgrade history found.</td></tr>
              ) : history.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{row.id}</td>
                  <td className="px-4 py-2">{row.current_version || row.currentVersion}</td>
                  <td className="px-4 py-2">{row.required_version || row.requiredVersion}</td>
                  <td className="px-4 py-2">{row.status}</td>
                  <td className="px-4 py-2">{row.comments || '-'}</td>
                  <td className="px-4 py-2">{row.user?.name || row.user?.email || row.userId || '-'}</td>
                  <td className="px-4 py-2">{row.last_updated_at ? new Date(row.last_updated_at).toLocaleString() : '-'}</td>
                  <td className="px-4 py-2">
                    {/* Approval/permit actions for superadmin/admin */}
                    {row.status === 'required' && (
                      <button className="px-3 py-1 bg-green-500 text-white rounded mr-2" onClick={() => handleGridAction(row.id, 'permitted')}>Permit</button>
                    )}
                    {row.status === 'permitted' && (
                      <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => handleGridAction(row.id, 'up_to_date')}>Mark Up to Date</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-end items-center gap-2 mt-4">
          <button disabled={historyPage <= 1} onClick={() => fetchHistory(historyPage - 1, filterUser, filterStatus, filterVersion)} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Prev</button>
          <span>Page {historyPage} of {historyTotalPages}</span>
          <button disabled={historyPage >= historyTotalPages} onClick={() => fetchHistory(historyPage + 1, filterUser, filterStatus, filterVersion)} className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeManagementPage; 
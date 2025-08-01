import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axios';
import dayjs from 'dayjs';
import { FiUsers, FiSearch, FiCalendar, FiCreditCard, FiTrendingUp, FiTrendingDown, FiDownload } from 'react-icons/fi';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';
registerLocale('en-GB', enGB);

const PAGE_SIZE = 20;

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`flex items-center bg-white rounded-2xl shadow p-6 border-l-8 ${color} mb-4 md:mb-0 md:mr-6`}> 
    <div className="p-3 bg-gray-100 rounded-xl mr-4">
      <Icon className="w-7 h-7 text-gray-600" />
    </div>
    <div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-gray-500 font-medium text-sm">{label}</div>
    </div>
  </div>
);

// Utility to export array of objects to CSV
function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  // Flatten and map only relevant fields
  const flatData = data.map(row => ({
    date: row.paid_at ? dayjs(row.paid_at).format('DD-MM-YY') : '-',
    agent_name: row.collector?.name || '',
    agent_mobile: row.collector?.mobile || '',
    customer_name: row.customer?.name || '',
    customer_mobile: row.customer?.mobile || '',
    loan_code: row.loan_code || '',
    loan_number: row.loan_number || '',
    emi_number: row.emi_number || '',
    amount: row.amount || '',
  }));
  const header = Object.keys(flatData[0]);
  const csv = [
    header.join(','),
    ...flatData.map(row => header.map(fieldName => JSON.stringify(row[fieldName] ?? '', (key, value) => value === null ? '' : value)).join(','))
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

const AgentCollectionsReport = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  // Fetch agents and admins for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [agentsRes, adminsRes] = await Promise.all([
          axiosInstance.get('/users?role=agent&limit=1000'),
          axiosInstance.get('/users?role=admin&limit=1000'),
        ]);
        const agentsList = (agentsRes.data.users || []).map(u => ({ ...u, _role: 'Agent' }));
        const adminsList = (adminsRes.data.users || []).map(u => ({ ...u, _role: 'Admin' }));
        setAgents([...agentsList, ...adminsList]);
      } catch (err) {
        setAgents([]);
      }
    };
    fetchUsers();
  }, []);

  // Prepare options for react-select
  const agentOptions = [
    { value: '', label: 'All Agents & Admins' },
    ...agents.map(agent => ({
      value: agent.id,
      label: `${agent.name} (${agent.mobile}) [${agent._role}]`,
    })),
  ];

  // Summary stats
  const totalAmount = collections.reduce((sum, c) => sum + Number(c.amount), 0);
  const uniqueAgents = new Set(collections.map(c => c.collector?.id)).size;
  const uniqueCustomers = new Set(collections.map(c => c.customer?.id)).size;

  // Group collections by agent and date
  const grouped = {};
  collections.forEach((item) => {
    if (!item.collector) return;
    if (selectedAgent && item.collector.id !== selectedAgent) return;
    const agentKey = `${item.collector.id}|${item.collector.name}`;
    const dateKey = item.paid_at ? dayjs(item.paid_at).format('YYYY-MM-DD') : '-';
    if (!grouped[agentKey]) grouped[agentKey] = {};
    if (!grouped[agentKey][dateKey]) grouped[agentKey][dateKey] = { total: 0, count: 0, agent: item.collector, date: dateKey };
    grouped[agentKey][dateKey].total += Number(item.amount);
    grouped[agentKey][dateKey].count += 1;
  });
  const summaryRows = [];
  Object.values(grouped).forEach(agentDates => {
    Object.values(agentDates).forEach(row => summaryRows.push(row));
  });
  summaryRows.sort((a, b) => b.date.localeCompare(a.date));

  const fetchCollections = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
        search: search.trim(),
      };
      if (startDate) params.startDate = dayjs(startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      if (endDate) params.endDate = dayjs(endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      if (selectedAgent) params.agentId = selectedAgent;
      const res = await axiosInstance.get('/loans/agent/collection-report', { params });
      setCollections(res.data.results || []);
      setTotal(res.data.count || 0);
      setPage(res.data.page || 1);
    } catch (err) {
      setError('Failed to fetch agent collections');
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections(1);
    // eslint-disable-next-line
  }, [search, startDate, endDate, selectedAgent]);

  const handlePageChange = (newPage) => {
    fetchCollections(newPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FiCreditCard className="text-blue-600" /> Agent Collections
          </h1>
          <p className="text-gray-600 text-lg">View, search, and analyze all agent EMI collections</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <Select
              options={agentOptions}
              value={agentOptions.find(opt => opt.value === selectedAgent) || agentOptions[0]}
              onChange={opt => setSelectedAgent(opt.value)}
              isSearchable
              classNamePrefix="react-select"
              className="w-80"
              placeholder="Select agent or admin..."
              menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
              styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search (Agent/Customer/Loan)</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Search by agent, customer, loan code, etc."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400 z-10" />
              <DatePicker
                selected={startDate ? dayjs(startDate, 'YYYY-MM-DD').toDate() : null}
                onChange={date => setStartDate(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                dateFormat="dd-MM-yy"
                placeholderText="dd-MM-yy"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                calendarClassName="z-50"
                isClearable
                locale="en-GB"
                popperContainer={({ children }) => <div style={{ zIndex: 9999, position: 'relative' }}>{children}</div>}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-3 text-gray-400 z-10" />
              <DatePicker
                selected={endDate ? dayjs(endDate, 'YYYY-MM-DD').toDate() : null}
                onChange={date => setEndDate(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                dateFormat="dd-MM-yy"
                placeholderText="dd-MM-yy"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                calendarClassName="z-50"
                isClearable
                locale="en-GB"
                popperContainer={({ children }) => <div style={{ zIndex: 9999, position: 'relative' }}>{children}</div>}
              />
            </div>
          </div>
          <button
            onClick={() => fetchCollections(1)}
            className="h-12 px-8 mt-6 md:mt-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow"
          >
            Search
          </button>
        </div>
      </div>

      {/* Grouped Summary View */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-green-600" /> Agent Daily Collection Summary
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Total Collected (₹)</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">EMIs Collected</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {summaryRows.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8">No collections found.</td></tr>
              ) : (
                summaryRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap font-mono text-gray-700">{row.date !== '-' ? dayjs(row.date).format('DD-MM-YY') : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-semibold text-blue-700">{row.agent.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">{row.agent.mobile}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-bold text-green-700">₹{row.total.toLocaleString()}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-semibold text-gray-900">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={FiUsers} label="Unique Agents" value={uniqueAgents} color="border-blue-500" />
        <StatCard icon={FiUsers} label="Unique Customers" value={uniqueCustomers} color="border-purple-500" />
        <StatCard icon={FiTrendingUp} label="Total Collected (₹)" value={`₹${totalAmount.toLocaleString()}`} color="border-green-500" />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FiCreditCard className="text-blue-600" /> Agent Collections Report
        </h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {/* Export Button - top right */}
        <div className="flex justify-end mb-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow"
            onClick={() => exportToCSV(collections, 'agent_collections.csv')}
            disabled={!collections || !collections.length}
          >
            <FiDownload /> Export to CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Loan Code</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Loan #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">EMI #</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : collections.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No collections found.</td></tr>
              ) : (
                collections.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-4 py-2 whitespace-nowrap font-mono text-gray-700">{item.paid_at ? dayjs(item.paid_at).format('DD-MM-YY') : '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.collector ? <span className="font-semibold text-blue-700">{item.collector.name}</span> : '-'}<br /><span className="text-xs text-gray-500">{item.collector?.mobile}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.customer ? <span className="font-semibold text-purple-700">{item.customer.name}</span> : '-'}<br /><span className="text-xs text-gray-500">{item.customer?.mobile}</span></td>
                    <td className="px-4 py-2 whitespace-nowrap font-mono">{item.loan_code || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.loan_number || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.emi_number || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap font-bold text-green-700">₹{Number(item.amount).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination - below table, left/right split */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 gap-4">
          <div className="text-sm text-gray-600 w-full md:w-auto text-left">
            Showing {collections.length} of {total} records
          </div>
          <div className="space-x-2 w-full md:w-auto flex justify-end items-center">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 bg-gray-200 rounded-lg font-semibold disabled:opacity-50"
            >Prev</button>
            <span className="mx-2 font-semibold">Page {page}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="px-4 py-2 bg-gray-200 rounded-lg font-semibold disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentCollectionsReport; 
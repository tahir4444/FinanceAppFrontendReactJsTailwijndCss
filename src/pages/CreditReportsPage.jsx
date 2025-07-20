import React, { useState, useEffect } from 'react';
import { getCreditReports } from '../services/report.service';
import { toast } from 'react-toastify';
import {
  FiFileText,
  FiSearch,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
  FiDownload,
} from 'react-icons/fi';
import Select from 'react-select';
import axiosInstance from '../services/axios';
import dayjs from 'dayjs';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
};

// Utility to export array of objects to CSV
function exportToCSV(data, filename) {
  if (!data || !data.length) return;
  // Flatten and map only relevant fields, with date as the first column
  const flatData = data.map(row => ({
    date: (row.created_at || row.createdAt) ? dayjs(row.created_at || row.createdAt).format('DD-MM-YY') : '',
    customer_name: row.customer_name || '',
    customer_email: row.customer_email || '',
    loan_code: row.loan_code || '',
    event_type: row.event_type || '',
    amount: row.amount || '',
    notes: row.notes || '',
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

const CreditReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Calculate stats
  const stats = {
    total: reports.length,
    totalAmount: reports.reduce(
      (sum, report) => sum + (parseFloat(report.amount) || 0),
      0
    ),
    bouncedEmis: reports.filter((report) => report.event_type === 'EMI_BOUNCED')
      .length,
    successfulPayments: reports.filter(
      (report) => report.event_type !== 'EMI_BOUNCED'
    ).length,
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search,
        sort_by: sortBy,
        sort_direction: sortDirection,
        ...(selectedCustomer ? { customer_id: selectedCustomer.value } : {}),
      };
      const res = await getCreditReports(params);
      setReports(res.data.reports);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error(
        'Failed to fetch credit reports. You may not have permission.'
      );
      console.error(error);
    }
    setLoading(false);
  };

  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axiosInstance.get('/users?role=user&limit=1000');
        setCustomers(res.data.users || []);
      } catch (err) {
        setCustomers([]);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [page, search, sortBy, sortDirection, selectedCustomer]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page on new sort
  };

  const renderSortArrow = (column) => {
    if (sortBy === column) {
      return sortDirection === 'asc' ? (
        <FiArrowUp className="w-4 h-4 ml-1" />
      ) : (
        <FiArrowDown className="w-4 h-4 ml-1" />
      );
    }
    return <FiArrowDown className="w-4 h-4 ml-1 text-gray-400" />;
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Credit Reports
            </h1>
            <p className="text-gray-600">
              Monitor credit events, track EMI payments, and analyze financial
              performance.
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div style={{ minWidth: 320 }}>
              <Select
                options={customers.map((c) => ({ value: c.id, label: `${c.name} (${c.email})` }))}
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                isClearable
                placeholder="Filter by Customer..."
                classNamePrefix="react-select"
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
              />
            </div>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow"
              onClick={() => exportToCSV(reports, 'credit_reports.csv')}
              disabled={!reports.length}
            >
              <FiDownload /> Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiFileText className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
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
            <div className="p-3 bg-red-500 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bounced EMIs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.bouncedEmis}
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
              <p className="text-sm font-medium text-gray-600">
                Successful Payments
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.successfulPayments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search by customer, loan code, event..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center">
                    Customer
                    {renderSortArrow('customer_name')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('loan_code')}
                >
                  <div className="flex items-center">
                    Loan Code
                    {renderSortArrow('loan_code')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('emi_number')}
                >
                  <div className="flex items-center">
                    EMI #{renderSortArrow('emi_number')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('event_type')}
                >
                  <div className="flex items-center">
                    Event Type
                    {renderSortArrow('event_type')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    {renderSortArrow('amount')}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Date
                    {renderSortArrow('created_at')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4">
                    <div className="flex justify-center items-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4">
                    <div className="text-center py-8">
                      <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No credit reports
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No credit reports found.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {report.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.customer_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {report.loan_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.emi_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.event_type === 'EMI_BOUNCED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {report.event_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{parseFloat(report.amount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(report.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {report.notes}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages).keys()].map((num) => (
                      <button
                        key={num + 1}
                        onClick={() => setPage(num + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === num + 1
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {num + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CreditReportsPage;

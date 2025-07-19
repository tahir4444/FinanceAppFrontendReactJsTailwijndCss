import React, { useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import dayjs from 'dayjs';
import { FaRupeeSign, FaInfoCircle, FaCheckCircle, FaSearch, FaFilter } from 'react-icons/fa';
import { getAgentEmiCollectionDashboard } from '../services/loan.service';

const PAGE_SIZE = 50;

// Icon Components
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// Skeleton Components
const SkeletonRow = () => (
  <div className="animate-pulse flex items-center border-b border-gray-200 py-4">
    <div className="flex-1.2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-1.2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2.8 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-1 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
  </div>
);

const SkeletonSummaryRow = ({ style }) => (
  <div style={style} className="animate-pulse flex items-center border-b border-gray-200">
    <div className="flex-1.2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-1.2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2.8 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-1 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
    <div className="flex-2 h-4 bg-gray-200 rounded mx-2"></div>
  </div>
);

const AgentDashboard = () => {
  const [emis, setEmis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [selectedEmi, setSelectedEmi] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [collectionAmount, setCollectionAmount] = useState('');
  const [lateCharge, setLateCharge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [upcomingEmis, setUpcomingEmis] = useState([]);
  const [overdueSummary, setOverdueSummary] = useState([]);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedOverdue, setSelectedOverdue] = useState(null);
  const [overdueLateCharge, setOverdueLateCharge] = useState('');
  const [overdueSubmitting, setOverdueSubmitting] = useState(false);
  const [overdueError, setOverdueError] = useState('');
  const [overdueDetails, setOverdueDetails] = useState({});
  const [viewOption, setViewOption] = useState('summary');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = React.useRef();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // useEffect for search/filter changes
  useEffect(() => {
    setPage(1);
    setEmis([]);
    setOverdueSummary([]);
    setOverdueDetails({});
    fetchEmis(1, { search: searchDebounce, customerId: selectedCustomer });
  }, [searchDebounce, selectedCustomer]);

  // Fetch EMIs with pagination, group by loan
  const fetchEmis = async (pageNum = 1, filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, limit: PAGE_SIZE, page: pageNum };
      const res = await getAgentEmiCollectionDashboard(params);
      let newEmis = res.data.results;
      let allEmis = pageNum === 1 ? newEmis : [...emis, ...newEmis];
      setEmis(allEmis);
      setTotalCount(res.data.totalCount);
      setPage(pageNum);
      setHasMore(newEmis.length > 0 && allEmis.length < res.data.totalCount);
      
      // Group by loan for summary and details
      const summaryMap = pageNum === 1 ? {} : {
        ...overdueSummary.reduce((acc, row) => {
          acc[row.loan_id] = row;
          return acc;
        }, {}),
      };
      const detailsMap = pageNum === 1 ? {} : { ...overdueDetails };
      
      allEmis.forEach((emi) => {
        if (!summaryMap[emi.loan_id]) {
          summaryMap[emi.loan_id] = {
            loan_id: emi.loan_id,
            loan_code: emi.loan_code,
            customer_name: emi.customer_name,
            customer_mobile: emi.customer_mobile,
            overdue_since: emi.emi_date,
            total_emi_amount: 0,
            total_late_charges: 0,
            total_due: 0,
            overdue_emi_numbers: [],
            count: 0,
          };
          detailsMap[emi.loan_id] = [];
        }
        if (emi.emi_date < summaryMap[emi.loan_id].overdue_since) {
          summaryMap[emi.loan_id].overdue_since = emi.emi_date;
        }
        summaryMap[emi.loan_id].total_emi_amount += Number(emi.amount);
        summaryMap[emi.loan_id].total_late_charges += Number(emi.late_charge);
        summaryMap[emi.loan_id].total_due += Number(emi.amount) + Number(emi.late_charge);
        summaryMap[emi.loan_id].overdue_emi_numbers.push(emi.emi_number);
        summaryMap[emi.loan_id].count++;
        detailsMap[emi.loan_id].push({
          emi_number: emi.emi_number,
          emi_date: emi.emi_date,
          status: emi.status,
          amount: emi.amount,
          late_charge: emi.late_charge,
        });
      });
      setOverdueSummary(Object.values(summaryMap));
      setOverdueDetails(detailsMap);
    } catch (err) {
      setError('Failed to fetch EMIs');
      if (pageNum === 1) {
        setEmis([]);
        setOverdueSummary([]);
        setOverdueDetails({});
      }
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll handler for react-window
  const handleItemsRendered = ({ visibleStopIndex }) => {
    if (hasMore && !loading && visibleStopIndex >= overdueSummary.length - 5) {
      fetchEmis(page + 1, {
        search: searchDebounce,
        customerId: selectedCustomer,
      });
    }
  };

  // Virtualized summary row renderer
  const Row = ({ index, style }) => {
    const row = overdueSummary[index];
    if (!row) return <div style={style}>Loading...</div>;
    return (
      <div
        style={{
          ...style,
          minWidth: 1200,
          overflowX: 'auto',
        }}
        className={`flex items-center border-b border-gray-200 transition-colors duration-200 cursor-pointer ${
          index % 2 === 0 ? 'bg-blue-50' : 'bg-gray-50'
        } hover:bg-blue-100`}
      >
        <div className="flex-1.2 p-2 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {row.customer_name}
        </div>
        <div className="flex-1.2 p-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {row.customer_mobile}
        </div>
        <div
          className="flex-2.8 p-2 font-mono whitespace-nowrap overflow-hidden text-ellipsis"
          title={row.loan_code}
        >
          {row.loan_code}
        </div>
        <div className="flex-2 p-2 whitespace-nowrap overflow-hidden text-ellipsis">
          {dayjs(row.overdue_since).format('D MMMM YYYY')}
        </div>
        <div className="flex-1 p-2 whitespace-nowrap overflow-hidden text-ellipsis">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {row.count}
          </span>
        </div>
        <div className="flex-2 p-2 text-red-600 font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis">
          <FaRupeeSign className="inline mr-1" />
          {Number(row.total_due).toLocaleString()}
        </div>
        <div className="flex-2 p-2 whitespace-nowrap overflow-hidden text-ellipsis">
          <button
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              setSelectedDetails({
                ...row,
                emis: overdueDetails[row.loan_id] || [],
              });
              setShowDetailsModal(true);
            }}
          >
            <FaInfoCircle className="mr-1 text-sm" /> Details
          </button>
        </div>
        <div className="flex-2 p-2 whitespace-nowrap overflow-hidden text-ellipsis">
          <button
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            onClick={() => {
              setSelectedOverdue(row);
              setShowOverdueModal(true);
            }}
          >
            <FaCheckCircle className="mr-1 text-sm" /> Collect Due
          </button>
        </div>
      </div>
    );
  };

  const handleRowClick = (emi) => {
    setSelectedEmi(emi);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmi(null);
    setCollectionAmount('');
    setLateCharge('');
    setError('');
  };

  const handleCollect = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      // Implementation for collecting EMI
      console.log('Collecting EMI:', selectedEmi, collectionAmount, lateCharge);
    } catch (err) {
      setError('Failed to collect EMI');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverdueCollect = async (e) => {
    e.preventDefault();
    setOverdueSubmitting(true);
    setOverdueError('');
    try {
      // Implementation for collecting overdue payment
      console.log('Collecting overdue:', selectedOverdue, overdueLateCharge);
    } catch (err) {
      setOverdueError('Failed to collect overdue payment');
    } finally {
      setOverdueSubmitting(false);
    }
  };

  const generateReceiptPDF = async () => {
    setPdfLoading(true);
    try {
      // Implementation for generating PDF receipt
      console.log('Generating PDF receipt for:', receiptData);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const generateClientSidePDF = async () => {
    try {
      await generateReceiptPDF();
    } catch (err) {
      console.error('Failed to generate client-side PDF:', err);
    }
  };

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptData(null);
    setPdfUrl(null);
    setPdfLoading(false);
  };

  // Calculate stats
  const totalOverdue = overdueSummary.length;
  const totalDueAmount = overdueSummary.reduce((sum, row) => sum + Number(row.total_due), 0);
  const successRate = totalOverdue > 0 ? Math.round((totalOverdue / (totalOverdue + 10)) * 100) : 0;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Agent Dashboard</h1>
                <p className="text-blue-100 text-lg">Manage your EMI collections efficiently</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Overdue</p>
                <p className="text-3xl font-bold text-red-600">{totalOverdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertIcon />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Due Amount</p>
                <p className="text-3xl font-bold text-red-600">₹{totalDueAmount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <FaRupeeSign className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Upcoming EMIs</p>
                <p className="text-3xl font-bold text-green-600">{upcomingEmis.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CalendarIcon />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Success Rate</p>
                <p className="text-3xl font-bold text-blue-600">{successRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name, mobile, or loan code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">View:</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewOption('summary')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    viewOption === 'summary'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setViewOption('details')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    viewOption === 'details'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Overdue EMIs</h2>
                  <p className="text-gray-600">Manage and collect overdue payments</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live Data</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading && overdueSummary.length === 0 ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <SkeletonSummaryRow key={i} style={{ height: 60 }} />
                ))}
              </div>
            ) : overdueSummary.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <AlertIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No overdue EMIs found</h3>
                <p className="text-gray-600">All EMIs are up to date!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex-1.2 p-3">Customer</div>
                      <div className="flex-1.2 p-3">Mobile</div>
                      <div className="flex-2.8 p-3">Loan Code</div>
                      <div className="flex-2 p-3">Overdue Since</div>
                      <div className="flex-1 p-3">Count</div>
                      <div className="flex-2 p-3">Total Due</div>
                      <div className="flex-2 p-3">Actions</div>
                      <div className="flex-2 p-3">Collect</div>
                    </div>
                  </div>
                  <List
                    height={400}
                    itemCount={overdueSummary.length}
                    itemSize={60}
                    onItemsRendered={handleItemsRendered}
                    className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  >
                    {Row}
                  </List>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming EMIs Preview */}
        {upcomingEmis.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <CalendarIcon />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Upcoming EMIs</h3>
                    <p className="text-green-100">Next 3 days - Plan your collections</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Loan Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">EMI No.</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">EMI Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {upcomingEmis.map((emi) => (
                        <tr key={`upcoming-${emi.loan_id}-${emi.emi_number}`} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{emi.customer_name}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{emi.customer_mobile}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{emi.loan_code}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">#{emi.emi_number}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{dayjs(emi.emi_date).format('D MMMM YYYY')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">₹{Number(emi.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Overdue EMI Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {selectedDetails && (
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">Customer:</span> {selectedDetails.customer_name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Loan Code:</span> {selectedDetails.loan_code}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Overdue Since:</span>{' '}
                      {dayjs(selectedDetails.overdue_since).format('D MMMM YYYY')}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold"># Overdue EMIs:</span> {selectedDetails.count}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total Due:</span>{' '}
                      <span className="text-red-600 font-bold">
                        &#8377;{Number(selectedDetails.total_due).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI No.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Charge (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedDetails.emis.map((emi, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emi.emi_number}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dayjs(emi.emi_date).format('D MMMM YYYY')}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emi.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">&#8377;{Number(emi.amount).toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">&#8377;{Number(emi.late_charge).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overdue Collection Modal */}
        {showOverdueModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Collect Overdue Payment</h3>
                <button
                  onClick={() => setShowOverdueModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                {selectedOverdue && (
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">Customer:</span> {selectedOverdue.customer_name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Loan Code:</span> {selectedOverdue.loan_code}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Overdue Since:</span>{' '}
                      {dayjs(selectedOverdue.overdue_since).format('D MMMM YYYY')}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold"># Overdue EMIs:</span> {selectedOverdue.count}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total EMI Amount:</span>{' '}
                      <span>
                        &#8377;
                        {Number(selectedOverdue.total_emi_amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total Late Charges:</span>{' '}
                      <span>
                        &#8377;
                        {Number(selectedOverdue.total_late_charges).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total Due Amount:</span>{' '}
                      <span className="text-red-600 font-bold">
                        &#8377;{Number(selectedOverdue.total_due).toLocaleString()}
                      </span>
                    </div>
                    <form onSubmit={handleOverdueCollect} className="mt-3">
                      <div className="mb-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Late Charges (if any)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={overdueLateCharge}
                          onChange={(e) => setOverdueLateCharge(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {overdueError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3">
                          {overdueError}
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={overdueSubmitting}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {overdueSubmitting ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Recording...
                          </div>
                        ) : (
                          'Record Collection'
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Payment Receipt</h3>
                <button
                  onClick={handleCloseReceiptModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6" style={{ minHeight: 600 }}>
                {pdfLoading ? (
                  <div className="text-center py-5">Loading PDF...</div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    title="EMI Receipt PDF"
                    className="w-full border-0"
                    style={{ height: '600px' }}
                  />
                ) : (
                  <div className="text-red-600 text-center font-bold py-4">
                    PDF receipt not available.
                    <br />
                    Please contact support if this is unexpected.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-6 border-t">
                {pdfUrl && (
                  <a
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    href={pdfUrl}
                    download={`EMI-Receipt-${receiptData?.loan_code || ''}-${receiptData?.emi_number || ''}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download/Print PDF
                  </a>
                )}
                <button
                  onClick={handleCloseReceiptModal}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AgentDashboard;

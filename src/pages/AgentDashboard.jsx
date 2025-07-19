import React, { useEffect, useState } from 'react';
import {
  getAgentEmiCollectionDashboard,
  markEmiPaid,
  payOverdueEmis,
} from '../services/loan.service';
import './AgentDashboard.css'; // For custom sticky and skeleton styles
import { FixedSizeList as List } from 'react-window';
import {
  FaSearch,
  FaRupeeSign,
  FaCheckCircle,
  FaInfoCircle,
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import dayjs from 'dayjs';

const AlertIcon = () => (
  <span className="text-red-600 mr-1" title="Overdue">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  </span>
);
const CalendarIcon = () => (
  <span className="text-blue-600 mr-1" title="Upcoming EMI">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  </span>
);

// Skeleton loader for table rows
const SkeletonRow = () => (
  <tr>
    {Array.from({ length: 9 }).map((_, i) => (
      <td key={i}>
        <div className="h-5 w-full bg-gray-200 animate-pulse rounded" />
      </td>
    ))}
  </tr>
);

// Skeleton loader for summary row
const SkeletonSummaryRow = ({ style }) => (
  <div
    style={{
      ...style,
      minWidth: 1200,
      height: 64,
    }}
    className="flex items-center bg-blue-50 border-b border-gray-200 opacity-70"
  >
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className={`p-2 ${
          i === 2 ? 'flex-2.8' : i === 3 ? 'flex-2' : i === 0 || i === 1 ? 'flex-1.2' : 'flex-2'
        }`}
      >
        <div className="h-5 w-full rounded bg-blue-200 animate-pulse" />
      </div>
    ))}
  </div>
);

const PAGE_SIZE = 25;

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
    // eslint-disable-next-line
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
      const summaryMap =
        pageNum === 1
          ? {}
          : {
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
        summaryMap[emi.loan_id].total_due +=
          Number(emi.amount) + Number(emi.late_charge);
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
    setCollectionAmount(emi.amount);
    setLateCharge(emi.late_charge);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmi(null);
    setCollectionAmount('');
    setLateCharge('');
    setSubmitting(false);
    setError('');
  };

  const handleCollect = async (e) => {
    e.preventDefault();
    if (!selectedEmi) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await markEmiPaid(
        selectedEmi.loan_id,
        selectedEmi.emi_number,
        lateCharge !== '' ? lateCharge : undefined
      );
      setReceiptData(res.data.receipt);
      setShowReceiptModal(true);
      handleCloseModal();
      fetchEmis(1, { search: searchDebounce, customerId: selectedCustomer });
      toast.success('EMI marked as paid!');
    } catch (err) {
      setError('Failed to record collection');
      toast.error('Failed to record collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverdueCollect = async (e) => {
    e.preventDefault();
    if (!selectedOverdue) return;
    setOverdueSubmitting(true);
    setOverdueError('');
    try {
      const res = await payOverdueEmis(
        selectedOverdue.loan_id,
        overdueLateCharge !== '' ? overdueLateCharge : undefined
      );
      setShowOverdueModal(false);
      setSelectedOverdue(null);
      setOverdueLateCharge('');
      fetchEmis(1, { search: searchDebounce, customerId: selectedCustomer });
      if (res.data.receipt) {
        setReceiptData(res.data.receipt);
        setShowReceiptModal(true);
      }
      toast.success('Overdue EMIs collected!');
    } catch (err) {
      setOverdueError('Failed to record overdue collection');
      toast.error('Failed to record overdue collection');
    } finally {
      setOverdueSubmitting(false);
    }
  };

  const generateReceiptPDF = async () => {
    if (!receiptData) return;

    // Use backend PDF if available
    if (receiptData.pdfUrl) {
      try {
        const response = await fetch(receiptData.pdfUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `EMI-Receipt-${receiptData.loan_code}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          // Fallback to client-side generation
          generateClientSidePDF();
        }
      } catch (error) {
        console.error('Error downloading PDF:', error);
        // Fallback to client-side generation
        generateClientSidePDF();
      }
    } else {
      // Fallback to client-side generation
      generateClientSidePDF();
    }
  };

  const generateClientSidePDF = async () => {
    const element = receiptRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null,
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      unit: 'mm',
      format: [80, (canvas.height / canvas.width) * 80],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, 80, (canvas.height / canvas.width) * 80);
    pdf.save(`EMI-Slip-${receiptData.loan_code}.pdf`);
  };

  // Fetch PDF when modal opens
  useEffect(() => {
    let url = null;
    const fetchPdf = async () => {
      if (
        showReceiptModal &&
        receiptData &&
        receiptData.loan_id &&
        receiptData.emi_number
      ) {
        setPdfLoading(true);
        const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/emi/receipt/${
          receiptData.loan_id
        }/${receiptData.emi_number}/pdf`;
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });
          if (response.ok) {
            const blob = await response.blob();
            url = window.URL.createObjectURL(blob);
            setPdfUrl(url);
          } else {
            setPdfUrl(null);
          }
        } catch (e) {
          setPdfUrl(null);
        }
        setPdfLoading(false);
      }
    };
    fetchPdf();
    return () => {
      if (url) window.URL.revokeObjectURL(url);
      setPdfUrl(null);
    };
    // eslint-disable-next-line
  }, [showReceiptModal, receiptData]);

  // Reset PDF state on modal close
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfLoading(false);
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover={false}
      />
      <div
        className="container py-4 agent-dashboard-root"
        style={{ maxWidth: 1400 }}
      >
        <h2
          className="mb-1 d-flex align-items-center"
          style={{ fontWeight: 700, color: '#1976d2' }}
        >
          <FaInfoCircle
            className="me-2"
            style={{ fontSize: 32, color: '#1976d2' }}
          />
          Agent Dashboard
        </h2>
        <div className="mb-4 text-muted" style={{ fontSize: 18 }}>
          Welcome! Collect overdue EMIs quickly and efficiently.
        </div>
        {/* Visually distinct sticky search/filter bar */}
        <div className="mb-3 sticky-search-bar p-3 rounded-lg shadow-sm bg-blue-50 border border-blue-200 sticky top-0 z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by customer name or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              {customerList && customerList.length > 0 && (
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Customers</option>
                  {customerList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.mobile})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        {/* Virtualized EMI summary list in a modern card */}
        <div className="mb-4 bg-white border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-400 text-white py-3 px-6 font-semibold text-xl">
            Overdue Collections (Detail View)
          </div>
          <div className="p-0 bg-gray-50" style={{ height: 600 }}>
            <div className="flex font-bold border-b-2 border-blue-300 bg-blue-50 text-blue-700 text-base">
              <div className="flex-1.2 p-2">Customer</div>
              <div className="flex-1.2 p-2">Mobile</div>
              <div className="flex-2.8 p-2">Loan Code</div>
              <div className="flex-2 p-2">Overdue Since</div>
              <div className="flex-1 p-2"># EMIs</div>
              <div className="flex-2 p-2">
                Total Due <FaRupeeSign className="text-green-600" />
              </div>
              <div className="flex-2 p-2">Details</div>
              <div className="flex-2 p-2">Action</div>
            </div>
            {loading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonSummaryRow
                    key={i}
                    style={{ top: i * 64, height: 64, position: 'relative' }}
                  />
                ))}
              </>
            ) : (
              <List
                height={540}
                itemCount={overdueSummary.length}
                itemSize={64}
                width="100%"
                className="bg-gray-50"
                onItemsRendered={({ visibleStopIndex }) =>
                  handleItemsRendered({ visibleStopIndex })
                }
              >
                {Row}
              </List>
            )}
          </div>
        </div>
        {/* Details Modal for Option 2 */}
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
        {/* Overdue Collection Modal (shared for both options) */}
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
                        {Number(
                          selectedOverdue.total_late_charges
                        ).toLocaleString()}
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
        {/* Upcoming EMIs Preview */}
        {upcomingEmis.length > 0 && (
          <div className="mb-4">
            <div className="bg-white border border-blue-500 shadow-sm rounded-lg">
              <div className="bg-blue-600 text-white py-2 px-4 rounded-t-lg">
                <CalendarIcon /> Upcoming EMIs (Next 3 Days)
              </div>
              <div className="p-2">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Code</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI No.</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {upcomingEmis.map((emi) => (
                        <tr key={`upcoming-${emi.loan_id}-${emi.emi_number}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{emi.customer_name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{emi.customer_mobile}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{emi.loan_code}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{emi.emi_number}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{dayjs(emi.emi_date).format('D MMMM YYYY')}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">&#8377;{Number(emi.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
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
                    download={`EMI-Receipt-${receiptData?.loan_code || ''}-${
                      receiptData?.emi_number || ''
                    }.pdf`}
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

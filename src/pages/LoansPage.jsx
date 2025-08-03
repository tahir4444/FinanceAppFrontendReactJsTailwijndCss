import React, { useEffect, useState, useRef } from 'react';
import {
  getAllLoans,
  createLoan,
  getLoanDetails,
  markEmiPaid,
  markEmiBounced,
  getLoanCustomers,
  updateLoan,
  clearLateCharges,
  exportLoans,
} from '../services/loan.service';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEdit,
  FiEye,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiTrendingUp,
  FiCopy,
} from 'react-icons/fi';
dayjs.extend(utc);
dayjs.extend(timezone);

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [form, setForm] = useState({
    customer_id: '',
    loan_amount: '',
    per_day_emi: '',
    total_emi_days: '',
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [showEmi, setShowEmi] = useState(false);
  const [emiAction, setEmiAction] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const loaderRef = useRef(null);
  const [sortBy, setSortBy] = useState('loan_number');
  const [sortDirection, setSortDirection] = useState('asc');
  const { user } = useAuth();
  const [copiedLoanCode, setCopiedLoanCode] = useState(null);
  const [tooltipText, setTooltipText] = useState('Copy to clipboard');
  const [clearingCharges, setClearingCharges] = useState(false);
  const [clearMsg, setClearMsg] = useState('');
  const [exportType, setExportType] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [lastPaymentResponse, setLastPaymentResponse] = useState(null);
  const role = user?.role || user?.Role?.name || '';
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState(null);
  const [receiptPdfLoading, setReceiptPdfLoading] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  // Add state for the late charges modal
  const [showLateChargeModal, setShowLateChargeModal] = useState(false);
  const [lateChargeEmi, setLateChargeEmi] = useState(null);
  const [lateChargeInput, setLateChargeInput] = useState('');
  // Add state for emiToMarkPaid
  const [emiToMarkPaid, setEmiToMarkPaid] = useState(null);
  // Add state for clearing charges modal
  const [showClearChargesModal, setShowClearChargesModal] = useState(false);
  const [clearChargesEmi, setClearChargesEmi] = useState(null);
  const [clearChargesAmount, setClearChargesAmount] = useState('');
  // Add state for Mark Paid modal
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidEmi, setMarkPaidEmi] = useState(null);
  const [markPaidCharges, setMarkPaidCharges] = useState('');

  const customerOptions = Array.isArray(customers?.users)
    ? customers.users
    : Array.isArray(customers)
    ? customers
    : [];

  const filteredLoans = loans.filter((loan) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === '' ||
      (loan.loan_code && loan.loan_code.toLowerCase().includes(searchLower)) ||
      (loan.loan_number && String(loan.loan_number).includes(search)) ||
      (loan.customer_name &&
        loan.customer_name.toLowerCase().includes(searchLower)) ||
      (loan.customer_email &&
        loan.customer_email.toLowerCase().includes(searchLower));
    const matchesStatus = statusFilter === '' || loan.status === statusFilter;
    const matchesCustomer =
      customerFilter === '' || String(loan.customer_id) === customerFilter;
    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const sortedLoans = [...filteredLoans].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    if (['customer_name', 'loan_code', 'status'].includes(sortBy)) {
      aValue = (aValue || '').toLowerCase();
      bValue = (bValue || '').toLowerCase();
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
    if (
      ['loan_amount', 'id', 'loan_number', 'total_emi_days'].includes(sortBy)
    ) {
      aValue = Number(aValue);
      bValue = Number(bValue);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (['start_date', 'end_date'].includes(sortBy)) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  // Calculate stats
  const stats = {
    total: loans.length,
    accepted: loans.filter((loan) => loan.status === 'accepted').length,
    pending: loans.filter((loan) => loan.status === 'pending').length,
    completed: loans.filter((loan) => loan.status === 'completed').length,
    totalAmount: loans.reduce(
      (sum, loan) => sum + (parseFloat(loan.loan_amount) || 0),
      0
    ),
  };

  useEffect(() => {
    // Reset loans and page when filters/search/pageSize change
    setLoans([]);
    setPage(1);
    setHasMore(true);
    fetchLoans(1, true);
    fetchCustomers();
  }, [search, statusFilter, customerFilter]);

  useEffect(() => {
    // Auto-calculate end date when start_date or total_emi_days changes
    if (form.start_date && form.total_emi_days) {
      const start = new Date(form.start_date);
      if (!isNaN(start.getTime())) {
        const days = parseInt(form.total_emi_days, 10);
        if (!isNaN(days) && days > 0) {
          const end = new Date(start);
          end.setDate(start.getDate() + days - 1);
          const yyyy = end.getFullYear();
          const mm = String(end.getMonth() + 1).padStart(2, '0');
          const dd = String(end.getDate()).padStart(2, '0');
          const endDateStr = `${yyyy}-${mm}-${dd}`;
          if (form.end_date !== endDateStr) {
            setForm((prev) => ({ ...prev, end_date: endDateStr }));
          }
        }
      }
    }
  }, [form.start_date, form.total_emi_days]);

  useEffect(() => {
    if (showEditModal && editForm.start_date && editForm.total_emi_days) {
      const start = new Date(editForm.start_date);
      if (!isNaN(start.getTime())) {
        const days = parseInt(editForm.total_emi_days, 10);
        if (!isNaN(days) && days > 0) {
          const end = new Date(start);
          end.setDate(start.getDate() + days - 1);
          const yyyy = end.getFullYear();
          const mm = String(end.getMonth() + 1).padStart(2, '0');
          const dd = String(end.getDate()).padStart(2, '0');
          const endDateStr = `${yyyy}-${mm}-${dd}`;
          if (editForm.end_date !== endDateStr) {
            setEditForm((prev) => ({ ...prev, end_date: endDateStr }));
          }
        }
      }
    }
  }, [editForm.start_date, editForm.total_emi_days]);

  // Handle PDF loading timeout
  useEffect(() => {
    let timeoutId;
    if (receiptPdfLoading && receiptPdfUrl) {
      timeoutId = setTimeout(() => {
        setReceiptPdfLoading(false);
        toast.error('PDF loading timeout, showing text receipt instead');
        setReceiptPdfUrl(null); // Fallback to text receipt
      }, 10000); // 10 seconds timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [receiptPdfLoading, receiptPdfUrl]);

  useEffect(() => {
    const handleScroll = () => {
      if (!loaderRef.current) return;
      const rect = loaderRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight && hasMore && !loading) {
        fetchLoans(page + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, page]);

  const fetchLoans = async (fetchPage = 1, reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const params = {
        page: fetchPage,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        customer_id: customerFilter || undefined,
        sort_by: sortBy,
        sort_direction: sortDirection,
      };

      const response = await getAllLoans(params);
      const newLoans = response.data.loans || response.data || [];

      if (reset) {
        setLoans(newLoans);
        setPage(1);
      } else {
        setLoans((prev) => [...prev, ...newLoans]);
        setPage(fetchPage);
      }

      setTotal(response.data.total || newLoans.length);
      setHasMore(newLoans.length === 20);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    try {
      const response = await getLoanCustomers();
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to fetch customers');
    } finally {
      setCustomersLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    if (
      !form.customer_id ||
      !form.loan_amount ||
      !form.per_day_emi ||
      !form.total_emi_days ||
      !form.start_date
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setFormLoading(true);
    try {
      await createLoan(form);
      toast.success('Loan created successfully');
      setShowCreateModal(false);
      setForm({
        customer_id: '',
        loan_amount: '',
        per_day_emi: '',
        total_emi_days: '',
        start_date: '',
        end_date: '',
      });
      fetchLoans(1, true);
    } catch (error) {
      console.error('Error creating loan:', error);
      toast.error(error.response?.data?.message || 'Failed to create loan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSelectLoan = async (loanId) => {
    try {
      const response = await getLoanDetails(loanId);
      console.log('Loan details response:', response.data);
      console.log('EMIs data:', response.data.emis);
      setSelectedLoan(response.data);
      setSelectedLoanId(loanId); // Store loanId separately
      setShowEmi(true);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      toast.error('Failed to fetch loan details');
    }
  };

  const handleMarkPaid = async (loanId, emiNumber) => {
    try {
      console.log('Marking EMI as paid:', { loanId, emiNumber });
      if (!loanId) {
        toast.error('Loan ID is missing');
        return;
      }
      const response = await markEmiPaid(loanId, emiNumber);
      toast.success(`EMI ${emiNumber} marked as paid`);
      // Do NOT set receipt data or open receipt modal automatically
      // setLastPaymentResponse(response);
      // if (response && response.data && response.data.emi) {
      //   ... (removed auto receipt modal logic)
      // }
      handleSelectLoan(loanId);
    } catch (error) {
      console.error('Error marking EMI as paid:', error);
      toast.error(
        error.response?.data?.message || 'Failed to mark EMI as paid'
      );
    }
  };

  const handleMarkBounced = async (loanId, emiNumber) => {
    try {
      console.log('Marking EMI as bounced:', { loanId, emiNumber });
      if (!loanId) {
        toast.error('Loan ID is missing');
        return;
      }
      await markEmiBounced(loanId, emiNumber);
      toast.success(`EMI ${emiNumber} marked as bounced`);
      handleSelectLoan(loanId);
    } catch (error) {
      console.error('Error marking EMI as bounced:', error);
      toast.error(
        error.response?.data?.message || 'Failed to mark EMI as bounced'
      );
    }
  };

  const openEditModal = (loan) => {
    setEditForm({
      id: loan.id,
      customer_id: loan.customer_id,
      loan_amount: loan.loan_amount,
      per_day_emi: loan.per_day_emi,
      total_emi_days: loan.total_emi_days,
      start_date: loan.start_date,
      end_date: loan.end_date,
      status: loan.status,
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditLoan = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updateLoan(editForm.id, editForm);
      toast.success('Loan updated successfully');
      setShowEditModal(false);
      fetchLoans(1, true);
    } catch (error) {
      console.error('Error updating loan:', error);
      toast.error(error.response?.data?.message || 'Failed to update loan');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCopyLoanCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedLoanCode(code);
    setTooltipText('Copied!');
    setTimeout(() => {
      setCopiedLoanCode(null);
      setTooltipText('Copy to clipboard');
    }, 2000);
  };

  const handleClearCharges = async (loanId) => {
    setClearingCharges(true);
    try {
      await clearLateCharges(loanId);
      toast.success('Late charges cleared successfully');
      handleSelectLoan(loanId);
    } catch (error) {
      console.error('Error clearing charges:', error);
      toast.error('Failed to clear late charges');
    } finally {
      setClearingCharges(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        customer_id: customerFilter || undefined,
        export_type: exportType,
      };
      await exportLoans(params);
      toast.success('Loans exported successfully');
    } catch (error) {
      console.error('Error exporting loans:', error);
      toast.error('Failed to export loans');
    } finally {
      setExporting(false);
    }
  };

  const handleViewReceipt = async (emi) => {
    try {
      // For existing paid EMIs, fetch the PDF URL from backend
      const pdfUrl = `/api/emi/receipt/${emi.loan_id}/${emi.emi_number}/pdf`;
      setReceiptData({
        ...emi,
        payment_date: emi.paid_at || new Date().toISOString(),
        due_date: emi.emi_date,
      });
      setLastPaymentResponse({
        data: { pdfUrl },
      });

      // Set PDF URL for viewing
      const cleanViewPdfUrl = pdfUrl.startsWith('/api/')
        ? pdfUrl.replace('/api/', '/')
        : pdfUrl;
      const token = localStorage.getItem('token');
      setReceiptPdfUrl(
        `${import.meta.env.VITE_API_BASE_URL}${cleanViewPdfUrl}?token=${token}`
      );
      setReceiptPdfLoading(true);

      console.log('Calling fetchAndShowPdfBlob', emi.loan_id, emi.emi_number);
      await fetchAndShowPdfBlob(emi.loan_id, emi.emi_number);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      toast.error('Failed to load receipt data');
    }
  };

  async function fetchAndShowPdfBlob(loanId, emiNumber) {
    setReceiptPdfLoading(true);
    setPdfBlobUrl(null);
    try {
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL
      }/emi/receipt/${loanId}/${emiNumber}/pdf`;
      console.log('Fetching PDF:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('PDF fetch response:', response);
      if (response.ok) {
        const blob = await response.blob();
        console.log('PDF blob type:', blob.type, 'size:', blob.size);
        const url = window.URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        console.log('PDF Blob URL:', url);
      } else {
        setPdfBlobUrl(null);
        console.log(
          'PDF fetch failed, status:',
          response.status,
          'statusText:',
          response.statusText
        );
        const text = await response.text();
        console.log('PDF fetch error body:', text);
      }
    } catch (e) {
      setPdfBlobUrl(null);
      console.log('PDF fetch error:', e);
    }
    setReceiptPdfLoading(false);
  }

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    if (pdfBlobUrl) window.URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setReceiptPdfLoading(false);
  };

  const handleClearEmiCharges = async (emi, amount, markPaid = false) => {
    if (
      !emi ||
      !emi.id ||
      !amount ||
      isNaN(parseFloat(amount)) ||
      parseFloat(amount) <= 0
    )
      return;
    try {
      // Call backend API to clear charges for this EMI (implement endpoint if needed)
      await axiosInstance.post(`/loans/emi/${emi.id}/clear-charges`, {
        amount: parseFloat(amount),
      });
      toast.success('Charges cleared for this EMI');
      // Refresh loan details
      handleSelectLoan(selectedLoan.id || selectedLoan.loan?.id);
      if (markPaid) {
        await handleMarkPaid(selectedLoan.id, emi.emi_number);
      }
    } catch (error) {
      toast.error('Failed to clear charges for this EMI');
    }
  };

  function openClearChargesModal(emi) {
    setClearChargesEmi(emi);
    setClearChargesAmount('');
    setShowClearChargesModal(true);
  }

  function openMarkPaidModal(emi) {
    setMarkPaidEmi(emi);
    setMarkPaidCharges('');
    setShowMarkPaidModal(true);
  }

  // Add this before the modal JSX:
  const hasAnyLateCharges =
    selectedLoan && selectedLoan.emis && markPaidEmi
      ? selectedLoan.emis.some(
          (emi) =>
            emi.emi_number <= markPaidEmi.emi_number &&
            (parseFloat(emi.late_charge) > 0 ||
              parseFloat(emi.late_charges) > 0)
        )
      : false;

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Loan Management
            </h1>
            <p className="text-gray-600">
              Manage all loan applications, track EMI payments, and monitor loan
              status.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiDownload className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Loan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Loans</p>
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
              <p className="text-sm font-medium text-gray-600">
                Accepted Loans
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.accepted}
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
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
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-500 rounded-lg">
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
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search loans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="accepted">Accepted</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Customers</option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCustomerFilter('');
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="w-4 h-4 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('loan_number')}
                >
                  Loan #
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('customer_name')}
                >
                  Customer
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('loan_amount')}
                >
                  Amount
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('per_day_emi')}
                >
                  Daily EMI
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('start_date')}
                >
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {loan.loan_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {loan.loan_code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {loan.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {loan.customer_email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(loan.loan_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{parseFloat(loan.per_day_emi).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(loan.start_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full
                        ${
                          loan.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : loan.status === 'accepted'
                            ? 'bg-blue-100 text-blue-800'
                            : loan.status === 'processing'
                            ? 'bg-purple-100 text-purple-800'
                            : loan.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : loan.status === 'closed'
                            ? 'bg-gray-200 text-gray-800'
                            : loan.status === 'default'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      `}
                    >
                      {loan.status.charAt(0).toUpperCase() +
                        loan.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {['approved', 'closed', 'default'].includes(
                        loan.status
                      ) && (
                        <button
                          onClick={() => handleSelectLoan(loan.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Loan Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role === 'admin' ||
                        user?.Role?.name === 'admin' ||
                        user?.role === 'superadmin' ||
                        user?.Role?.name === 'superadmin') && (
                        <button
                          onClick={() => openEditModal(loan)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      )}
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
      </div>

      {/* Create Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Loan</h2>
            <form onSubmit={handleCreateLoan}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <select
                    name="customer_id"
                    value={form.customer_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    name="loan_amount"
                    value={form.loan_amount}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily EMI
                  </label>
                  <input
                    type="number"
                    name="per_day_emi"
                    value={form.per_day_emi}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total EMI Days
                  </label>
                  <input
                    type="number"
                    name="total_emi_days"
                    value={form.total_emi_days}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Loan Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Loan</h2>
            <form onSubmit={handleEditLoan}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <select
                    name="customer_id"
                    value={editForm.customer_id}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Amount
                  </label>
                  <input
                    type="number"
                    name="loan_amount"
                    value={editForm.loan_amount}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily EMI
                  </label>
                  <input
                    type="number"
                    name="per_day_emi"
                    value={editForm.per_day_emi}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total EMI Days
                  </label>
                  <input
                    type="number"
                    name="total_emi_days"
                    value={editForm.total_emi_days}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={editForm.start_date}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={editForm.end_date}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                {(user?.role === 'admin' ||
                  user?.Role?.name === 'admin' ||
                  user?.role === 'superadmin' ||
                  user?.Role?.name === 'superadmin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={editForm.status}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="processing">Processing</option>
                      <option value="approved">Approved</option>
                      <option value="closed">Closed</option>
                      <option value="default">Default</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {editLoading ? 'Updating...' : 'Update Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMI Details Modal */}
      {showEmi && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  EMI Details - {selectedLoan.loan_code}
                </h2>
                <p className="text-gray-600 mt-1">
                  Customer:{' '}
                  {selectedLoan.customer_name ||
                    selectedLoan.loan?.customer_name}{' '}
                  | Amount: ₹
                  {isNaN(
                    parseFloat(
                      selectedLoan.loan_amount || selectedLoan.loan?.loan_amount
                    )
                  ) ||
                  !(selectedLoan.loan_amount || selectedLoan.loan?.loan_amount)
                    ? '-'
                    : parseFloat(
                        selectedLoan.loan_amount ||
                          selectedLoan.loan?.loan_amount
                      ).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowEmi(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Loan Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">
                  Total EMIs
                </h3>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedLoan.total_emi_days ||
                    selectedLoan.loan?.total_emi_days ||
                    '-'}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">
                  Paid EMIs
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  {selectedLoan.emis?.filter((emi) => emi.status === 'paid')
                    .length || 0}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">
                  Pending EMIs
                </h3>
                <p className="text-2xl font-bold text-yellow-900">
                  {selectedLoan.emis?.filter((emi) => emi.status === 'pending')
                    .length || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-red-600">
                  Bounced EMIs
                </h3>
                <p className="text-2xl font-bold text-red-900">
                  {selectedLoan.emis?.filter((emi) => emi.status === 'bounced')
                    .length || 0}
                </p>
              </div>
            </div>

            {/* Charges Summary */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                <FiDollarSign className="w-5 h-5 mr-2" />
                Late Charges Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-orange-600">Latest Late Charge</p>
                  <p className="text-xl font-bold text-orange-900">
                    ₹
                    {(() => {
                      const emisWithCharges =
                        selectedLoan.emis?.filter(
                          (emi) =>
                            parseFloat(emi.late_charge) > 0 ||
                            parseFloat(emi.late_charges) > 0
                        ) || [];
                      if (emisWithCharges.length === 0) return '0';
                      const latestEmi = emisWithCharges.reduce((a, b) =>
                        a.emi_number > b.emi_number ? a : b
                      );
                      const latestCharge =
                        parseFloat(latestEmi.late_charge) ||
                        parseFloat(latestEmi.late_charges) ||
                        0;
                      return latestCharge.toLocaleString();
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-600">Overdue EMIs</p>
                  <p className="text-xl font-bold text-orange-900">
                    {selectedLoan.emis?.filter((emi) => {
                      const dueDate = new Date(emi.emi_date || emi.due_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return dueDate < today && emi.status !== 'paid';
                    }).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-orange-600">Days Overdue</p>
                  <p className="text-xl font-bold text-orange-900">
                    {(() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const overdueEmis =
                        selectedLoan.emis?.filter((emi) => {
                          const dueDate = new Date(
                            emi.emi_date || emi.due_date
                          );
                          return dueDate < today && emi.status !== 'paid';
                        }) || [];
                      if (overdueEmis.length === 0) return '0';
                      // Show the max days overdue among all overdue EMIs
                      const maxDays = Math.max(
                        ...overdueEmis.map((emi) => {
                          const dueDate = new Date(
                            emi.emi_date || emi.due_date
                          );
                          return Math.floor(
                            (today - dueDate) / (1000 * 60 * 60 * 24)
                          );
                        })
                      );
                      return maxDays;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* EMI Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EMI #
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late Charges
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedLoan.emis && selectedLoan.emis.length > 0 ? (
                      selectedLoan.emis.map((emi, index) => (
                        <tr key={emi.id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {emi.emi_number || index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* Due Date */}
                            {formatDate(emi.emi_date || emi.due_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {/* Payment Date */}
                            {emi.status === 'bounced' 
                              ? (emi.bounced_at ? formatDate(emi.bounced_at) : '-')
                              : (emi.paid_at || emi.payment_date
                                ? formatDate(emi.paid_at || emi.payment_date)
                                : '-')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹
                            {parseFloat(
                              emi.amount || selectedLoan.per_day_emi
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                emi.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : emi.status === 'bounced'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {emi.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹
                            {emi.late_charge !== undefined &&
                            !isNaN(parseFloat(emi.late_charge))
                              ? parseFloat(emi.late_charge).toLocaleString()
                              : emi.late_charges !== undefined &&
                                !isNaN(parseFloat(emi.late_charges))
                              ? parseFloat(emi.late_charges).toLocaleString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {emi.status === 'paid' && (
                                <button
                                  onClick={() => handleViewReceipt(emi)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                                >
                                  View Receipt
                                </button>
                              )}
                              {emi.status !== 'paid' &&
                                emi.status !== 'bounced' && (
                                  <>
                                    <button
                                      onClick={() => openMarkPaidModal(emi)}
                                      className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs"
                                    >
                                      Mark Paid
                                    </button>
                                    <button
                                      onClick={() => {
                                        console.log(
                                          'Selected loan:',
                                          selectedLoan
                                        );
                                        console.log(
                                          'Selected loan ID:',
                                          selectedLoanId
                                        );
                                        console.log('EMI object:', emi);
                                        const loanId =
                                          selectedLoan?.id || selectedLoanId;
                                        handleMarkBounced(
                                          loanId,
                                          emi.emi_number || emi.id || index + 1
                                        );
                                      }}
                                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
                                    >
                                      Mark Bounced
                                    </button>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center">
                            <FiCalendar className="w-8 h-8 text-gray-400 mb-2" />
                            <p>No EMI records found for this loan.</p>
                            <p className="text-sm">
                              EMIs will be generated based on the loan schedule.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button
                  onClick={() =>
                    handleClearCharges(selectedLoan?.id || selectedLoanId)
                  }
                  disabled={clearingCharges}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {clearingCharges ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <FiDollarSign className="w-4 h-4 mr-2" />
                      Clear Late Charges
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleCopyLoanCode(selectedLoan.loan_code)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FiCopy className="w-4 h-4 mr-2" />
                  {copiedLoanCode === selectedLoan.loan_code
                    ? 'Copied!'
                    : 'Copy Loan Code'}
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Last updated:{' '}
                {(() => {
                  const paidEmis = selectedLoan.emis?.filter(
                    (e) => e.status === 'paid'
                  );
                  if (paidEmis && paidEmis.length > 0) {
                    const latestPaid = paidEmis.reduce((a, b) =>
                      new Date(a.paid_at) > new Date(b.paid_at) ? a : b
                    );
                    return (
                      formatDate(latestPaid.paid_at) +
                      (latestPaid.paid_at
                        ? ', ' +
                          new Date(latestPaid.paid_at).toLocaleTimeString()
                        : '')
                    );
                  }
                  return '-';
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg p-4"
            style={{
              minWidth: 380,
              maxWidth: 480,
              width: 'auto',
              minHeight: 0,
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Payment Receipt
              </h2>
              <button
                onClick={handleCloseReceiptModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* PDF Viewer */}
            {pdfBlobUrl ? (
              <div className="flex-1 min-h-0 relative">
                {receiptPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading PDF...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="EMI Receipt PDF"
                  className="w-full h-full border border-gray-200 rounded-lg"
                  onLoad={() => setReceiptPdfLoading(false)}
                  onError={() => {
                    setReceiptPdfLoading(false);
                    toast.error(
                      'Failed to load PDF, showing text receipt instead'
                    );
                    setPdfBlobUrl(null); // Fallback to text receipt
                  }}
                  style={{
                    display: receiptPdfLoading ? 'none' : 'block',
                    minHeight: '600px',
                  }}
                />
              </div>
            ) : (
              <div
                className="flex-1 min-h-0 overflow-y-auto"
                id="receipt-content"
              >
                <div className="space-y-4">
                  {/* Receipt Header */}
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Finance Application
                    </h3>
                    <p className="text-sm text-gray-600">EMI Payment Receipt</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Receipt Date: {formatDate(receiptData.payment_date)}
                    </p>
                  </div>

                  {/* Loan Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Loan Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Loan Code:</span>
                        <span className="font-medium">
                          {selectedLoan?.loan_code}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">
                          {selectedLoan?.customer_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">EMI Number:</span>
                        <span className="font-medium">
                          {receiptData.emi_number}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">
                      Payment Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-600">EMI Amount:</span>
                        <span className="font-medium text-green-900">
                          ₹
                          {parseFloat(
                            receiptData.amount || selectedLoan?.per_day_emi
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Late Charges:</span>
                        <span className="font-medium text-green-900">
                          ₹
                          {parseFloat(
                            receiptData.late_charges || 0
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-green-200 pt-2">
                        <span className="text-green-600 font-semibold">
                          Total Paid:
                        </span>
                        <span className="font-bold text-green-900">
                          ₹
                          {(
                            parseFloat(
                              receiptData.amount || selectedLoan?.per_day_emi
                            ) + parseFloat(receiptData.late_charges || 0)
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Due Date Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-600">Due Date:</span>
                        <span className="font-medium text-blue-900">
                          {formatDate(receiptData.due_date)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-600">Payment Date:</span>
                        <span className="font-medium text-blue-900">
                          {formatDate(receiptData.payment_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="text-center border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500">
                      This is a computer generated receipt
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Thank you for your payment!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleCloseReceiptModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {pdfBlobUrl && (
                <button
                  onClick={() => {
                    try {
                      setDownloadingPdf(true);
                      const url = pdfBlobUrl;
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `EMI-Receipt-${selectedLoan?.loan_code}-${receiptData.emi_number}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      toast.success('PDF downloaded successfully!');
                    } catch (error) {
                      console.error('Error downloading PDF:', error);
                      toast.error('Failed to download PDF');
                    } finally {
                      setDownloadingPdf(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Downloading...
                    </>
                  ) : (
                    'Download PDF'
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  // Print functionality
                  if (pdfBlobUrl) {
                    // Open PDF in new window for printing
                    const printWindow = window.open(pdfBlobUrl, '_blank');
                    if (printWindow) {
                      printWindow.onload = () => {
                        printWindow.print();
                      };
                    }
                  } else {
                    // Fallback to browser print
                    window.print();
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Late Charge Modal */}
      {showLateChargeModal && lateChargeEmi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Clear Late Charges
            </h2>
            <p className="mb-2 text-gray-700">
              This EMI has previous late charges. Enter the amount to clear and
              mark as paid, or mark as paid without clearing charges:
            </p>
            <input
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter charges to clear"
              value={lateChargeInput}
              onChange={(e) => setLateChargeInput(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowLateChargeModal(false);
                  setLateChargeEmi(null);
                  setLateChargeInput('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const loanId = selectedLoan?.id || selectedLoanId;
                  // Find the latest EMI with a late charge > 0
                  const emisWithCharges =
                    selectedLoan.emis?.filter(
                      (emi) =>
                        parseFloat(emi.late_charge) > 0 ||
                        parseFloat(emi.late_charges) > 0
                    ) || [];
                  const latestEmiWithCharge =
                    emisWithCharges.length > 0
                      ? emisWithCharges.reduce((a, b) =>
                          a.emi_number > b.emi_number ? a : b
                        )
                      : null;
                  const latestCharge = latestEmiWithCharge
                    ? parseFloat(latestEmiWithCharge.late_charge) ||
                      parseFloat(latestEmiWithCharge.late_charges) ||
                      0
                    : 0;
                  if (parseFloat(lateChargeInput) !== latestCharge) {
                    toast.error(
                      'Please enter the exact latest late charge amount to clear all charges.'
                    );
                    return;
                  }
                  await handleClearEmiCharges(lateChargeEmi, lateChargeInput);
                  setShowLateChargeModal(false);
                  setLateChargeEmi(null);
                  setLateChargeInput('');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Clear Charges & Mark Paid
              </button>
              <button
                onClick={async () => {
                  const loanId = selectedLoan?.id || selectedLoanId;
                  await handleMarkPaid(
                    loanId,
                    lateChargeEmi.emi_number || lateChargeEmi.id
                  );
                  setShowLateChargeModal(false);
                  setLateChargeEmi(null);
                  setLateChargeInput('');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Mark Paid Without Clearing Charges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Charges Modal */}
      {showClearChargesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Clear Late Charges</h2>
            <p className="mb-2">
              Enter the amount to clear for EMI #{clearChargesEmi?.emi_number}:
            </p>
            <input
              type="number"
              min="0"
              value={clearChargesAmount}
              onChange={(e) => setClearChargesAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              placeholder="Enter amount"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearChargesModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const loanId = selectedLoan?.id || selectedLoanId;
                  await handleClearEmiCharges(
                    clearChargesEmi,
                    clearChargesAmount
                  );
                  setShowClearChargesModal(false);
                  setClearChargesEmi(null);
                  setClearChargesAmount('');
                }}
                disabled={
                  !clearChargesAmount ||
                  isNaN(parseFloat(clearChargesAmount)) ||
                  parseFloat(clearChargesAmount) <= 0
                }
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                Clear Charges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {showMarkPaidModal && markPaidEmi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Mark EMI as Paid
            </h2>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMarkPaidModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const loanId = selectedLoan?.id || selectedLoanId;
                  await handleMarkPaid(loanId, markPaidEmi.emi_number);
                  setShowMarkPaidModal(false);
                }}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Mark EMI Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoansPage;

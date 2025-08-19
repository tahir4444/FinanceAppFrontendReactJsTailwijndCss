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
    loan_reason: '',
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
  const [lastPaymentResponse, setLastPaymentResponse] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [receiptPdfUrl, setReceiptPdfUrl] = useState(null);
  const [receiptPdfLoading, setReceiptPdfLoading] = useState(false);
  const role = user?.role || user?.Role?.name || '';
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
  const [lateChargePayment, setLateChargePayment] = useState('');
  const [selectedPaymentType, setSelectedPaymentType] = useState('emiOnly');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('cash');

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
        loan_reason: '',
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

  const handleMarkPaid = async (loanId, emiNumber, paymentAmount, paymentMode, paymentType = 'full') => {
    try {
      console.log('Marking EMI as paid:', { loanId, emiNumber, paymentAmount, paymentMode, paymentType });
      if (!loanId) {
        toast.error('Loan ID is missing');
        return;
      }
      
      // Prepare request body with payment details
      const requestBody = {};
      if (paymentAmount && !isNaN(parseFloat(paymentAmount))) {
        requestBody.payment_amount = parseFloat(paymentAmount);
      }
      if (paymentMode) {
        requestBody.payment_mode = paymentMode;
      }
      if (paymentType) {
        requestBody.payment_type = paymentType;
      }
      
      const response = await markEmiPaid(loanId, emiNumber, requestBody);
      
      // Show appropriate success message
      let message = '';
      const remainingBalance = parseFloat(response.data.receipt.remaining_balance || 0);
      
      if (remainingBalance > 0) {
        message = `Partial payment of ₹${paymentAmount} received. Remaining balance: ₹${remainingBalance}.`;
      } else {
        message = `EMI ${emiNumber} fully paid.`;
      }
      
      toast.success(message);
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
      const response = await exportLoans(params);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filenameHeader = response.headers['content-disposition'] || '';
      const match = filenameHeader.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : (exportType === 'pdf' ? 'loans_export.pdf' : 'loans_export.csv');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
      // Get the loan ID from either the EMI or the selected loan
      const loanId = emi.loan_id || selectedLoan?.id || selectedLoanId;
      const emiNumber = emi.emi_number;
      
      if (!loanId || !emiNumber) {
        console.error('Missing loanId or emiNumber:', { loanId, emiNumber });
        toast.error('Missing loan or EMI information');
        return;
      }
      
      // For existing paid EMIs, fetch the PDF URL from backend
      const pdfUrl = `/emi/receipt/${loanId}/${emiNumber}/pdf`;
      setReceiptData({
        ...emi,
        payment_date: emi.paid_at || new Date().toISOString(),
        due_date: emi.emi_date,
        late_charge: getLatestIndividualCharge(emiNumber), // Use calculated charge
      });
      setLastPaymentResponse({
        data: { pdfUrl },
      });

      // Don't set receiptPdfUrl here - it will be set after blob is created
      setReceiptPdfLoading(true);
      setShowReceiptModal(true);

      await fetchAndShowPdfBlob(loanId, emiNumber);
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      toast.error('Failed to load receipt data');
    }
  };


  async function fetchAndShowPdfBlob(loanId, emiNumber) {
    setReceiptPdfLoading(true);
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
        // Create blob URL from PDF response
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        console.log('PDF blob created, size:', blob.size);
        console.log('PDF blob URL created:', blobUrl);
        setReceiptPdfUrl(blobUrl);
        setReceiptPdfLoading(false);
        console.log('Receipt PDF URL set to:', blobUrl);
      } else {
        setReceiptPdfLoading(false);
        console.log(
          'PDF fetch failed, status:',
          response.status,
          'statusText:',
          response.statusText
        );
        const text = await response.text();
        console.log('PDF fetch error body:', text);
        toast.error('Failed to load PDF receipt');
      }
    } catch (e) {
      setReceiptPdfLoading(false);
      console.log('PDF fetch error:', e);
      toast.error('Failed to load PDF receipt');
    }
  }

  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptPdfLoading(false);
    // Clean up blob URL to prevent memory leaks
    if (receiptPdfUrl && receiptPdfUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(receiptPdfUrl);
      setReceiptPdfUrl(null);
    }
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
                          await handleMarkPaid(selectedLoan.id, emi.emi_number, undefined, undefined, 'cash');
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
    setLateChargePayment('');
    setSelectedPaymentType('full'); // Default to full payment since charges are included
    setShowMarkPaidModal(true);
  }

  // Updated charge calculation - 10% on latest bounced EMI only
  const getChargesFromLastBouncedEmi = () => {
    if (!selectedLoan || !selectedLoan.emis) return 0;
    
    // Get all bounced EMIs in order
    const bouncedEmis = selectedLoan.emis
      .filter(emi => emi.status === 'bounced')
      .sort((a, b) => a.emi_number - b.emi_number);
    
    if (bouncedEmis.length === 0) return 0;
    
    // Get the latest bounced EMI (highest EMI number)
    const latestBouncedEmi = bouncedEmis[bouncedEmis.length - 1];
    
    // Return charges from the latest bounced EMI only
    return parseFloat(latestBouncedEmi.late_charge || 0);
  };

  // Get charges from EMI-only payments that need to be carried forward
  const getChargesFromEmiOnlyPayments = () => {
    if (!selectedLoan || !selectedLoan.emis) return 0;
    
    // Get all paid EMIs with emi_only payment type that have charges
    const emiOnlyPaidEmis = selectedLoan.emis
      .filter(emi => emi.status === 'paid' && emi.payment_type === 'emi_only' && parseFloat(emi.late_charge || 0) > 0)
      .sort((a, b) => a.emi_number - b.emi_number);
    
    if (emiOnlyPaidEmis.length === 0) return 0;
    
    // Get the latest EMI-only payment with charges (highest EMI number)
    const latestEmiOnlyEmi = emiOnlyPaidEmis[emiOnlyPaidEmis.length - 1];
    
    // Return charges from the latest EMI-only payment
    return parseFloat(latestEmiOnlyEmi.late_charge || 0);
  };

  // Get individual charge for specific EMI
  const getIndividualCharge = (emiNumber) => {
    if (!selectedLoan || !selectedLoan.emis) return 0;
    
    // Get the specific EMI
    const targetEmi = selectedLoan.emis.find(emi => emi.emi_number === emiNumber);
    if (!targetEmi) return 0;
    
    // For bounced EMIs, return the late_charge field directly
    if (targetEmi.status === 'bounced') {
      return parseFloat(targetEmi.late_charge || 0);
    }
    
    // For pending EMIs, no charges (charges only appear on bounced EMIs)
    if (targetEmi.status === 'pending') {
      return 0;
    }
    
    // For paid EMIs, no charges (they were cleared when paid)
    if (targetEmi.status === 'paid') {
      return 0;
    }
    
    return 0;
  };

  // Get latest individual charge for EMI (for display purposes)
  const getLatestIndividualCharge = (emiNumber) => {
    if (!selectedLoan || !selectedLoan.emis) return 0;
    
    // Get the current EMI
    const currentEmi = selectedLoan.emis.find(emi => emi.emi_number === emiNumber);
    if (!currentEmi) return 0;
    
    // Use the same logic as getDisplayCharges to ensure consistency
    return getDisplayCharges(currentEmi);
  };

  // Calculate total due for an EMI
  const getTotalDue = (emi) => {
    if (!emi) return 0;
    
    const emiAmount = parseFloat(emi.amount || selectedLoan?.per_day_emi || 0);
    const charges = parseFloat(emi.late_charge || 0);
    
    // For pending EMIs, only show charges for the next upcoming pending EMI
    if (emi.status === 'pending') {
      // Find the next pending EMI (lowest EMI number with pending status)
      const pendingEmis = selectedLoan?.emis?.filter(e => e.status === 'pending') || [];
      if (pendingEmis.length > 0) {
        const nextPendingEmi = pendingEmis.reduce((min, e) => 
          e.emi_number < min.emi_number ? e : min
        );
        
        // Only show charges if this is the next pending EMI
        if (emi.emi_number === nextPendingEmi.emi_number) {
          return emiAmount + charges;
        }
      }
      // For other pending EMIs, just show EMI amount
      return emiAmount;
    }
    
    // For bounced EMIs, show EMI amount + charges
    if (emi.status === 'bounced') {
      return emiAmount + charges;
    }
    
    // For paid EMIs, just show EMI amount
    return emiAmount;
  };

  // Get charges for display in the Charges column
  const getDisplayCharges = (emi) => {
    if (!emi) return 0;
    
    // For bounced EMIs, show the late_charge
    if (emi.status === 'bounced') {
      return parseFloat(emi.late_charge || 0);
    }
    
    // For EMI-only payments, show the charges that are being carried forward
    if (emi.status === 'paid' && emi.payment_type === 'emi_only') {
      return parseFloat(emi.late_charge || 0);
    }
    
    // For partial payments, show the charges
    if (emi.status === 'partial') {
      return parseFloat(emi.late_charge || 0);
    }
    
    // For pending EMIs, only show charges for the next upcoming pending EMI
    if (emi.status === 'pending') {
      // Find the next pending EMI (lowest EMI number with pending status)
      const pendingEmis = selectedLoan?.emis?.filter(e => e.status === 'pending') || [];
      if (pendingEmis.length > 0) {
        const nextPendingEmi = pendingEmis.reduce((min, e) => 
          e.emi_number < min.emi_number ? e : min
        );
        
        // Only show charges if this is the next pending EMI
        if (emi.emi_number === nextPendingEmi.emi_number) {
          return parseFloat(emi.late_charge || 0);
        }
      }
    }
    
    // For other paid EMIs or pending EMIs, no charges
    return 0;
  };

  // Add this before the modal JSX:
  const hasAnyLateCharges =
            selectedLoan && selectedLoan.emis && markPaidEmi
      ? getLatestIndividualCharge(markPaidEmi.emi_number) > 0
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
            <option value="pending_acceptance">Pending Acceptance</option>
            <option value="accepted">Accepted</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
            <option value="default">Default</option>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Reason
                  </label>
                  <textarea
                    name="loan_reason"
                    value={form.loan_reason}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Enter the reason for taking this loan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Reason
                  </label>
                  <textarea
                    name="loan_reason"
                    value={editForm.loan_reason}
                    onChange={handleEditChange}
                    rows="3"
                    placeholder="Enter the reason for taking this loan..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <option value="pending_acceptance">Pending Acceptance</option>
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
                    {(() => {
                      const totalCharges = getChargesFromLastBouncedEmi();
                      return totalCharges > 0 ? `₹${totalCharges.toLocaleString()}` : 'No charges';
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
                        EMI Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Individual Charges
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
                            ₹{parseFloat(emi.amount || selectedLoan.per_day_emi).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{getTotalDue(emi).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(emi.status === 'paid' || emi.status === 'partial') ? (
                              <div className="space-y-1">
                                {emi.payment_type === 'partial' || emi.status === 'partial' ? (
                                  <>
                                    <div className="text-green-600 font-medium">
                                      Paid: ₹{parseFloat(emi.partial_payment_amount || emi.amount).toLocaleString()}
                                    </div>
                                    {(() => {
                                      // Calculate correct remaining amount
                                      const totalDue = parseFloat(emi.amount) + getLatestIndividualCharge(emi.emi_number);
                                      const paidAmount = parseFloat(emi.partial_payment_amount || emi.amount);
                                      const remaining = Math.max(0, totalDue - paidAmount);
                                      return remaining > 0 ? (
                                        <div className="text-orange-600 text-xs">
                                          Remaining: ₹{remaining.toLocaleString()}
                                        </div>
                                      ) : null;
                                    })()}
                                  </>
                                ) : emi.payment_type === 'emi_only' ? (
                                  <>
                                    <div className="text-blue-600 font-medium">
                                      EMI Only: ₹{parseFloat(emi.amount).toLocaleString()}
                                    </div>
                                    <div className="text-orange-600 text-xs">
                                      Charges carried forward
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-green-600 font-medium">
                                    Full Payment: ₹{parseFloat(emi.amount).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ) : emi.status === 'bounced' ? (
                              <div className="space-y-1">
                                <div className="text-red-600 font-medium">
                                  Bounced: ₹{parseFloat(emi.amount).toLocaleString()}
                                </div>
                                {(() => {
                                  const calculatedCharge = getIndividualCharge(emi.emi_number);
                                  return calculatedCharge > 0 ? (
                                    <div className="text-orange-600 text-xs">
                                      Charges: ₹{calculatedCharge.toLocaleString()}
                                    </div>
                                  ) : null;
                                })()}
                                {emi.bounced_at && (
                                  <div className="text-gray-500 text-xs">
                                    Bounced: {formatDate(emi.bounced_at)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                emi.status === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : emi.status === 'partial'
                                  ? 'bg-orange-100 text-orange-800'
                                  : emi.status === 'bounced'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {emi.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const charges = getDisplayCharges(emi);
                              return charges > 0 ? `₹${charges.toLocaleString()}` : '-';
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {(emi.status === 'paid' || emi.status === 'partial') && (
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
                          colSpan="9"
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
            {receiptPdfLoading ? (
              <div className="flex-1 min-h-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            ) : receiptPdfUrl ? (
              <div className="flex-1 min-h-0 relative">
                <iframe
                  src={`${receiptPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  title="EMI Receipt PDF"
                  className="w-full h-full border border-gray-200 rounded-lg"
                  onError={() => {
                    toast.error(
                      'Failed to load PDF, showing text receipt instead'
                    );
                  }}
                  style={{
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
                            receiptData.late_charge || 0
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
                            ) + parseFloat(receiptData.late_charge || 0)
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
              {receiptPdfUrl && receiptPdfUrl.startsWith('blob:') && (
                <button
                  onClick={() => {
                    try {
                      const link = document.createElement('a');
                      link.href = receiptPdfUrl;
                      link.download = `EMI-Receipt-${selectedLoan?.loan_code}-${receiptData.emi_number}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success('PDF downloaded successfully!');
                    } catch (error) {
                      console.error('Error downloading PDF:', error);
                      toast.error('Failed to download PDF');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Download PDF
                </button>
              )}
              <button
                onClick={() => {
                  // Print functionality
                  if (receiptPdfUrl && receiptPdfUrl.startsWith('blob:')) {
                    // Open PDF in new window for printing
                    const printWindow = window.open(receiptPdfUrl, '_blank');
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
                        parseFloat(emi.late_charge) > 0
                    ) || [];
                  const latestEmiWithCharge =
                    emisWithCharges.length > 0
                      ? emisWithCharges.reduce((a, b) =>
                          a.emi_number > b.emi_number ? a : b
                        )
                      : null;
                  const latestCharge = latestEmiWithCharge
                    ? parseFloat(latestEmiWithCharge.late_charge) || 0
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
                    lateChargeEmi.emi_number || lateChargeEmi.id,
                    undefined,
                    undefined,
                    'cash'
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

      {/* Mark Paid Modal - Redesigned */}
      {showMarkPaidModal && markPaidEmi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Mark EMI as Paid</h2>
                  <p className="text-blue-100 mt-1">EMI #{markPaidEmi.emi_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Due Date</p>
                  <p className="font-semibold">{new Date(markPaidEmi.emi_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* EMI Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">EMI Amount</div>
                  <div className="text-xl font-bold text-blue-800">₹{parseFloat(markPaidEmi.amount).toLocaleString()}</div>
                  <div className="text-xs text-blue-500 mt-1">Status: {markPaidEmi.status}</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">Latest Charge</div>
                  <div className="text-xl font-bold text-orange-800">
                    ₹{getLatestIndividualCharge(markPaidEmi.emi_number).toLocaleString()}
                    </div>
                  <div className="text-xs text-orange-500 mt-1">
                    {getLatestIndividualCharge(markPaidEmi.emi_number) > 0 ? 'From last bounce' : 'Already included in EMI amount'}
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Total Due</div>
                  <div className="text-xl font-bold text-green-800">
                    ₹{(parseFloat(markPaidEmi.amount) + getLatestIndividualCharge(markPaidEmi.emi_number)).toLocaleString()}
                  </div>
                  <div className="text-xs text-green-500 mt-1">EMI + Charges</div>
              </div>
            </div>

              {/* Payment Options */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Options</h3>
              <div className="space-y-3">
                  {/* Option 1: Full Payment (Default) */}
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentType === 'full' 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="full"
                    checked={selectedPaymentType === 'full'}
                    onChange={(e) => {
                      setSelectedPaymentType(e.target.value);
                      setMarkPaidCharges('');
                      setLateChargePayment('');
                    }}
                      className="mt-1 text-green-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800">Option 1: Pay Full Amount</div>
                        <div className="text-lg font-bold text-green-600">₹{getTotalDue(markPaidEmi).toLocaleString()}</div>
                    </div>
                      <p className="text-sm text-gray-600 mt-1">Pay complete EMI amount + charges</p>
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Clears EMI and all associated charges
                      </p>
                  </div>
                </label>
                
                  {/* Option 2: EMI-Only Payment */}
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentType === 'emi_only' 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="emi_only"
                    checked={selectedPaymentType === 'emi_only'}
                    onChange={(e) => {
                      setSelectedPaymentType(e.target.value);
                      setMarkPaidCharges('');
                      setLateChargePayment('');
                    }}
                      className="mt-1 text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800">Option 2: Pay EMI Only</div>
                        <div className="text-lg font-bold text-blue-600">₹{parseFloat(selectedLoan?.per_day_emi || markPaidEmi.amount).toLocaleString()}</div>
                    </div>
                      <p className="text-sm text-gray-600 mt-1">Pay only the EMI amount, keep charges pending</p>
                      <p className="text-xs text-blue-600 mt-1">
                        ⚠️ Charges will remain pending and appear in next EMI
                      </p>
                  </div>
                </label>

                  {/* Option 3: Partial Payment */}
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPaymentType === 'partial' 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <input
                    type="radio"
                    name="paymentType"
                    value="partial"
                    checked={selectedPaymentType === 'partial'}
                    onChange={(e) => {
                      setSelectedPaymentType(e.target.value);
                      setMarkPaidCharges('');
                      setLateChargePayment('');
                    }}
                      className="mt-1 text-purple-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-800">Option 3: Partial Payment</div>
                        <div className="text-lg font-bold text-purple-600">Custom Amount</div>
                    </div>
                      <p className="text-sm text-gray-600 mt-1">Pay a custom amount less than total</p>
                      <p className="text-xs text-purple-600 mt-1">
                        📋 Remaining amount + 10% charge will be carried forward
                      </p>
                  </div>
                </label>
                

              </div>
            </div>

              {/* Payment Mode Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Mode</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'cash', label: 'Cash', icon: '💵' },
                    { value: 'upi', label: 'UPI', icon: '📱' },
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
                    { value: 'cheque', label: 'Cheque', icon: '📄' },
                    { value: 'card', label: 'Card', icon: '💳' },
                    { value: 'other', label: 'Other', icon: '📋' }
                  ].map((mode) => (
                    <label
                      key={mode.value}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMode === mode.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value={mode.value}
                        checked={selectedPaymentMode === mode.value}
                        onChange={(e) => setSelectedPaymentMode(e.target.value)}
                        className="mr-2 text-blue-600"
                      />
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{mode.icon}</span>
                        <span className="font-medium text-gray-800">{mode.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Content Based on Selection */}
              {selectedPaymentType === 'partial' && (
                <div className="mb-6 space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-2">Custom Payment Amount</h4>
                      <input
                        type="number"
                        min="0"
                        max={parseFloat(markPaidEmi.amount) + getLatestIndividualCharge(markPaidEmi.emi_number)}
                        step="0.01"
                        value={markPaidCharges}
                        onChange={(e) => setMarkPaidCharges(e.target.value)}
                      className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                        placeholder={`Enter amount (max: ₹${(parseFloat(markPaidEmi.amount) + getLatestIndividualCharge(markPaidEmi.emi_number)).toLocaleString()})`}
                      />
                    <p className="text-sm text-purple-600 mt-2">
                        Enter the amount you want to pay. Remaining EMI + 10% late charge will be added to the next EMI.
                      </p>
                    </div>
                    
                    {markPaidCharges && !isNaN(parseFloat(markPaidCharges)) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-3">Payment Breakdown:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600">Amount to pay:</span>
                          <span className="font-semibold ml-2">₹{parseFloat(markPaidCharges).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Remaining EMI:</span>
                          <span className="font-semibold ml-2">₹{Math.max(0, parseFloat(markPaidEmi.amount) - parseFloat(markPaidCharges)).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">Late charge (10%):</span>
                          <span className="font-semibold ml-2">₹{Math.round((Math.max(0, parseFloat(markPaidEmi.amount) - parseFloat(markPaidCharges)) * 0.1)).toLocaleString()}</span>
                        </div>
                        {/* <div>
                          <span className="text-blue-600">Previous charges:</span>
                          <span className="font-semibold ml-2">₹{getLatestIndividualCharge(markPaidEmi.emi_number).toLocaleString()}</span>
                        </div> */}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <span className="text-blue-800 font-semibold">Remaining balance to carry forward:</span>
                        <span className="font-bold text-lg ml-2 text-blue-900">
                          ₹{(Math.max(0, parseFloat(markPaidEmi.amount) - parseFloat(markPaidCharges)) + Math.round((Math.max(0, parseFloat(markPaidEmi.amount) - parseFloat(markPaidCharges)) * 0.1))).toLocaleString()}
                        </span>
                        <p className="text-xs text-blue-600 mt-1">
                          (Remaining EMI + 10% late charge will be applied on this total)
                        </p>
                      </div>
                      </div>
                    )}
                </div>
              )}

              {/* Payment Summary for other options */}
              {selectedPaymentType === 'full' && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">✅ Payment Summary</h4>
                  <p className="text-green-700">You will pay <span className="font-bold">₹{getTotalDue(markPaidEmi).toLocaleString()}</span> (EMI + Charges)</p>
                  <p className="text-sm text-green-600 mt-1">
                    This payment will clear the EMI and all associated charges completely.
                  </p>
                </div>
              )}

              {selectedPaymentType === 'emi_only' && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📋 Payment Summary</h4>
                  <p className="text-blue-700">You will pay <span className="font-bold">₹{parseFloat(markPaidEmi.amount).toLocaleString()}</span> (EMI amount only)</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Charges will remain pending and appear in the next EMI.
                  </p>
                </div>
              )}



              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowMarkPaidModal(false);
                  setSelectedPaymentType('full');
                  setMarkPaidCharges('');
                  setLateChargePayment('');
                }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const loanId = selectedLoan?.id || selectedLoanId;
                  
                  let partialAmount, lateChargeAmount;
                  
                  if (selectedPaymentType === 'full') {
                    partialAmount = getTotalDue(markPaidEmi);
                    lateChargeAmount = 0; // Charges included in total amount
                  } else if (selectedPaymentType === 'emi_only') {
                    partialAmount = parseFloat(markPaidEmi.amount);
                    lateChargeAmount = 0; // EMI only payment
                  } else if (selectedPaymentType === 'partial') {
                    partialAmount = markPaidCharges && !isNaN(parseFloat(markPaidCharges)) 
                      ? parseFloat(markPaidCharges) 
                      : undefined;
                    lateChargeAmount = 0;
                  }
                  
                  await handleMarkPaid(loanId, markPaidEmi.emi_number, partialAmount, selectedPaymentMode, selectedPaymentType);
                  setShowMarkPaidModal(false);
                  setMarkPaidCharges('');
                  setLateChargePayment('');
                }}
                disabled={
                  selectedPaymentType === 'partial' && markPaidCharges && 
                    (isNaN(parseFloat(markPaidCharges)) || 
                     parseFloat(markPaidCharges) <= 0 || 
                     parseFloat(markPaidCharges) > parseFloat(markPaidEmi.amount))
                }
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                  💰 Mark EMI Paid
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LoansPage;

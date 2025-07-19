import React, { useEffect, useState } from 'react';
import { getMyLoans, getLoanDetails } from '../services/loan.service';

const MyLoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEmi, setShowEmi] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getDaysToNextEmi = (emis) => {
    if (!emis) return 'N/A';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEmis = emis
      .filter(
        (emi) => emi.status === 'pending' && new Date(emi.emi_date) >= today
      )
      .sort((a, b) => new Date(a.emi_date) - new Date(b.emi_date));

    if (upcomingEmis.length === 0) return 'N/A';

    const nextEmiDate = new Date(upcomingEmis[0].emi_date);
    const diffTime = nextEmiDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await getMyLoans();
      setLoans(res.data);
    } catch (err) {
      setError('Failed to fetch loans');
    }
    setLoading(false);
  };

  const handleSelectLoan = async (loanId) => {
    setLoading(true);
    setError('');
    try {
      const res = await getLoanDetails(loanId);
      setSelectedLoan(res.data);
      setShowEmi(true);
    } catch (err) {
      setError('Failed to fetch loan details');
    }
    setLoading(false);
  };

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col-12 col-lg-8 mx-auto">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="h5 mb-0">My Loans</h2>
            </div>
            <div className="card-body p-0">
              {error && <div className="alert alert-danger m-3">{error}</div>}
              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  ></div>
                </div>
              ) : loans.length === 0 ? (
                <div className="text-center py-4">No loans found.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Amount</th>
                        <th>Tenure (Days)</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Next EMI In</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map((loan) => {
                        const daysToNextEmi = getDaysToNextEmi(loan.EMIs);
                        return (
                          <tr key={loan.id}>
                            <td>{loan.id}</td>
                            <td>
                              ₹{Number(loan.loan_amount).toLocaleString()}
                            </td>
                            <td>{loan.total_emi_days}</td>
                            <td>{loan.start_date}</td>
                            <td>{loan.end_date}</td>
                            <td>{daysToNextEmi}</td>
                            <td>
                              <span
                                className={`badge bg-${
                                  loan.status === 'active'
                                    ? 'success'
                                    : 'secondary'
                                }`}
                              >
                                {loan.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-primary rounded fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow border border-primary"
                                onClick={() => handleSelectLoan(loan.id)}
                                title="View Details"
                                aria-label="View Details"
                                tabIndex={0}
                              >
                                <i className="bi bi-eye"></i>
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* EMI Modal */}
      {showEmi && selectedLoan && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content animate__animated animate__fadeInDown">
              <div className="modal-header">
                <h5 className="modal-title">
                  Loan Details (ID: {selectedLoan.loan.id} | Code:{' '}
                  {selectedLoan.loan.loan_code})
                </h5>
                <button
                  type="button"
                  className="btn btn-secondary rounded fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow border border-secondary"
                  onClick={() => setShowEmi(false)}
                  aria-label="Close"
                  tabIndex={0}
                >
                  <i className="bi bi-x-lg"></i>
                  Close
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-2">
                  Amount:{' '}
                  <b>
                    ₹{Number(selectedLoan.loan.loan_amount).toLocaleString()}
                  </b>
                </div>
                <div className="mb-2">
                  Tenure: <b>{selectedLoan.loan.tenure}</b> days
                </div>
                <div className="mb-2">
                  Per Day EMI:{' '}
                  <b>
                    ₹{Number(selectedLoan.loan.per_day_emi).toLocaleString()}
                  </b>
                </div>
                <div className="mb-2">
                  Status:{' '}
                  <span
                    className={`badge bg-${
                      selectedLoan.loan.status === 'active'
                        ? 'success'
                        : 'secondary'
                    }`}
                  >
                    {selectedLoan.loan.status}
                  </span>
                </div>
                <h6 className="mt-4">EMI Schedule</h6>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>EMI No.</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Paid At</th>
                        <th>Bounced Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.emis.map((emi, index) => (
                        <tr key={emi.id}>
                          <td>{index + 1}</td>
                          <td>{emi.emi_date}</td>
                          <td>₹{Number(emi.amount).toLocaleString()}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                emi.status === 'paid'
                                  ? 'success'
                                  : emi.status === 'bounced'
                                  ? 'danger'
                                  : 'warning'
                              }`}
                            >
                              {emi.status}
                            </span>
                          </td>
                          <td>{emi.paid_at}</td>
                          <td>{emi.bounced_reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedLoan.emis.length === 0 && (
                    <div className="text-center py-3">No EMIs found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLoansPage;

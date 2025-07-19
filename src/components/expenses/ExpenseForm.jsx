import React, { useState } from 'react';

const ExpenseForm = ({ form, onChange, onSubmit, submitting, onCancel }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.expense_name.trim()) errs.expense_name = 'Expense name is required';
    if (!form.reason.trim()) errs.reason = 'Reason is required';
    if (!form.amount_paid || Number(form.amount_paid) <= 0) errs.amount_paid = 'Amount must be positive';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(e);
  };

  return (
    <div
      className="modal fade show"
      style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', transition: 'background 0.3s' }}
      tabIndex="-1"
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog">
        <div className="modal-content animate__animated animate__fadeInDown">
          <div className="modal-header">
            <h5 className="modal-title">Add Expense</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
              aria-label="Close"
            ></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Expense Name</label>
                <input
                  type="text"
                  className={`form-control${errors.expense_name ? ' is-invalid' : ''}`}
                  name="expense_name"
                  value={form.expense_name}
                  onChange={onChange}
                  required
                />
                {errors.expense_name && <div className="invalid-feedback">{errors.expense_name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  className={`form-control${errors.reason ? ' is-invalid' : ''}`}
                  name="reason"
                  value={form.reason}
                  onChange={onChange}
                  required
                />
                {errors.reason && <div className="invalid-feedback">{errors.reason}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Amount Paid</label>
                <input
                  type="number"
                  className={`form-control${errors.amount_paid ? ' is-invalid' : ''}`}
                  name="amount_paid"
                  value={form.amount_paid}
                  onChange={onChange}
                  required
                  min="0"
                  step="0.01"
                />
                {errors.amount_paid && <div className="invalid-feedback">{errors.amount_paid}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm; 
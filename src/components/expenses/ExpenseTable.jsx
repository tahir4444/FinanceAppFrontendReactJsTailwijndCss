import React from 'react';

const ExpenseTable = ({ expenses, loading, totalAmount }) => {
  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>User</th>
            <th>Expense Name</th>
            <th>Reason</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="5" className="text-center py-5">
                <div className="spinner-border" role="status"></div>
              </td>
            </tr>
          ) : expenses.length === 0 ? (
            <tr>
              <td colSpan="5" className="text-center py-5">
                <div style={{ fontSize: '2rem', color: '#ccc' }}>
                  <i className="bi bi-wallet2"></i>
                </div>
                <div>No expenses found</div>
              </td>
            </tr>
          ) : (
            expenses.map((exp, idx) => (
              <tr key={`${exp.id}-${idx}`}>
                <td>{exp.User ? exp.User.name : 'N/A'}</td>
                <td>{exp.expense_name}</td>
                <td>{exp.reason}</td>
                <td>
                  <span
                    className={`badge bg-${
                      Number(exp.amount_paid) > 1000 ? 'danger' : 'success'
                    }`}
                  >
                    ₹{Number(exp.amount_paid).toLocaleString()}
                  </span>
                </td>
                <td>
                  {(() => {
                    const d = new Date(exp.created_at);
                    return (
                      d.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true,
                      }) +
                      ', ' +
                      d.toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    );
                  })()}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3" className="text-end fw-bold">
              Total Amount:
            </td>
            <td className="fw-bold">
              <span className="badge bg-primary">
                ₹{Number(totalAmount).toLocaleString()}
              </span>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ExpenseTable;

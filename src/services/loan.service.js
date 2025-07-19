import api from './axios';

export const createLoan = (data) => api.post('/loans', data);
export const getAllLoans = (params = {}) => {
  const { page = 1, limit = 10, ...rest } = params;
  return api.get('/loans', { params: { page, limit, ...rest } });
};
export const getMyLoans = () => api.get('/loans/my');
export const getLoanDetails = (loanId) => api.get(`/loans/${loanId}`);
export const getTodaysDueEMIs = (date) =>
  api.get('/loans/emis/due', { params: { date } });
export const markEmiPaid = (loanId, emiNumber, lateCharge) =>
  api.post(`/loans/${loanId}/emis/${emiNumber}/pay`, lateCharge !== undefined ? { late_charge: lateCharge } : {});
export const markEmiBounced = (loanId, emiNumber, reason) =>
  api.post(`/loans/${loanId}/emis/${emiNumber}/bounce`, { reason });
export const getCustomerLoanDashboard = () =>
  api.get('/loans/dashboard/customer');
export const getAgentEmiCollectionDashboard = (params = {}) =>
  api.get('/loans/dashboard/agent', { params });
export const getLoanCustomers = () =>
  api.get('/users', { params: { role: 'user', limit: 1000 } });
export const updateLoan = (loanId, data) => api.put(`/loans/${loanId}`, data);
export const clearLateCharges = (loanId) =>
  api.post(`/loans/${loanId}/clear-charges`);
export const exportLoans = (params = {}) =>
  api.get('/loans/export', { params, responseType: 'blob' });
export const getAdminDashboard = () => api.get('/loans/dashboard/admin');
export const getTopCustomers = () => api.get('/loans/dashboard/admin/top-customers');
export const getOverdueLoans = () => api.get('/loans/dashboard/admin/overdue-loans');
export const getRecentActivities = () => api.get('/loans/dashboard/admin/recent-activities');
export const getFinancialHealth = () => api.get('/loans/dashboard/admin/financial-health');
export const sendOverdueReminders = () => api.post('/loans/dashboard/admin/send-reminders');
export const getRecentTodos = () => api.get('/todos?limit=5&sort=desc');
export const getRecentExpenses = () => api.get('/expenses?limit=5&sort=desc');
export const payOverdueEmis = (loanId, lateCharge) =>
  api.post(`/loans/${loanId}/emis/pay-overdue`, lateCharge !== undefined ? { late_charge: lateCharge } : {});

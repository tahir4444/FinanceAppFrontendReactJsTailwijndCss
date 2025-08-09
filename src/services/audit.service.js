import api from './axios';

export const getAuditLogs = async (params = {}) => {
  const { page = 1, limit = 50, action = '', userId = '' } = params;
  const res = await api.get('/admin/audit-logs', {
    params: { page, limit, action: action || undefined, userId: userId || undefined },
  });
  return res.data;
};



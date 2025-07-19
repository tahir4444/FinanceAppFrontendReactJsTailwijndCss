import api from './axios';

export const getCreditReports = (params) => {
  return api.get('/reports', { params });
};

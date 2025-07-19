import axios from './axios';

// Get all support messages (admin only)
export const getAllSupportMessages = async (
  page = 1,
  limit = 10,
  filters = {}
) => {
  const response = await axios.get('/support', {
    params: {
      page,
      pageSize: limit,
      status: filters.status || '',
      search: filters.search || '',
    },
  });
  return {
    count: response.data.total,
    rows: response.data.data,
  };
};

// Update support message status (admin only)
export const updateSupportMessageStatus = async (id, status) => {
  const response = await axios.patch(`/support/${id}`, { status });
  return response.data;
};

// Get current user's support messages
export const getMySupportMessages = async () => {
  const response = await axios.get('/support/my');
  return response.data;
};

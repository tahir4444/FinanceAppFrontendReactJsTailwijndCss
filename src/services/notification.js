import axios from 'axios';

export const fetchNotifications = async (page = 1, limit = 20) => {
  const res = await axios.get(
    `/users/notifications?page=${page}&limit=${limit}`
  );
  return res.data;
};

export const sendNotification = async (data) => {
  // data: { user_ids, subject, description, image_url }
  const res = await axios.post('/users/notifications/send', data);
  return res.data;
};

export const fetchAllUsers = async () => {
  const res = await axios.get('/users');
  return res.data;
};

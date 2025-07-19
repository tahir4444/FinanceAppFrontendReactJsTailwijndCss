import axiosInstance from './axios';

export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post('/auth/login', {
      email,
      password,
    });
    if (!response.data || !response.data.user || !response.data.user.token) {
      throw new Error('Invalid login response');
    }
    return {
      token: response.data.user.token,
      user: response.data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    if (!response.data || !response.data.token) {
      throw new Error('Invalid registration response');
    }
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    if (!response.data || !response.data.user) {
      throw new Error('Invalid user data received');
    }
    return response.data;
  } catch (error) {
    console.error('Get me error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await axiosInstance.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axiosInstance.post('/auth/reset-password', {
      token,
      newPassword,
    });
    if (!response.data) {
      throw new Error('Invalid reset password response');
    }
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await axiosInstance.patch('/users/me/password', {
      currentPassword,
      newPassword,
    });
    if (!response.data) {
      throw new Error('Invalid change password response');
    }
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

const authService = {
  login,
  register,
  getMe,
  logout,
  resetPassword,
  changePassword,
};

export default authService;

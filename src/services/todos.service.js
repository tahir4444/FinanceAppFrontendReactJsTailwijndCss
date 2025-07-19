import axiosInstance from './axios';

export const getTodos = async (page = 1, limit = 20) => {
  try {
    const response = await axiosInstance.get('/todos', { params: { page, limit } });
    return response.data;
  } catch (error) {
    console.error('Error fetching todos:', error);
    throw error;
  }
};

export const createTodo = async (todoData) => {
  try {
    const response = await axiosInstance.post('/todos', todoData);
    return response.data;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
};

export const updateTodo = async (id, todoData) => {
  try {
    const response = await axiosInstance.put(`/todos/${id}`, todoData);
    return response.data;
  } catch (error) {
    console.error('Error updating todo:', error);
    throw error;
  }
};

export const deleteTodo = async (id) => {
  try {
    const response = await axiosInstance.delete(`/todos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw error;
  }
};
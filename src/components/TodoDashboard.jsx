import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add, CheckCircle, Pending } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const TodoDashboard = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get('/todos');
        setTodos(response.data);
      } catch (error) {
        console.error('Error fetching todos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  return (
    <div className="animate-fade-in">{/* ... rest of the component ... */}</div>
  );
};

export default TodoDashboard;

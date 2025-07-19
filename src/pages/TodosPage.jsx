import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from '../services/todos.service';
import TodoList from '../components/todos/TodoList';
import '../index.css';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  FiCheckSquare,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiList,
  FiSearch,
} from 'react-icons/fi';
dayjs.extend(utc);
dayjs.extend(timezone);

const TodosPage = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const observer = useRef();
  const sentinelRef = useRef();

  // Calculate stats
  const stats = {
    total: todos.length,
    completed: todos.filter((todo) => todo.completed).length,
    pending: todos.filter((todo) => !todo.completed).length,
    completionRate:
      todos.length > 0
        ? Math.round(
            (todos.filter((todo) => todo.completed).length / todos.length) * 100
          )
        : 0,
  };

  // Infinite scroll: fetch next page when sentinel is visible
  const lastTodoElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, page, totalPages]
  );

  // Fetch todos on mount and page change
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchTodos(page);
  }, [user, page]);

  const fetchTodos = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await getTodos(pageNum, limit);
      if (pageNum === 1) {
        setTodos(res.todos);
      } else {
        setTodos((prev) => [...prev, ...res.todos]);
      }
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setError(null);
    } catch (err) {
      setError('Failed to fetch todos');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await createTodo({
        title: newTodo.trim(),
        completed: false,
      });
      setTodos([...todos, response]);
      setNewTodo('');
      setError(null);
      toast.success('Task added successfully');
    } catch (err) {
      setError('Failed to add todo');
      console.error('Error adding todo:', err);
      toast.error('Failed to add task');
    }
  };

  const handleTodoUpdated = (updatedTodo) => {
    setTodos(
      todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo))
    );
  };

  const handleTodoDeleted = (todoId) => {
    setTodos(todos.filter((todo) => todo.id !== todoId));
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingTodo) return;

    try {
      const response = await updateTodo(editingTodo.id, {
        ...editingTodo,
        title: editTitle.trim(),
      });
      setTodos(
        todos.map((todo) => (todo.id === editingTodo.id ? response : todo))
      );
      setEditingTodo(null);
      setEditTitle('');
      toast.success('Task updated successfully');
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
      toast.error('Failed to update task');
    }
  };

  const toggleTodo = async (todoId) => {
    try {
      const todoToUpdate = todos.find((todo) => todo.id === todoId);
      if (!todoToUpdate) {
        throw new Error('Todo not found');
      }

      const response = await updateTodo(todoId, {
        completed: !todoToUpdate.completed,
      });
      setTodos(todos.map((todo) => (todo.id === todoId ? response : todo)));
      toast.success('Task status updated successfully');
    } catch (err) {
      setError('Failed to update todo');
      console.error('Error updating todo:', err);
      toast.error('Failed to update task');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Task Management
            </h1>
            <p className="text-gray-600">
              Organize your tasks, track progress, and boost productivity with
              our task management system.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiList className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <FiClock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Completion Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Todo Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <form onSubmit={handleAddTodo} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a new task..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={!newTodo.trim()}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Task
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="text-sm font-medium text-gray-700">
          Total Tasks: {total}
        </div>
        <div className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </div>
      </div>

      {/* Todos List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {todos.length === 0 && !loading ? (
          <div className="text-center py-12">
            <FiList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new task.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  todo.completed ? 'bg-green-50' : ''
                }`}
                ref={index === todos.length - 1 ? lastTodoElementRef : null}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && (
                        <svg
                          className="w-3 h-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingTodo && editingTodo.id === todo.id ? (
                        <form
                          onSubmit={handleUpdateTodo}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTodo(null);
                              setEditTitle('');
                            }}
                            className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <span
                            className={`text-sm font-medium ${
                              todo.completed
                                ? 'text-gray-500 line-through'
                                : 'text-gray-900'
                            }`}
                          >
                            {todo.title}
                          </span>
                          {todo.completed && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          )}
                        </div>
                      )}
                      {todo.created_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Created:{' '}
                          {new Date(todo.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!todo.completed && (
                      <button
                        onClick={() => handleEdit(todo)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleTodoDeleted(todo.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default TodosPage;

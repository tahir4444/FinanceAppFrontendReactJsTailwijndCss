import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { toast } from 'react-toastify';
// Remove Bootstrap import
// import 'bootstrap/dist/css/bootstrap.min.css';
import '../index.css';
import AdminDashboard from './AdminDashboard';
import AgentDashboard from './AgentDashboard';
import { getTodos } from '../services/todos.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const DashboardPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  // Debug: log the user object
  console.log('User object in DashboardPage:', user);
  const [todos, setTodos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });
  const [editingTodo, setEditingTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loanDashboard, setLoanDashboard] = useState(null);
  const [agentEmis, setAgentEmis] = useState([]);
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Check user role and redirect accordingly
    const userRole = user?.role || user?.Role?.name;
    console.log('User role in DashboardPage:', userRole);
    
    if (userRole === 'agent') {
      navigate('/agent-dashboard');
      return;
    }
    
    fetchTodos();
    // Force light theme
    if (theme === 'dark') {
      toggleTheme();
    }
    // Fetch user role from context or localStorage
    const userRoleFromStorage = JSON.parse(localStorage.getItem('user'))?.role;
    if (userRoleFromStorage) setRole(userRoleFromStorage);
    if (userRoleFromStorage === 'user') fetchCustomerLoanDashboard();
    if (
      userRoleFromStorage === 'admin' ||
      userRoleFromStorage === 'superadmin'
    )
      fetchAgentEmiDashboard();
  }, [user, navigate, theme, toggleTheme]);

  const fetchTodos = async () => {
    try {
      const fetchedTodos = await getTodos();
      const todosArr = fetchedTodos.todos || [];
      setTodos(todosArr);

      // Calculate stats
      const total = todosArr.length;
      const completed = todosArr.filter((todo) => todo.completed).length;
      const pending = total - completed;

      setStats({ total, completed, pending });
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Failed to fetch todos');
    }
  };

  const handleStatusChange = async (todoId, currentStatus) => {
    try {
      await updateTodo(todoId, { completed: !currentStatus });
      fetchTodos(); // Refresh the list
      toast.success('Task status updated successfully');
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleDelete = async (todoId) => {
    try {
      await deleteTodo(todoId);
      fetchTodos(); // Refresh the list
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      await updateTodo(editingTodo._id, {
        ...editingTodo,
        title: editTitle.trim(),
      });
      setEditingTodo(null);
      setEditTitle('');
      toast.success('Task updated successfully');
      fetchTodos(); // Refresh stats
    } catch (error) {
      console.error('Error updating todo:', error);
      toast.error('Failed to update task');
    }
  };

  const fetchCustomerLoanDashboard = async () => {
    try {
      const res = await getCustomerLoanDashboard();
      setLoanDashboard(res.data);
    } catch (err) {
      setLoanDashboard(null);
    }
  };

  const fetchAgentEmiDashboard = async () => {
    try {
      const res = await getAgentEmiCollectionDashboard();
      setAgentEmis(res.data);
    } catch (err) {
      setAgentEmis([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto py-8 px-2 sm:px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.name || 'User'}!
          </h1>
        </div>
        {/* Show AdminDashboard for admin/superadmin, regular dashboard for users */}
        {(() => {
          console.log('DashboardPage: User role check:', {
            role: user?.role,
            roleName: user?.Role?.name,
            user: user,
          });

          return user?.role === 'admin' ||
            user?.role === 'superadmin' ||
            user?.Role?.name === 'admin' ||
            user?.Role?.name === 'superadmin' ? (
            <AdminDashboard />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 className="text-lg font-semibold mb-2">Total Tasks</h5>
                  <p className="text-4xl font-bold text-blue-600">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 className="text-lg font-semibold mb-2">
                    Completed Tasks
                  </h5>
                  <p className="text-4xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
                  <h5 className="text-lg font-semibold mb-2">Pending Tasks</h5>
                  <p className="text-4xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow">
                <div className="border-b px-6 py-4">
                  <h5 className="mb-0 text-lg font-semibold">Task List</h5>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Task
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {todos.map((todo) => (
                        <tr key={todo._id}>
                          <td>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() =>
                                  handleStatusChange(todo._id, todo.completed)
                                }
                                id={`todo-${todo._id}`}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`todo-${todo._id}`}
                              >
                                {todo.title}
                              </label>
                            </div>
                          </td>
                          <td>{todo.completed ? 'Completed' : 'Pending'}</td>
                          <td>
                            {dayjs(todo.createdAt)
                              .tz('Asia/Kolkata')
                              .format('YYYY-MM-DD')}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleEdit(todo)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(todo._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Edit Todo Modal */}
      {editingTodo && (
        <div
          className="modal fade show"
          style={{ display: 'block' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setEditingTodo(null);
                    setEditTitle('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpdateTodo}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="editTitle" className="form-label">
                      Task Title
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="editTitle"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditingTodo(null);
                      setEditTitle('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {editingTodo && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default DashboardPage;

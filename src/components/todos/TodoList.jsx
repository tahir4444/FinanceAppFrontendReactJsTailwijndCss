import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { toast } from 'react-toastify';

const TodoList = ({
  todos,
  onTodoUpdated,
  onTodoDeleted,
  onEdit,
  showEditButton = true,
}) => {
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async (id, completed) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        throw new Error('Todo not found');
      }

      const response = await axios.put(
        `${API_BASE_URL}/todos/${id}`,
        {
          ...todo,
          completed: !completed,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onTodoUpdated(response.data);
      toast.success('Todo updated successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const errorMessage =
          error.response?.data?.message || 'Failed to update todo';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please login again.');
        return;
      }

      await axios.delete(`${API_BASE_URL}/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      onTodoDeleted(id);
      toast.success('Todo deleted successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else {
        const errorMessage =
          error.response?.data?.message || 'Failed to delete todo';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (todos.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        No todos found. Add one to get started!
      </div>
    );
  }

  return (
    <div className="list-group">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2 mb-2 rounded-2 border-0 ${
            todo.completed ? 'bg-light' : 'bg-white'
          }`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo.id, todo.completed)}
                style={{
                  width: '1rem',
                  height: '1rem',
                  cursor: 'pointer',
                  borderColor: todo.completed ? '#198754' : '#dee2e6',
                }}
              />
            </div>
            <div>
              <h6
                className={`mb-0 fw-semibold ${
                  todo.completed
                    ? 'text-decoration-line-through text-muted'
                    : ''
                }`}
              >
                {todo.title}
              </h6>
              <span
                className={`badge rounded-pill px-2 py-0 ${
                  todo.completed
                    ? 'bg-success bg-opacity-10 text-success'
                    : 'bg-warning bg-opacity-10 text-warning'
                }`}
              >
                {todo.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="d-flex gap-1">
            <button
              className={`btn ${
                todo.completed ? 'btn-danger' : 'btn-primary'
              } rounded fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow border ${
                todo.completed ? 'border-danger' : 'border-primary'
              }`}
              onClick={() => handleToggleComplete(todo.id, todo.completed)}
              disabled={loading}
              title={todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
              aria-label={todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
              tabIndex={0}
            >
              <i
                className={`bi ${
                  todo.completed ? 'bi-x-circle' : 'bi-check-circle'
                } fs-6`}
              ></i>
              {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            {showEditButton && (
              <button
                className="btn btn-secondary rounded fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow border border-secondary"
                onClick={() => onEdit(todo)}
                disabled={loading}
                title="Edit"
                aria-label="Edit"
                tabIndex={0}
              >
                <i className="bi bi-pencil fs-6"></i>
                Edit
              </button>
            )}
            <button
              className="btn btn-danger rounded fw-bold d-flex align-items-center gap-2 px-4 py-2 shadow border border-danger"
              onClick={() => handleDelete(todo.id)}
              disabled={loading}
              title="Delete"
              aria-label="Delete"
              tabIndex={0}
            >
              <i className="bi bi-trash fs-6"></i>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodoList;

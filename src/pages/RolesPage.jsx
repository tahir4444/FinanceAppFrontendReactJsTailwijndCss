import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../services/roles.service';
import {
  FiShield,
  FiUsers,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiEye,
  FiTrendingUp,
  FiCheckCircle,
} from 'react-icons/fi';

const RolesPage = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    permissions: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Calculate stats
  const stats = {
    total: roles.length,
    active: roles.filter((role) => role.is_active !== false).length,
    inactive: roles.filter((role) => role.is_active === false).length,
    systemRoles: roles.filter((role) => role.is_system_role).length,
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await getRoles();
      setRoles(response.data || response);
    } catch (error) {
      toast.error('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, form);
        toast.success('Role updated successfully');
      } else {
        await createRole(form);
        toast.success('Role created successfully');
      }
      setShowForm(false);
      setEditingRole(null);
      setForm({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRole(roleId);
        toast.success('Role deleted successfully');
        fetchRoles();
      } catch (error) {
        toast.error('Failed to delete role');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRole(null);
    setForm({ name: '', description: '', permissions: [] });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Role Management
            </h1>
            <p className="text-gray-600">
              Manage user roles, permissions, and access controls for your
              application.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Add Role
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-lg">
              <FiShield className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Roles</p>
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
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Inactive Roles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inactive}
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
              <p className="text-sm font-medium text-gray-600">System Roles</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.systemRoles}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <div className="flex justify-center items-center py-6">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4">
                    <div className="text-center py-8">
                      <FiShield className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No roles
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new role.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {role.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {role.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.is_active !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {role.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          role.is_system_role
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {role.is_system_role ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {role.created_at
                          ? new Date(role.created_at).toLocaleDateString()
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(role)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit role"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        {!role.is_system_role && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete role"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Role Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingRole ? 'Edit Role' : 'Add New Role'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter role description"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting
                    ? 'Saving...'
                    : editingRole
                    ? 'Update Role'
                    : 'Add Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default RolesPage;

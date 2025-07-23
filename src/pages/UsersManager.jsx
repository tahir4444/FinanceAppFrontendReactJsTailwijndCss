import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axiosInstance from '../services/axios';
import { FaTrash, FaTimes } from 'react-icons/fa';
import '../index.css';
import './UsersManager.css';

const EmptyState = ({ onAddClick }) => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="mb-4">
      <svg
        className="w-16 h-16 text-blue-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4v2a2 2 0 01-2 2h-1.5M3 16v2a2 2 0 002 2h1.5"
        />
      </svg>
    </div>
    <h3 className="text-2xl font-bold mb-2 text-gray-800">No Users Found</h3>
    <p className="text-gray-500 mb-4">
      Get started by creating your first user. Users can be assigned roles to
      control their access to different features.
    </p>
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow"
      onClick={onAddClick}
    >
      + Create Your First User
    </button>
  </div>
);

const UsersManager = () => {
  const { user, hasAnyRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [referenceUsers, setReferenceUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    is_active: true,
    mobile: '',
    address: '',
    profile_pic: null,
    pan_card: null,
    voter_card: null,
    adhaar_card: null,
    bank_check: null,
    agent_qr_code: null,
    reference_customer_id: '',
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(12); // Cards per page
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const searchTimeout = useRef();
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
  ];
  const [referenceUserSearch, setReferenceUserSearch] = useState('');
  const [showReferenceUserDropdown, setShowReferenceUserDropdown] =
    useState(false);
  const referenceUserInputRef = useRef(null);
  const [referenceModalOpen, setReferenceModalOpen] = useState(false);
  const [referenceUser, setReferenceUser] = useState(null);
  const observer = useRef();
  const sentinelRef = useRef();
  const [fieldErrors, setFieldErrors] = useState({});

  const imageFields = [
    { key: 'profile_pic', label: 'Profile Picture' },
    { key: 'pan_card', label: 'PAN Card' },
    { key: 'voter_card', label: 'Voter Card' },
    { key: 'adhaar_card', label: 'Aadhaar Card' },
    { key: 'bank_check', label: 'Bank Check' },
    { key: 'agent_qr_code', label: 'Agent QR Code' },
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!hasAnyRole(['admin', 'superadmin'])) {
      toast.error('You do not have permission to access this page');
      navigate('/dashboard');
      return;
    }

    fetchUsers(page, search, roleFilter);
    fetchRoles();
    fetchReferenceUsers();
  }, [user, navigate, hasAnyRole, page, search, roleFilter]);

  // Infinite scroll: fetch next page when sentinel is visible
  const lastUserElementRef = useCallback(
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

  // Append users on scroll, reset on filter/search
  useEffect(() => {
    if (page === 1) {
      fetchUsers(1, search, roleFilter);
    } else {
      fetchUsers(page, search, roleFilter, true);
    }
    // eslint-disable-next-line
  }, [page]);

  const fetchUsers = async (
    pageNum = 1,
    searchTerm = '',
    role = '',
    append = false
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit,
      });
      if (searchTerm) params.append('search', searchTerm);
      if (role) params.append('role', role);
      const response = await axiosInstance.get(`/users?${params.toString()}`);
      if (append) {
        setUsers((prev) => [...prev, ...response.data.users]);
      } else {
        setUsers(response.data.users);
      }
      setTotal(response.data.total);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get('/roles');
      // Filter out superadmin role from the dropdown
      const filteredRoles = response.data.filter(
        (role) => role.name !== 'superadmin'
      );
      setRoles(filteredRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    }
  };

  const fetchReferenceUsers = async () => {
    try {
      const response = await axiosInstance.get('/users?page=1&limit=1000');
      setReferenceUsers(response.data.users || []);
    } catch (error) {
      setReferenceUsers([]);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      // Robustly extract roleId
      const roleId =
        user.roleId || user.role_id || user.Role?.id || user.Role?._id || '';
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        roleId,
        is_active: user.is_active,
        mobile: user.mobile,
        address: user.address,
        profile_pic: user.profile_pic,
        pan_card: user.pan_card,
        voter_card: user.voter_card,
        adhaar_card: user.adhaar_card,
        bank_check: user.bank_check,
        agent_qr_code: user.agent_qr_code,
        reference_customer_id: user.reference_customer_id,
      });
      const refUser = referenceUsers.find(
        (u) => u.id === user.reference_customer_id
      );
      setReferenceUserSearch(
        refUser ? `${refUser.name} (${refUser.email})` : ''
      );
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        roleId: '',
        is_active: true,
        mobile: '',
        address: '',
        profile_pic: null,
        pan_card: null,
        voter_card: null,
        adhaar_card: null,
        bank_check: null,
        agent_qr_code: null,
        reference_customer_id: '',
      });
      setReferenceUserSearch('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      roleId: '',
      is_active: true,
      mobile: '',
      address: '',
      profile_pic: null,
      pan_card: null,
      voter_card: null,
      adhaar_card: null,
      bank_check: null,
      agent_qr_code: null,
      reference_customer_id: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'roleId' || name === 'reference_customer_id'
          ? Number(value)
          : type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const handleDeleteImage = async (field) => {
    if (!editingUser) {
      // For new users, just clear the field
      setFormData((prev) => ({
        ...prev,
        [field]: null,
      }));
      return;
    }

    try {
      // For agent_qr_code, use the separate endpoint
      if (field === 'agent_qr_code') {
        await axiosInstance.delete(`/users/${editingUser.id}/agent-qr`);
      } else {
        await axiosInstance.delete(`/users/${editingUser.id}/image`, {
          data: { field },
        });
      }

      // Update the form data to reflect the deletion
      setFormData((prev) => ({
        ...prev,
        [field]: null,
      }));

      toast.success(`${field.replace('_', ' ')} deleted successfully`);
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleImageReplacement = (field, file) => {
    // When a new image is uploaded, automatically delete the old one
    if (editingUser && formData[field] && typeof formData[field] === 'string') {
      // The old image will be automatically deleted by the backend when the new one is uploaded
      console.log(`Replacing ${field} with new file`);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error('Please upload only image files (JPG, PNG, etc.)');
        return;
      }

      // Handle image replacement
      handleImageReplacement(name, file);
    }
  };

  const handleSubmit = async () => {
    let errors = {};
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    // Email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Invalid email address';
    }
    // Password validation (only for new users)
    if (!editingUser) {
      if (!formData.password) {
        errors.password = 'Password is required for new users';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }
    // Role validation
    if (!formData.roleId) errors.roleId = 'Role is required';
    // Mobile validation (Indian mobile: 10 digits, starts with 6-9)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile is required';
    } else if (!mobileRegex.test(formData.mobile.trim())) {
      errors.mobile = 'Invalid mobile number';
    }
    // Reference customer validation
    if (!formData.reference_customer_id) errors.reference_customer_id = 'Reference customer is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix the errors in the form');
      return;
    }
    // Validate all files before submit
    const fileFields = [
      'profile_pic',
      'pan_card',
      'voter_card',
      'adhaar_card',
      'bank_check',
      'agent_qr_code',
    ];
    for (const field of fileFields) {
      const file = formData[field];
      if (file && file instanceof File && file.size > MAX_FILE_SIZE) {
        toast.error(`${field.replace('_', ' ')} must be less than 2MB`);
        return;
      }
      if (
        file &&
        file instanceof File &&
        !ALLOWED_IMAGE_TYPES.includes(file.type)
      ) {
        toast.error(
          `${field.replace(
            '_',
            ' '
          )} must be an image file (jpg, png, gif, webp)`
        );
        return;
      }
    }

    // Validate agent_qr_code separately
    if (formData.agent_qr_code && formData.agent_qr_code instanceof File) {
      if (formData.agent_qr_code.size > MAX_FILE_SIZE) {
        toast.error('Agent QR code must be less than 2MB');
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(formData.agent_qr_code.type)) {
        toast.error(
          'Agent QR code must be an image file (jpg, png, gif, webp)'
        );
        return;
      }
    }

    try {
      const submitData = new FormData();
      console.log('Submitting reference_customer_id:', formData.reference_customer_id, typeof formData.reference_customer_id);
      Object.entries(formData).forEach(([key, value]) => {
        if (fileFields.includes(key)) {
          // Append if value is a File (new upload) or if it's a string (existing file path)
          if (value && (value instanceof File || typeof value === 'string')) {
            submitData.append(key, value);
          }
        } else if (key === 'roleId') {
          // Map roleId to role_id for backend compatibility
          submitData.append('role_id', value);
        } else if (key !== 'agent_qr_code' && key !== 'roleId') {
          // For reference_customer_id, always send as number if present
          if (key === 'reference_customer_id' && value) {
            submitData.append(key, Number(value));
          } else {
            submitData.append(key, value);
          }
        }
      });

      if (editingUser) {
        await axiosInstance.put(
          `/users/${editingUser._id || editingUser.id}`,
          submitData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );

        // Handle agent_qr_code upload separately if it's a new file
        if (formData.agent_qr_code && formData.agent_qr_code instanceof File) {
          const qrFormData = new FormData();
          qrFormData.append('agent_qr_code', formData.agent_qr_code);

          await axiosInstance.patch(
            `/users/${editingUser._id || editingUser.id}/agent-qr`,
            qrFormData,
            {
              headers: { 'Content-Type': 'multipart/form-data' },
            }
          );
        }

        toast.success('User updated successfully');
      } else {
        await axiosInstance.post('/users', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        // For new users, we can't upload QR code yet as we don't have the user ID
        // The QR code will need to be uploaded after user creation
        if (formData.agent_qr_code && formData.agent_qr_code instanceof File) {
          toast.info(
            'User created successfully. Please upload QR code after user creation.'
          );
        } else {
          toast.success('User created successfully');
        }
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
      const backendMsg = error.response?.data?.message;
      if (backendMsg && backendMsg.toLowerCase().includes('reference customer')) {
        setFieldErrors((prev) => ({ ...prev, reference_customer_id: backendMsg }));
      }
      if (backendMsg && backendMsg.toLowerCase().includes('mobile')) {
        setFieldErrors((prev) => ({ ...prev, mobile: backendMsg }));
      }
      toast.error(backendMsg || 'Failed to save user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/users/${userId}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  // Search input handler with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
    }, 400);
  };

  // Role filter handler
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  // Filter reference users by name or email
  const filteredReferenceUsers = referenceUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(referenceUserSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(referenceUserSearch.toLowerCase())
  );

  // Helper to get image URL
  const getImageUrl = (val) => {
    if (!val) return '';
    if (typeof val !== 'string') return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;
    // Backend now returns full URLs, so just return the value as is
    return val;
  };

  const handleOpenReferenceModal = async (referenceUserId) => {
    // Try to find in loaded users first
    let refUser = users.find((u) => u.id === referenceUserId);
    if (!refUser && referenceUsers.length > 0) {
      refUser = referenceUsers.find((u) => u.id === referenceUserId);
    }
    if (refUser) {
      setReferenceUser(refUser);
      setReferenceModalOpen(true);
    } else {
      // Fallback: fetch from backend
      try {
        const response = await axiosInstance.get(`/users/${referenceUserId}`);
        setReferenceUser(response.data);
        setReferenceModalOpen(true);
      } catch (error) {
        toast.error('Failed to fetch reference user details');
      }
    }
  };

  const handleCloseReferenceModal = () => {
    setReferenceModalOpen(false);
    setReferenceUser(null);
  };

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewModalIndex, setViewModalIndex] = useState(0);
  const [viewModalImages, setViewModalImages] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);

  const openLightbox = (images, startIndex = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxImages([]);
    setLightboxIndex(0);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex(
      (prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length
    );
  };

  const openImageViewModal = (fieldName) => {
    const images = [];
    let startIndex = 0;

    // Use editingUser data instead of formData for image URLs
    const userData = editingUser || {};

    console.log('Opening image view modal for field:', fieldName);
    console.log('User data:', userData);

    imageFields.forEach((field, index) => {
      const imageUrl = getImageUrl(userData[field.key]);
      console.log(
        `Field ${field.key}:`,
        userData[field.key],
        '-> URL:',
        imageUrl
      );
      if (imageUrl) {
        images.push({
          url: imageUrl,
          label: field.label,
          field: field.key,
        });
        if (field.key === fieldName) {
          startIndex = images.length - 1; // Use the actual index in the images array
        }
      }
    });

    if (images.length > 0) {
      console.log(
        'Opening lightbox with images:',
        images,
        'startIndex:',
        startIndex
      );
      openLightbox(images, startIndex);
    } else {
      console.log('No images found for lightbox');
    }
  };

  const closeImageViewModal = () => {
    setViewModalOpen(false);
  };

  const showPrevImage = (e) => {
    e.stopPropagation();
    setViewModalIndex(
      (prev) => (prev - 1 + viewModalImages.length) % viewModalImages.length
    );
  };
  const showNextImage = (e) => {
    e.stopPropagation();
    setViewModalIndex((prev) => (prev + 1) % viewModalImages.length);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Users Management
          </h1>
          <p className="text-gray-600 mb-2">
            Manage your application users and their roles. Add, edit, or remove
            users as your team grows.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              placeholder="Search users by name or email..."
              value={search}
              onChange={handleSearchChange}
            />
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id || role._id} value={role.name}>
                  {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow self-start"
          onClick={() => handleOpenDialog()}
        >
          + Add User
        </button>
      </div>
      {/* User Table or Empty State */}
      {users.length === 0 && !loading ? (
        <EmptyState onAddClick={handleOpenDialog} />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    <img
                      src={
                        getImageUrl(u.profile_pic) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          u.name
                        )}`
                      }
                      alt={u.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                    <span className="font-medium text-gray-900">{u.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {u.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {u.Role?.name || u.role || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {u.mobile || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {u.is_active ? (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                      onClick={() => handleOpenDialog(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 font-medium"
                      onClick={() => handleDelete(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <div className="flex justify-center items-center py-6">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}
        </div>
      )}
      {/* Pagination or infinite scroll can be added here if needed */}
      {/* User dialog/modal code remains unchanged, but should be styled with Tailwind if shown */}

      {/* Edit/Add User Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {fieldErrors.name && (
                  <div className="text-red-600 text-sm mt-1">{fieldErrors.name}</div>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {fieldErrors.email && (
                  <div className="text-red-600 text-sm mt-1">{fieldErrors.email}</div>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {editingUser
                    ? 'New Password (leave blank to keep current)'
                    : 'Password'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  required={!editingUser}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!editingUser && fieldErrors.password && (
                  <div className="text-red-600 text-sm mt-1">{fieldErrors.password}</div>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="roleId"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Role
                </label>
                {formData.roleId && (
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                      Selected:{' '}
                      {roles.find((r) => (r.id || r._id) === formData.roleId)
                        ?.name || 'Role'}
                    </span>
                  </div>
                )}
                <select
                  id="roleId"
                  name="roleId"
                  value={formData.roleId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option
                      key={role.id || role._id}
                      value={role.id || role._id}
                    >
                      {role.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.roleId && (
                  <div className="text-red-600 text-sm mt-1">{fieldErrors.roleId}</div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 text-sm font-semibold text-gray-700"
                  >
                    Active
                  </label>
                </div>
              </div>

              {/* Mobile */}
              <div>
                <label
                  htmlFor="mobile"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Mobile
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile || ''}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {fieldErrors.mobile && (
                  <div className="text-red-600 text-sm mt-1">{fieldErrors.mobile}</div>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  rows="2"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {/* Profile Picture */}
              <div>
                <label
                  htmlFor="profile_pic"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Profile Picture
                </label>
                {formData.profile_pic &&
                  typeof formData.profile_pic === 'string' && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={getImageUrl(formData.profile_pic)}
                        alt="Profile"
                        className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewModal('profile_pic')}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('profile_pic')}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        title="Delete image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                <input
                  type="file"
                  id="profile_pic"
                  name="profile_pic"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* PAN Card */}
              <div>
                <label
                  htmlFor="pan_card"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  PAN Card
                </label>
                {formData.pan_card && typeof formData.pan_card === 'string' && (
                  <div className="mb-2 relative inline-block">
                    <img
                      src={getImageUrl(formData.pan_card)}
                      alt="PAN Card"
                      className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openImageViewModal('pan_card')}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage('pan_card')}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                      title="Delete image"
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  id="pan_card"
                  name="pan_card"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Voter Card */}
              <div>
                <label
                  htmlFor="voter_card"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Voter Card
                </label>
                {formData.voter_card &&
                  typeof formData.voter_card === 'string' && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={getImageUrl(formData.voter_card)}
                        alt="Voter Card"
                        className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewModal('voter_card')}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('voter_card')}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        title="Delete image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                <input
                  type="file"
                  id="voter_card"
                  name="voter_card"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Aadhaar Card */}
              <div>
                <label
                  htmlFor="adhaar_card"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Aadhaar Card
                </label>
                {formData.adhaar_card &&
                  typeof formData.adhaar_card === 'string' && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={getImageUrl(formData.adhaar_card)}
                        alt="Aadhaar Card"
                        className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewModal('adhaar_card')}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('adhaar_card')}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        title="Delete image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                <input
                  type="file"
                  id="adhaar_card"
                  name="adhaar_card"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Bank Check */}
              <div>
                <label
                  htmlFor="bank_check"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Bank Check
                </label>
                {formData.bank_check &&
                  typeof formData.bank_check === 'string' && (
                    <div className="mb-2 relative inline-block">
                      <img
                        src={getImageUrl(formData.bank_check)}
                        alt="Bank Check"
                        className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openImageViewModal('bank_check')}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('bank_check')}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                        title="Delete image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                <input
                  type="file"
                  id="bank_check"
                  name="bank_check"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Agent QR Code (only for agent, admin, superadmin) */}
              {(roles.find((r) => (r.id || r._id) === formData.roleId)?.name ===
                'agent' ||
                roles.find((r) => (r.id || r._id) === formData.roleId)?.name ===
                  'admin' ||
                roles.find((r) => (r.id || r._id) === formData.roleId)?.name ===
                  'superadmin') && (
                <div>
                  <label
                    htmlFor="agent_qr_code"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Agent QR Code
                  </label>
                  {formData.agent_qr_code &&
                    typeof formData.agent_qr_code === 'string' && (
                      <div className="mb-2 relative inline-block">
                        <img
                          src={getImageUrl(formData.agent_qr_code)}
                          alt="Agent QR Code"
                          className="w-20 h-20 rounded-lg border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => openImageViewModal('agent_qr_code')}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage('agent_qr_code')}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                          title="Delete QR code"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                  <input
                    type="file"
                    id="agent_qr_code"
                    name="agent_qr_code"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              {/* Reference Customer */}
              <div>
                <label
                  htmlFor="reference_customer_id"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Reference Customer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for a reference user..."
                    value={referenceUserSearch}
                    onChange={(e) => {
                      setReferenceUserSearch(e.target.value);
                      setShowReferenceUserDropdown(true);
                    }}
                    onFocus={() => setShowReferenceUserDropdown(true)}
                    ref={referenceUserInputRef}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showReferenceUserDropdown && (
                    <div className="absolute w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredReferenceUsers.length === 0 ? (
                        <div className="p-3 text-center text-gray-500">
                          No users found
                        </div>
                      ) : (
                        filteredReferenceUsers
                          .filter(
                            (u) => !editingUser || u.id !== editingUser.id
                          )
                          .map((u) => (
                            <div
                              key={u.id}
                              className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  reference_customer_id: Number(u.id), // Ensure it's a number
                                }));
                                setReferenceUserSearch(`${u.name} (${u.email})`);
                                setShowReferenceUserDropdown(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">
                                {u.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {u.email}
                              </div>
                            </div>
                          ))
                      )}
                      {formData.reference_customer_id && (
                        <div
                          className="p-3 text-center cursor-pointer border-t border-gray-200 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              reference_customer_id: '',
                            }));
                            setReferenceUserSearch('');
                            setShowReferenceUserDropdown(false);
                          }}
                        >
                          Clear selection
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="hidden"
                    name="reference_customer_id"
                    value={formData.reference_customer_id || ''}
                  />
                  {fieldErrors.reference_customer_id && (
                    <div className="text-red-600 text-sm mt-1">{fieldErrors.reference_customer_id}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCloseDialog}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {editingUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reference User Modal */}
      {referenceModalOpen && referenceUser && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content animate__animated animate__fadeInDown"
              style={{
                borderRadius: '1.25rem',
                boxShadow: '0 8px 32px rgba(37,99,235,0.15)',
              }}
            >
              <div
                className="modal-header bg-primary text-white"
                style={{
                  borderTopLeftRadius: '1.25rem',
                  borderTopRightRadius: '1.25rem',
                }}
              >
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <i
                    className="bi bi-person-circle"
                    style={{ fontSize: '1.5em' }}
                  ></i>
                  Reference User Details
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseReferenceModal}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex flex-column align-items-center mb-3">
                  {referenceUser.profile_pic ? (
                    <img
                      src={
                        referenceUser.profile_pic?.startsWith('http')
                          ? referenceUser.profile_pic
                          : getImageUrl(referenceUser.profile_pic)
                      }
                      alt={referenceUser.name}
                      className="rounded-circle shadow-sm mb-2"
                      style={{
                        width: '90px',
                        height: '90px',
                        objectFit: 'cover',
                        border: '3px solid #e7f1ff',
                        background: '#fff',
                      }}
                    />
                  ) : (
                    <i
                      className="bi bi-person-circle text-primary"
                      style={{ fontSize: '3.5em' }}
                    ></i>
                  )}
                  <h4 className="fw-bold mt-2 mb-0">{referenceUser.name}</h4>
                  <span className="badge bg-secondary-subtle text-secondary mt-2">
                    Reference User
                  </span>
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Email:</span>{' '}
                  {referenceUser.email ? (
                    <a
                      href={`mailto:${referenceUser.email}`}
                      className="text-decoration-none text-primary fw-semibold"
                      style={{ wordBreak: 'break-all' }}
                    >
                      {referenceUser.email}
                    </a>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </div>
                <div className="mb-2">
                  <span className="fw-semibold">Phone:</span>{' '}
                  {referenceUser.mobile ? (
                    <a
                      href={`tel:${referenceUser.mobile}`}
                      className="text-decoration-none text-primary fw-semibold"
                    >
                      {referenceUser.mobile}
                    </a>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </div>
                <div className="mb-3">
                  <strong>Address:</strong>{' '}
                  <span className="ms-1">{referenceUser.address}</span>
                </div>
                {/* Google Maps Link if latitude and longitude are available */}
                {false && referenceUser.latitude && referenceUser.longitude && (
                  <div className="mb-2">
                    <span className="fw-semibold">Location:</span>{' '}
                    <a
                      href={`https://www.google.com/maps?q=${referenceUser.latitude},${referenceUser.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1 ms-1"
                      style={{ fontWeight: 500 }}
                    >
                      <i className="bi bi-geo-alt-fill"></i> View on Map
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewModalOpen && viewModalImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
          onClick={closeImageViewModal}
        >
          <div
            className="relative bg-white rounded-lg shadow-lg p-4 max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={closeImageViewModal}
              title="Close"
            >
              <FaTimes />
            </button>
            <div className="flex items-center justify-center w-full h-72">
              <img
                src={viewModalImages[viewModalIndex].src}
                alt={viewModalImages[viewModalIndex].label}
                className="max-h-64 max-w-full object-contain rounded-lg shadow"
              />
            </div>
            <div className="mt-2 text-center text-gray-700 font-semibold">
              {viewModalImages[viewModalIndex].label}
            </div>
            {viewModalImages.length > 1 && (
              <div className="flex justify-between items-center w-full mt-4">
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg"
                  onClick={showPrevImage}
                  title="Previous"
                >
                  &#8592;
                </button>
                <span className="text-sm text-gray-500">
                  {viewModalIndex + 1} / {viewModalImages.length}
                </span>
                <button
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-lg"
                  onClick={showNextImage}
                  title="Next"
                >
                  &#8594;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 animate-fade-in">
          {/* Close button (top right, outside card) */}
          <button
            onClick={closeLightbox}
            className="fixed top-8 right-10 text-white bg-black/60 hover:bg-gray-700 rounded-full w-12 h-12 flex items-center justify-center text-3xl shadow-lg z-50 transition-colors duration-200"
            title="Close"
            style={{ border: 'none' }}
          >
            <FaTimes />
          </button>

          {/* Delete button (top left, outside card) */}
          <button
            onClick={() => {
              if (lightboxImages[lightboxIndex]) {
                handleDeleteImage(lightboxImages[lightboxIndex].field);
                closeLightbox();
              }
            }}
            className="fixed top-8 left-10 text-white bg-black/60 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg z-50 transition-colors duration-200"
            title="Delete image"
            style={{ border: 'none' }}
          >
            <FaTrash />
          </button>

          {/* Previous button (left, outside card) */}
          {lightboxImages.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg z-40 transition-colors duration-200"
              title="Previous"
              style={{ border: 'none' }}
            >
              ‹
            </button>
          )}

          {/* Next button (right, outside card) */}
          {lightboxImages.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center text-4xl shadow-lg z-40 transition-colors duration-200"
              title="Next"
              style={{ border: 'none' }}
            >
              ›
            </button>
          )}

          {/* Card */}
          <div className="relative bg-white bg-opacity-5 rounded-xl shadow-2xl border border-white/10 p-4 flex flex-col items-center max-w-[700px] w-full mx-2">
            {/* Image */}
            {lightboxImages[lightboxIndex] && (
              <>
                <img
                  src={lightboxImages[lightboxIndex].url}
                  alt={lightboxImages[lightboxIndex].label}
                  className="max-w-[640px] max-h-[70vh] border border-white/30 rounded-lg bg-black mx-auto my-2"
                  style={{ boxShadow: '0 0 0 1px #fff' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="mt-3 text-white text-center text-base font-medium">
                  {lightboxImages[lightboxIndex].label}
                </div>
                <div className="text-white text-xs mt-1 text-center opacity-80">
                  {lightboxIndex + 1} of {lightboxImages.length}
                </div>
              </>
            )}
          </div>

          {/* Keyboard navigation */}
          <div
            className="absolute inset-0"
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeLightbox();
              if (e.key === 'ArrowLeft') prevImage();
              if (e.key === 'ArrowRight') nextImage();
            }}
            tabIndex={0}
          />
        </div>
      )}
    </>
  );
};

export default UsersManager;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';
import axios from '../services/axios';
import authService from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiEye,
  FiEyeOff,
  FiSave,
  FiTrash2,
  FiNavigation,
  FiShield,
  FiFileText,
  FiCreditCard,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
} from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    latitude: '',
    longitude: '',
    profile_pic: null,
    pan_card: null,
    voter_card: null,
    adhaar_card: null,
    bank_check: null,
  });
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const navigate = useNavigate();

  // Change password state
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Show/hide password states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Image modal states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageGallery, setImageGallery] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Add state for agent QR code
  const [agentQrCodeUrl, setAgentQrCodeUrl] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);

  // Function to fetch updated profile data
  const fetchProfileData = async () => {
    try {
      setProfileLoading(true);
      const response = await axios.get('/users/profile/me');
      const profileData = response.data;
      setProfile({
        name: profileData.name || '',
        email: profileData.email || '',
        mobile: profileData.mobile || '',
        address: profileData.address || '',
        latitude: profileData.latitude || '',
        longitude: profileData.longitude || '',
        profile_pic: profileData.profile_pic || null,
        pan_card: profileData.pan_card || null,
        voter_card: profileData.voter_card || null,
        adhaar_card: profileData.adhaar_card || null,
        bank_check: profileData.bank_check || null,
      });
      setAgentQrCodeUrl(profileData.agent_qr_code_url || null);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files (JPG, PNG, etc.)');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB');
        return;
      }

      // Store the file for later upload and show preview
      setFiles((prev) => ({ ...prev, [field]: file }));

      // Show preview for profile picture and documents
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile((prev) => ({ ...prev, [field]: e.target.result }));
      };
      reader.readAsDataURL(file);

      toast.success(
        `${field.replace('_', ' ').toUpperCase()} selected successfully`
      );
    }
  };

  const handleUploadComplete = () => {
    setUploading({});
  };

  // Function to delete a document image
  const handleDeleteImage = async (field) => {
    if (
      !window.confirm(
        `Are you sure you want to delete your ${field.replace('_', ' ')}?`
      )
    ) {
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [field]: true }));

      const requestData = {
        name: profile.name,
        mobile: profile.mobile,
        address: profile.address,
        latitude: profile.latitude,
        longitude: profile.longitude,
        [field]: null,
      };

      // Add current values for other image fields to preserve them
      const imageFields = [
        'profile_pic',
        'pan_card',
        'voter_card',
        'adhaar_card',
        'bank_check',
      ];
      imageFields.forEach((imageField) => {
        if (imageField !== field && profile[imageField]) {
          let filename = profile[imageField];
          if (filename.includes('/uploads/')) {
            filename = filename.split('/uploads/').pop();
          }
          requestData[imageField] = filename;
        }
      });

      const response = await axios.put('/users/profile/me', requestData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const updatedUserData = {
        ...response.data,
        role: response.data.Role?.name || user.role,
      };
      updateUser(updatedUserData);
      await fetchProfileData();

      toast.success(
        `${field.replace('_', ' ').toUpperCase()} deleted successfully`
      );
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();

      // Add basic profile data
      formData.append('name', profile.name);
      formData.append('mobile', profile.mobile);
      formData.append('address', profile.address);
      formData.append('latitude', profile.latitude);
      formData.append('longitude', profile.longitude);

      // Add files if they exist and preserve existing images
      const fileFields = [
        'profile_pic',
        'pan_card',
        'voter_card',
        'adhaar_card',
        'bank_check',
      ];

      fileFields.forEach((field) => {
        if (files[field]) {
          // Add new file
          formData.append(field, files[field]);
        } else if (profile[field]) {
          // Preserve existing image by sending filename
          let filename = profile[field];
          if (filename.includes('/uploads/')) {
            filename = filename.split('/uploads/').pop();
          }
          formData.append(field, filename);
        }
      });

      const response = await axios.put('/users/profile/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUserData = {
        ...response.data,
        role: response.data.Role?.name || user.role,
      };
      updateUser(updatedUserData);

      // Clear files after successful upload
      setFiles({});
      await fetchProfileData();

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const createImageGallery = () => {
    const images = [];
    const imageFields = [
      { key: 'profile_pic', label: 'Profile Picture' },
      { key: 'pan_card', label: 'PAN Card' },
      { key: 'voter_card', label: 'Voter ID Card' },
      { key: 'adhaar_card', label: 'Aadhaar Card' },
      { key: 'bank_check', label: 'Bank Check' },
    ];

    imageFields.forEach(({ key, label }) => {
      if (profile[key]) {
        images.push({
          url: profile[key],
          title: label,
          field: key,
        });
      }
    });

    return images;
  };

  const handleImagePreview = (imageUrl, title, field) => {
    const gallery = createImageGallery();
    const index = gallery.findIndex((img) => img.field === field);
    setImageGallery(gallery);
    setCurrentImageIndex(index >= 0 ? index : 0);
    setShowImageModal(true);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageGallery.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + imageGallery.length) % imageGallery.length
    );
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showImageModal) return;

      if (e.key === 'Escape') {
        handleCloseModal();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showImageModal, imageGallery.length]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setProfile((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          toast.dismiss();
          toast.success('Location updated successfully!');
        },
        (error) => {
          toast.dismiss();
          toast.error('Failed to get location. Please enter manually.');
          console.error('Geolocation error:', error);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setChangePwdLoading(true);

    try {
      await authService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangePwdLoading(false);
    }
  };

  const documentFields = [
    { key: 'pan_card', label: 'PAN Card', icon: FiFileText },
    { key: 'voter_card', label: 'Voter ID Card', icon: FiCreditCard },
    { key: 'adhaar_card', label: 'Aadhaar Card', icon: FiCreditCard },
    { key: 'bank_check', label: 'Bank Check', icon: FiFileText },
  ];

  // Handler for agent QR code upload
  const handleAgentQrUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files (JPG, PNG, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }
    setQrUploading(true);
    try {
      const formData = new FormData();
      formData.append('agent_qr_code', file);
      const res = await axios.patch(`/users/${user.id}/agent-qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAgentQrCodeUrl(res.data.agent_qr_code_url);
      toast.success('QR code updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload QR code');
    } finally {
      setQrUploading(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Toaster position="top-right" />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Profile Settings
              </h1>
              <p className="text-gray-600">
                Manage your personal information and account settings
              </p>
            </div>
          </div>
        </div>

        {profileLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="mt-6 text-gray-500 text-lg">
              Loading your profile...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Profile Card - Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sticky top-6">
                <div className="flex flex-col items-center text-center">
                  {/* Profile Picture */}
                  <div className="relative mb-6">
                    {profile.profile_pic ? (
                      <img
                        src={profile.profile_pic}
                        alt="Profile"
                        className="w-32 h-32 rounded-full border-4 border-gray-100 shadow-xl object-cover cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-105"
                        onClick={() =>
                          handleImagePreview(
                            profile.profile_pic,
                            'Profile Picture',
                            'profile_pic'
                          )
                        }
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border-4 border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-blue-100 hover:to-indigo-200 transition-all duration-300 hover:scale-105">
                        <FiUser className="w-16 h-16 text-blue-400" />
                      </div>
                    )}
                    <label className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-full cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <FiCamera className="w-5 h-5" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'profile_pic')}
                      />
                    </label>
                  </div>

                  {/* User Info */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {profile.name || 'User Name'}
                  </h3>

                  {/* Quick Stats */}
                  <div className="w-full space-y-4">
                    <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                      <FiMail className="w-5 h-5 text-blue-500 mr-3" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {profile.email || 'No email'}
                        </p>
                        <p className="text-xs text-gray-500">Email Address</p>
                      </div>
                    </div>

                    {profile.mobile && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                        <FiPhone className="w-5 h-5 text-green-500 mr-3" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {profile.mobile}
                          </p>
                          <p className="text-xs text-gray-500">Mobile Number</p>
                        </div>
                      </div>
                    )}

                    {profile.address && (
                      <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                        <FiMapPin className="w-5 h-5 text-red-500 mr-3" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {profile.address}
                          </p>
                          <p className="text-xs text-gray-500">Address</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="xl:col-span-3 space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FiUser className="w-6 h-6 mr-3" />
                    Personal Information & Documents
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Update your basic profile details and identity documents
                  </p>
                </div>

                <div className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Email cannot be changed for security reasons
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Mobile Number
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={profile.mobile}
                          disabled
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                          placeholder="Enter your mobile number"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Mobile number cannot be changed for security reasons
                        </p>
                      </div>
                    </div>

                    {/* Address Section */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={profile.address}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                        placeholder="Enter your complete address"
                      />
                    </div>

                    {/* Location Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Latitude
                        </label>
                        <input
                          type="text"
                          name="latitude"
                          value={profile.latitude}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Latitude"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Longitude
                        </label>
                        <input
                          type="text"
                          name="longitude"
                          value={profile.longitude}
                          onChange={handleInputChange}
                          className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          placeholder="Longitude"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <FiNavigation className="w-5 h-5 mr-2" />
                          Get Location
                        </button>
                      </div>
                    </div>

                    {/* Document Uploads Section */}
                    <div className="pt-8 border-t border-gray-200">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                          <FiFileText className="w-5 h-5 mr-2 text-blue-500" />
                          Identity Documents
                        </h3>
                        <p className="text-sm text-gray-600">
                          Upload and manage your identity documents
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {documentFields.map(({ key, label, icon: Icon }) => (
                          <div key={key} className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-700 flex items-center">
                              <Icon className="w-5 h-5 mr-2 text-gray-500" />
                              {label}
                            </label>

                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, key)}
                                className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                              />
                            </div>

                            {profile[key] && (
                              <div className="relative inline-block group">
                                <img
                                  src={profile[key]}
                                  alt={label}
                                  className="w-32 h-20 rounded-xl border-2 border-gray-200 object-cover cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg"
                                  onClick={() =>
                                    handleImagePreview(profile[key], label, key)
                                  }
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(key)}
                                  disabled={uploading[key]}
                                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-110"
                                  title={`Delete ${label}`}
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <FiSave className="w-5 h-5 mr-3" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Change Password */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <FiShield className="w-6 h-6 mr-3" />
                    Change Password
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Update your account password for security
                  </p>
                </div>

                <div className="p-8">
                  <form onSubmit={handleChangePassword} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrent ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="new-password"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showCurrent ? (
                              <FiEyeOff className="w-5 h-5" />
                            ) : (
                              <FiEye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNew ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                            placeholder="Enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showNew ? (
                              <FiEyeOff className="w-5 h-5" />
                            ) : (
                              <FiEye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirm ? (
                              <FiEyeOff className="w-5 h-5" />
                            ) : (
                              <FiEye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        disabled={
                          changePwdLoading ||
                          !currentPassword ||
                          !newPassword ||
                          !confirmPassword
                        }
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {changePwdLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <FiShield className="w-5 h-5 mr-3" />
                            Update Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && imageGallery.length > 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {imageGallery[currentImageIndex].title}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="p-8 flex items-center justify-center bg-gray-50">
                <img
                  src={imageGallery[currentImageIndex].url}
                  alt={imageGallery[currentImageIndex].title}
                  className="max-w-full max-h-96 object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Navigation */}
              {imageGallery.length > 1 && (
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevImage}
                      className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                    >
                      ← Previous
                    </button>

                    <span className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg">
                      {currentImageIndex + 1} of {imageGallery.length}
                    </span>

                    <button
                      onClick={handleNextImage}
                      className="px-6 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {(user?.role === 'agent' || user?.Role?.name === 'agent') && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Payment QR Code
            </h3>
            {agentQrCodeUrl ? (
              <img
                src={agentQrCodeUrl}
                alt="Agent QR Code"
                className="w-48 h-48 object-contain rounded-xl border-2 border-gray-200 mb-4"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl mb-4 text-gray-400">
                No QR code uploaded
              </div>
            )}
            <label className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl">
              {qrUploading ? 'Uploading...' : 'Upload/Change QR Code'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAgentQrUpload}
                disabled={qrUploading}
              />
            </label>
          </div>
        )}
        {user?.role === 'user' && agentQrCodeUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Your Agent's Payment QR Code
            </h3>
            <img
              src={agentQrCodeUrl}
              alt="Agent QR Code"
              className="w-48 h-48 object-contain rounded-xl border-2 border-gray-200 mb-4"
            />
            <p className="text-gray-500 text-sm">
              Use this QR code to make payments to your agent.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfilePage;

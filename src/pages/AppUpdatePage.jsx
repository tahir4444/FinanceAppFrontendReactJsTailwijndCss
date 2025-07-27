import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../services/axios';

const AppUpdatePage = () => {
  console.log('AppUpdatePage component loaded'); // Debug log
  
  const [config, setConfig] = useState({
    android: {
      currentVersion: '1.0.0',
      minVersion: '1.0.0',
      latestVersion: '1.0.0',
      changelog: [],
      forceUpdate: false,
      releaseDate: new Date().toISOString().split('T')[0],
      fileSize: '0 MB'
    }
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);

  useEffect(() => {
    loadConfig();
    loadFiles();
  }, []);

  const loadConfig = async () => {
    try {
      console.log('Loading app update config...'); // Debug log
      setLoading(true);
      const response = await axios.get('/admin/app-update/config');
      console.log('Config response:', response.data); // Debug log
      if (response.data.success) {
        setConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await axios.get('/admin/app-update/files');
      if (response.data.success) {
        setFiles(response.data.data);
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/vnd.android.package-archive') {
      setSelectedFile(file);
    } else {
      toast.error('Please select a valid APK file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !version) {
      toast.error('Please select a file and enter version');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('apk', selectedFile);
      formData.append('version', version);

      const response = await axios.post('/admin/app-update/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('APK uploaded successfully');
        setSelectedFile(null);
        setVersion('');
        setSelectedFile(null);
        document.getElementById('file-input').value = '';
        loadConfig();
        loadFiles();
      }
    } catch (error) {
      toast.error('Failed to upload APK');
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleConfigUpdate = async () => {
    try {
      setLoading(true);
      const changelogArray = changelog.split('\n').filter(item => item.trim());
      
      const response = await axios.put('/admin/app-update/config', {
        platform: 'android',
        version: config.android.latestVersion,
        minVersion: config.android.minVersion,
        changelog: changelogArray,
        forceUpdate: forceUpdate,
        releaseDate: config.android.releaseDate
      });

      if (response.data.success) {
        toast.success('Configuration updated successfully');
        setChangelog('');
        loadConfig();
      }
    } catch (error) {
      toast.error('Failed to update configuration');
      console.error('Error updating config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filename) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/app-update/files/${filename}`);
      if (response.data.success) {
        toast.success('File deleted successfully');
        loadFiles();
      }
    } catch (error) {
      toast.error('Failed to delete file');
      console.error('Error deleting file:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">App Update Management</h1>

        {/* Current Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Version
                </label>
                <input
                  type="text"
                  value={config.android.currentVersion}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latest Version
                </label>
                <input
                  type="text"
                  value={config.android.latestVersion}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Version
                </label>
                <input
                  type="text"
                  value={config.android.minVersion}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Size
                </label>
                <input
                  type="text"
                  value={config.android.fileSize}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Date
                </label>
                <input
                  type="text"
                  value={formatDate(config.android.releaseDate)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Force Update
                </label>
                <input
                  type="text"
                  value={config.android.forceUpdate ? 'Yes' : 'No'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload New APK */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New APK</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select APK File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".apk"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version Number
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="e.g., 1.0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Changelog (one per line)
              </label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Bug fixes and improvements&#10;New features added&#10;Performance enhancements"
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="forceUpdate"
                checked={forceUpdate}
                onChange={(e) => setForceUpdate(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="forceUpdate" className="text-sm font-medium text-gray-700">
                Force Update (users must update to continue)
              </label>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !version}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload APK'}
            </button>
          </div>
        </div>

        {/* Update Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Update Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Changelog (one per line)
              </label>
              <textarea
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                placeholder="Enter changelog items..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="forceUpdateConfig"
                checked={forceUpdate}
                onChange={(e) => setForceUpdate(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="forceUpdateConfig" className="text-sm font-medium text-gray-700">
                Force Update
              </label>
            </div>
            <button
              onClick={handleConfigUpdate}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </div>

        {/* Uploaded Files */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Uploaded APK Files</h2>
          {files.length === 0 ? (
            <p className="text-gray-500">No APK files uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div>
                    <h3 className="font-medium">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      Size: {file.size} | Modified: {formatDate(file.modified)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.name)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppUpdatePage; 
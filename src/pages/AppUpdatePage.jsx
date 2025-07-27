import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../services/axios';

const AppUpdatePage = () => {
  console.log('AppUpdatePage component loaded'); // Debug log
  
  const [currentVersion, setCurrentVersion] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [version, setVersion] = useState('');
  const [changelog, setChangelog] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [minVersion, setMinVersion] = useState('');

  useEffect(() => {
    loadCurrentVersion();
    loadFiles();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      console.log('Loading current app version...'); // Debug log
      setLoading(true);
      const response = await axios.get('/admin/app-update/config');
      console.log('Current version response:', response.data); // Debug log
      
      if (response.data.success && response.data.data.android) {
        setCurrentVersion(response.data.data.android);
      } else {
        console.log('No current version found, using default');
        setCurrentVersion({
          version: '1.0.0',
          minVersion: '1.0.0',
          changelog: [],
          forceUpdate: false,
          releaseDate: new Date().toISOString().split('T')[0],
          fileSize: '0 MB'
        });
      }
    } catch (error) {
      console.error('Error loading current version:', error);
      toast.error('Failed to load current version');
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
    // Check for APK MIME type or file extension
    const isAPK = file && (
      file.type === 'application/vnd.android.package-archive' ||
      file.type === 'application/octet-stream' ||
      file.name.toLowerCase().endsWith('.apk')
    );
    
    if (isAPK) {
      setSelectedFile(file);
      console.log('File selected:', file.name, 'Type:', file.type); // Debug log
    } else {
      toast.error('Please select a valid APK file');
      console.log('Invalid file:', file?.name, 'Type:', file?.type); // Debug log
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
      formData.append('minVersion', minVersion);
      formData.append('changelog', JSON.stringify(changelog.split('\n').filter(item => item.trim())));
      formData.append('forceUpdate', forceUpdate);

      const response = await axios.post('/admin/app-update/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('APK uploaded and version updated successfully');
        setSelectedFile(null);
        setVersion('');
        setChangelog('');
        setForceUpdate(false);
        setMinVersion('');
        document.getElementById('file-input').value = '';
        loadCurrentVersion();
        loadFiles();
      }
    } catch (error) {
      console.error('Error uploading:', error);
      
      // Show more specific error messages
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(`Upload failed: ${error.message}`);
      } else {
        toast.error('Failed to upload APK');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleVersionUpdate = async () => {
    try {
      setLoading(true);
      const changelogArray = changelog.split('\n').filter(item => item.trim());
      
      const response = await axios.put('/admin/app-update/config', {
        platform: 'android',
        version: version,
        minVersion: minVersion,
        changelog: changelogArray,
        forceUpdate: forceUpdate
      });

      if (response.data.success) {
        toast.success('Version updated successfully');
        setChangelog('');
        setVersion('');
        setMinVersion('');
        setForceUpdate(false);
        loadCurrentVersion();
      }
    } catch (error) {
      toast.error('Failed to update version');
      console.error('Error updating version:', error);
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

        {/* Current Version Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Version Information</h2>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : currentVersion ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Version
                </label>
                <input
                  type="text"
                  value={currentVersion.version}
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
                  value={currentVersion.minVersion}
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
                  value={currentVersion.fileSize}
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
                  value={formatDate(currentVersion.releaseDate)}
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
                  value={currentVersion.forceUpdate ? 'Yes' : 'No'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No version information available.</p>
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
                Minimum Version
              </label>
              <input
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
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

        {/* Update Version Only */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Update Version Only</h2>
          <div className="space-y-4">
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
                Minimum Version
              </label>
              <input
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                placeholder="e.g., 1.0.0"
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
              onClick={handleVersionUpdate}
              disabled={loading || !version}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Version'}
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
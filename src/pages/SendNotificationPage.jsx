import React, { useState, useEffect } from 'react';
import { fetchAllUsers, sendNotification } from '../services/notification';
import { toast } from 'react-toastify';

const SendNotificationPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllUsers().then((data) => {
      setUsers(data.users || data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !description || selectedUserIds.length === 0) {
      toast.error('Please fill all fields and select at least one user.');
      return;
    }
    setLoading(true);
    try {
      await sendNotification({
        user_ids: selectedUserIds,
        subject,
        description,
        image_url: imageUrl,
      });
      toast.success('Notification sent!');
      setSubject('');
      setDescription('');
      setImageUrl('');
      setSelectedUserIds([]);
    } catch (err) {
      toast.error('Failed to send notification');
    }
    setLoading(false);
  };

  return (
    <div className="container py-4" style={{ maxWidth: 600 }}>
      <h2>Send Notification</h2>
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Subject</label>
          <input
            type="text"
            className="form-control"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Image URL (optional)</label>
          <input
            type="text"
            className="form-control"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Select Users</label>
          <select
            className="form-select"
            multiple
            value={selectedUserIds}
            onChange={(e) =>
              setSelectedUserIds(
                Array.from(e.target.selectedOptions, (opt) => Number(opt.value))
              )
            }
            required
            style={{ minHeight: 120 }}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
};

export default SendNotificationPage;

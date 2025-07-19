import React, { useEffect, useState } from 'react';
import { fetchNotifications } from '../services/notification';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications(page);
    // eslint-disable-next-line
  }, [page]);

  const loadNotifications = async (pg) => {
    setLoading(true);
    try {
      const data = await fetchNotifications(pg);
      setNotifications(data.notifications);
      setTotalPages(data.totalPages);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div
      className="notifications-page"
      style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}
    >
      <h2>Notifications</h2>
      {loading ? (
        <div>Loading...</div>
      ) : notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notifications.map((n) => (
            <li
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                borderBottom: '1px solid #eee',
                padding: '16px 0',
              }}
            >
              {n.image_url && (
                <img
                  src={n.image_url}
                  alt=""
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 18 }}>{n.subject}</div>
                <div style={{ color: '#555', margin: '8px 0' }}>
                  {n.description}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  {new Date(n.sent_at).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 24,
        }}
      >
        <button onClick={handlePrev} disabled={page === 1}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={handleNext} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;

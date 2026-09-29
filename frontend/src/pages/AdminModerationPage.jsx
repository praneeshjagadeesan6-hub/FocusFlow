import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const AdminModerationPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchModerationFeed = async () => {
    try {
      const res = await axiosInstance.get('/auth/admin/moderation');
      setItems(res.data.items || []);
    } catch (error) {
      console.error('Failed to load moderation feed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationFeed();
  }, []);

  const handleAction = async (userId, action) => {
    try {
      await axiosInstance.put(`/auth/admin/users/${userId}/${action}`);
      fetchModerationFeed();
    } catch (error) {
      console.error(`Failed to ${action} user`, error);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Admin monitor</p>
          <h2 style={{ margin: '8px 0 0' }}>Moderation Center</h2>
        </div>
      </div>

      {loading ? (
        <p>Loading flagged content...</p>
      ) : items.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          No flagged content at the moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {items.map((item) => (
            <div key={item._id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
              {(() => {
                const score = Number(item.riskScore || 0);
                const label = score > 60 ? 'Flagged' : score > 30 ? 'Warning' : 'Safe';
                const color = score > 60 ? '#dc2626' : score > 30 ? '#ca8a04' : '#15803d';
                return (
                  <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <strong>{item.user?.name || 'Unknown user'}</strong>
                  <div style={{ color: '#6b7280', fontSize: '0.88rem' }}>{item.user?.email || 'No email'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color }}>{label}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Risk {score}%</div>
                </div>
              </div>

              <div style={{ marginBottom: '8px', color: '#374151' }}>
                <strong>Type:</strong> {item.sourceType}
              </div>
              <div style={{ marginBottom: '12px', background: '#f9fafb', borderRadius: '10px', padding: '12px', color: '#374151' }}>
                {item.content}
              </div>
              <div style={{ marginBottom: '12px', color: '#6b7280', fontSize: '0.85rem' }}>
                <strong>AI note:</strong> {item.reason}
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                {score > 30 && score <= 60 && item.user?.status !== 'dismissed' && <button type="button" onClick={() => handleAction(item.user?._id, 'warn')} style={{ padding: '10px 12px', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', cursor: 'pointer' }}>Warn</button>}
                {score > 60 && item.user?.status !== 'dismissed' && <button type="button" onClick={() => handleAction(item.user?._id, 'dismiss')} style={{ padding: '10px 12px', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '8px', cursor: 'pointer' }}>Remove user</button>}
                {item.user?.status === 'dismissed' && <span style={{ color: '#6b7280', alignSelf: 'center' }}>User removed</span>}
              </div>
                  </>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminModerationPage;

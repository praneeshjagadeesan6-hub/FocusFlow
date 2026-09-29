import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const AdminUserPortfolioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await axiosInstance.get(`/auth/admin/users/${id}/portfolio`);
        setData(res.data);
      } catch (error) {
        console.error('Failed to load user portfolio', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading portfolio...</div>;
  }

  if (!data) {
    return <div style={{ padding: '24px' }}>User portfolio not found.</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Portfolio</p>
          <h2 style={{ margin: '8px 0 0' }}>{data.user.name}</h2>
          <p style={{ margin: '6px 0 0', color: '#6b7280' }}>{data.user.email}</p>
        </div>
        <button type="button" onClick={() => navigate('/dashboard')} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
          Back to admin console
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Tasks</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{data.summary.tasks}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Completed</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{data.summary.completedTasks}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Sessions</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{data.summary.sessions}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Resources</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{data.summary.resources}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '18px' }}>
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>Academic activity</h3>

          <div style={{ marginBottom: '20px' }}>
            <h4>Tasks</h4>
            {data.tasks.length === 0 ? <p>No tasks recorded.</p> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.tasks.map((task) => (
                  <div key={task._id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700 }}>{task.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{task.status} • {task.priority || 'normal'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Study sessions</h4>
            {data.sessions.length === 0 ? <p>No sessions recorded.</p> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.sessions.map((session) => (
                  <div key={session._id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700 }}>{session.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{session.durationMinutes || 0} mins • {new Date(session.date).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4>Resources</h4>
            {data.resources.length === 0 ? <p>No files shared yet.</p> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.resources.map((resource) => (
                  <div key={resource._id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700 }}>{resource.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{resource.fileType || 'file'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>Safety & engagement</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Status</div>
              <strong style={{ display: 'block', marginTop: '6px' }}>{data.user.status || 'active'}</strong>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Warnings</div>
              <strong style={{ display: 'block', marginTop: '6px' }}>{data.user.warningCount || 0}</strong>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>AI moderation</div>
              <strong style={{ display: 'block', marginTop: '6px' }}>{data.flags?.length ? `${data.flags.length} record(s)` : 'No flags yet'}</strong>
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <h4>Flag history</h4>
            {data.flags.length === 0 ? <p>No moderation history.</p> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {data.flags.slice(0, 5).map((flag) => (
                  <div key={flag._id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontWeight: 700 }}>{flag.aiStatus}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{flag.reason}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminUserPortfolioPage;

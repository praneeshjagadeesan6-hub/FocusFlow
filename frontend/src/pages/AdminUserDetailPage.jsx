import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [aiStatus, setAiStatus] = useState('Safe');
  const [reasons, setReasons] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const res = await axiosInstance.get(`/auth/admin/users/${id}`);
        const { user: userData, stats: userStats, riskScore: risk, engagementScore: engagement, aiStatus: status, reasons: riskReasons, recentActivities } = res.data;

        setUser(userData);
        setStats(userStats);
        setRiskScore(risk);
        setEngagementScore(engagement);
        setAiStatus(status);
        setReasons(riskReasons || []);
        setActivities(recentActivities || []);
      } catch (error) {
        console.error('Failed to load user detail', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading user details...</div>;
  }

  if (!user) {
    return <div style={{ padding: '24px' }}>User not found.</div>;
  }

  const riskColor = riskScore >= 70 ? '#ef4444' : riskScore >= 35 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ margin: 0, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Student monitor</p>
          <h2 style={{ margin: '6px 0 0' }}>{user.name}</h2>
        </div>
        <button type="button" onClick={() => navigate('/dashboard')} style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
          Back to directory
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Tasks</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{stats?.tasks || 0}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Completed</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{stats?.completedTasks || 0}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Overdue</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{stats?.overdueTasks || 0}</strong>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
          <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>Study sessions</span>
          <strong style={{ display: 'block', fontSize: '1.8rem', marginTop: '10px' }}>{stats?.sessions || 0}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '18px' }}>
        <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>Performance and activity</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '14px', marginBottom: '18px' }}>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Engagement score</div>
              <strong style={{ fontSize: '1.7rem', display: 'block', marginTop: '8px' }}>{engagementScore}%</strong>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px' }}>
              <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>AI safety</div>
              <strong style={{ fontSize: '1.3rem', display: 'block', marginTop: '8px', color: riskColor }}>{aiStatus}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ marginBottom: '8px' }}>Recent activity</h4>
            {activities.length === 0 ? (
              <p>No tracked activity yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {activities.map((activity, index) => (
                  <div key={`${activity.type}-${activity.title}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                    <span>{activity.title}</span>
                    <span style={{ color: '#6b7280' }}>{activity.type === 'task' ? (activity.status || 'task') : `${activity.durationMinutes || 0} min`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ marginTop: 0 }}>AI moderation</h3>

          <div style={{ marginBottom: '18px' }}>
            <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '8px' }}>Risk score</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <strong style={{ fontSize: '2rem', color: riskColor }}>{riskScore}</strong>
              <span style={{ color: riskColor, fontWeight: 700 }}>{aiStatus}</span>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ marginBottom: '8px' }}>AI indicators</h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: '#374151' }}>
              {reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button type="button" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fef3c7', cursor: 'pointer' }}>Warn user</button>
            <button type="button" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fecaca', cursor: 'pointer' }}>Dismiss user</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminUserDetailPage;

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Charts from '../components/Charts';
import TaskCard from '../components/TaskCard';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, subjects: 0, sessions: 0 });
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [adminOverview, setAdminOverview] = useState([]);
  const [modFeed, setModFeed] = useState([]);

  const upcomingWithinDays = (dateString, days = 7) => {
    if (!dateString) return false;

    const target = new Date(dateString);
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

    return target >= now && target <= limit;
  };

  const upcomingTasks = tasks.filter((task) => task.status !== 'done' && upcomingWithinDays(task.dueDate));
  const upcomingSessions = sessions.filter((session) => upcomingWithinDays(session.date));

  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const totalHours = sessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0) / 60;
  const studyStreak = Math.min(6, Math.max(1, sessions.length || 1));
  const taskCompletion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, subjectsRes, sessionsRes] = await Promise.all([
          axiosInstance.get('/tasks'),
          axiosInstance.get('/subjects'),
          axiosInstance.get('/study-sessions'),
        ]);

        setTasks(tasksRes.data);
        setSubjects(subjectsRes.data);
        setSessions(sessionsRes.data);
        setStats({
          tasks: tasksRes.data.length,
          subjects: subjectsRes.data.length,
          sessions: sessionsRes.data.length,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      }
    };

    const fetchAdminOverview = async () => {
      try {
        const res = await axiosInstance.get('/auth/admin/overview');
        const { summary, users } = res.data;

        setAdminOverview(users || []);
        setStats({
          tasks: summary?.tasks || 0,
          subjects: summary?.subjects || 0,
          sessions: summary?.sessions || 0,
          resources: summary?.resources || 0,
        });
      } catch (error) {
        console.error('Failed to load admin overview', error);
      }
    };

    const fetchModerationFeed = async () => {
      try {
        const res = await axiosInstance.get('/auth/admin/moderation');
        setModFeed(res.data.items || []);
      } catch (error) {
        console.error('Failed to load moderation feed', error);
      }
    };

    if (user?.role === 'admin') {
      fetchAdminOverview();
      fetchModerationFeed();
      return;
    }

    fetchData();
  }, [user?.role]);

  const handleRemoveUser = async (member) => {
    if (!window.confirm(`Remove ${member.name} from FocusFlow?`)) return;

    try {
      await axiosInstance.put(`/auth/admin/users/${member._id}/dismiss`);
      setAdminOverview((current) => current.map((entry) => (
        entry._id === member._id ? { ...entry, status: 'dismissed' } : entry
      )));
    } catch (error) {
      window.alert(error.response?.data?.message || 'Could not remove this user.');
    }
  };


  return (
    <div className="page-shell">
      <Sidebar />

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{user?.role === 'admin' ? 'Admin Console' : 'Overview'}</p>
            <h3>{user?.role === 'admin' ? 'Student oversight dashboard' : `Welcome ${user?.name || 'Praneesh'}`}</h3>
          </div>

          <div
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              background: user?.role === 'admin' ? 'rgba(59,130,246,0.12)' : 'rgba(16,185,129,0.12)',
              border: user?.role === 'admin' ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(16,185,129,0.35)',
              color: '#111827',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            {user?.role === 'admin' ? 'Admin access' : 'Role: User'}
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>{user?.role === 'admin' ? 'Users' : 'Total Tasks'}</span>
            <strong>{user?.role === 'admin' ? adminOverview.length : stats.tasks}</strong>
          </div>
          <div className="stat-card">
            <span>{user?.role === 'admin' ? 'Flagged' : 'Subjects'}</span>
            <strong>{user?.role === 'admin' ? modFeed.filter((item) => item.riskScore > 60).length : stats.subjects}</strong>
          </div>
          <div className="stat-card">
            <span>{user?.role === 'admin' ? 'Resources' : 'Study Sessions'}</span>
            <strong>{user?.role === 'admin' ? stats.resources || 0 : stats.sessions}</strong>
          </div>
        </section>

        {user?.role === 'admin' && (
          <>
            <section className="card" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>Student Directory</h4>
                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{adminOverview.length} users</span>
              </div>

              {adminOverview.length === 0 ? (
                <p>No users found.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {adminOverview.map((member) => {
                    const riskScore = Number(member.riskScore || 0);
                    const riskLabel = riskScore > 60 ? 'Flagged' : riskScore > 30 ? 'Warning' : 'Safe';
                    const riskColor = riskScore > 60 ? '#dc2626' : riskScore > 30 ? '#ca8a04' : '#15803d';

                    return (
                      <div
                        key={member._id}
                        style={{
                          width: '100%',
                          border: '1px solid #e5e7eb',
                          background: '#fff',
                          borderRadius: '12px',
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${member._id}/portfolio`)}
                          style={{ flex: 1, border: 0, background: 'transparent', padding: '8px 4px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
                        >
                          <span>
                            <strong style={{ display: 'block', fontSize: '1rem' }}>{member.name}</strong>
                            <span style={{ color: '#6b7280', fontSize: '0.88rem' }}>{member.email}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ display: 'inline-flex', padding: '5px 10px', borderRadius: '999px', background: `${riskColor}22`, color: riskColor, fontWeight: 700, fontSize: '0.75rem' }}>
                              {riskLabel} · {riskScore}%
                            </span>
                          </span>
                        </button>
                        {riskScore > 60 && member.status !== 'dismissed' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveUser(member)}
                            style={{ padding: '9px 12px', border: '1px solid #dc2626', borderRadius: '8px', background: '#fff1f2', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                        {member.status === 'dismissed' && <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Removed</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="card" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0 }}>Moderation Center</h4>
                <button type="button" onClick={() => navigate('/admin/moderation')} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>View all</button>
              </div>

              {modFeed.length === 0 ? (
                <p>No flagged content.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {modFeed.slice(0, 5).map((item) => (
                    <div key={item._id} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700 }}>{item.user?.name || 'Unknown user'}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>{item.sourceType} • {item.aiStatus}</div>
                      <div style={{ marginTop: '6px' }}>{item.content.slice(0, 110)}{item.content.length > 110 ? '...' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {user?.role !== 'admin' && (
          <section className="dashboard-lower">
          <div className="dashboard-panels">
            <Charts tasks={tasks} />

            <div className="card">
              <h4>Tasks Due Soon</h4>
              {upcomingTasks.length === 0 ? (
                <p>No tasks due soon.</p>
              ) : (
                <div className="task-list">
                  {upcomingTasks.map((task) => (
                    <TaskCard key={task._id} task={task} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-extended-grid">
            <div className="card task-feed-card">
              <h4>Study Feed</h4>
              <div className="task-feed-list">
                {tasks.length === 0 ? (
                  <p>No tasks yet.</p>
                ) : (
                  tasks.slice(0, 4).map((task, index) => (
                    <div key={task._id || index} className="task-feed-item">
                      <span
                        className="task-feed-dot"
                        style={{ backgroundColor: task.subject ? '#34d399' : '#7dd3fc' }}
                      />
                      <span>{task.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="card metrics-card">
            <h4>Study Overview</h4>

            <div className="metrics-grid">
              <div className="metric-block">
                <span>Weekly Focus Hours</span>
                <strong>{totalHours.toFixed(1)} hrs</strong>
                <small>↑ 14% from last week</small>
              </div>

              <div className="metric-block task-completion-block">
                <span>Task Completion</span>
                <strong>
                  {completedTasks} / {tasks.length || 0}
                </strong>
                <small>{taskCompletion}% Velocity</small>
                <div className="task-completion-bar" aria-label="Task completion progress">
                  <div className="task-completion-fill" style={{ width: `${taskCompletion}%` }} />
                </div>
              </div>

              <div className="metric-block">
                <span>Active Study Streak</span>
                <strong>{studyStreak} Days</strong>
                <small>Goal: 7-Day Target</small>
              </div>
            </div>

          </div>

          <div className="card session-list-card">
            <h4>Upcoming Sessions</h4>
            {upcomingSessions.length === 0 ? (
              <p>No upcoming study sessions in the next 7 days.</p>
            ) : (
              <div className="task-list">
                {upcomingSessions.map((session) => (
                  <div key={session._id} className="task-item">
                    <div>
                      <strong>{session.title}</strong>
                      <p>{session.subject?.name || 'General'} • {session.durationMinutes} mins</p>
                      <p>{new Date(session.date).toLocaleDateString()}</p>
                      {session.notes && <p>{session.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

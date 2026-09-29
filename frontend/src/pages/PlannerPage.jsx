import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';

const PlannerPage = () => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTaskFilter, setActiveTaskFilter] = useState('assigned');
  const [activeSessionFilter, setActiveSessionFilter] = useState('scheduled');
  const [subjects, setSubjects] = useState([]);
  const [subjectForm, setSubjectForm] = useState({ name: '', color: '#4f46e5' });
  const [sessionForm, setSessionForm] = useState({
    title: '',
    subject: '',
    durationMinutes: 60,
    date: '',
    notes: '',
  });
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    subject: '',
  });
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({
    title: '',
    description: '',
    subject: '',
  });
  const [aiResult, setAiResult] = useState(null);

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
    } catch (error) {
      console.error('Failed to fetch planner data', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubjectChange = (e) => {
    setSubjectForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSessionChange = (e) => {
    const { name, value } = e.target;
    setSessionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAiChange = (e) => {
    setAiForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAiGenerate = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post('/ai/breakdown', {
        taskTitle: aiForm.title,
        description: aiForm.description,
        subject: aiForm.subject,
      });

      setAiResult(response.data);
    } catch (error) {
      console.error('Failed to generate AI task breakdown', error);
    }
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();

    if (!sessionForm.title || !sessionForm.date) {
      return;
    }

    try {
      await axiosInstance.post('/study-sessions', {
        ...sessionForm,
        durationMinutes: Number(sessionForm.durationMinutes || 60),
      });

      setSessionForm({ title: '', subject: '', durationMinutes: 60, date: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create study session', error);
    }
  };

  const applyAiResult = () => {
    if (!aiResult) return;

    setForm((prev) => ({
      ...prev,
      title: aiResult.title || prev.title,
      description: aiResult.steps?.join('\n') || prev.description,
      subject: aiForm.subject || prev.subject,
    }));

    setAiResult(null);
    setShowAiModal(false);
    setAiForm({ title: '', description: '', subject: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axiosInstance.post('/tasks', { ...form, dueDate: form.dueDate || null });
    setForm({ title: '', description: '', dueDate: '', priority: 'medium', subject: '' });
    fetchData();
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();

    if (!subjectForm.name.trim()) {
      return;
    }

    await axiosInstance.post('/subjects', {
      name: subjectForm.name.trim(),
      color: subjectForm.color,
    });

    setSubjectForm({ name: '', color: '#4f46e5' });
    fetchData();
  };

  const taskCategories = [
    {
      key: 'assigned',
      label: 'Assigned Tasks',
      items: tasks,
      count: tasks.length,
    },
    {
      key: 'completed',
      label: 'Completed Tasks',
      items: tasks.filter((task) => task.status === 'done'),
      count: tasks.filter((task) => task.status === 'done').length,
    },
    {
      key: 'missed',
      label: 'Missed Tasks',
      items: tasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()),
      count: tasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()).length,
    },
  ];

  const sessionCategories = [
    {
      key: 'scheduled',
      label: 'Scheduled Sessions',
      items: sessions,
      count: sessions.length,
    },
    {
      key: 'upcoming',
      label: 'Upcoming Sessions',
      items: sessions.filter((session) => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        const now = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + 7);
        return sessionDate >= now && sessionDate <= limit;
      }),
      count: sessions.filter((session) => {
        if (!session.date) return false;
        const sessionDate = new Date(session.date);
        const now = new Date();
        const limit = new Date();
        limit.setDate(limit.getDate() + 7);
        return sessionDate >= now && sessionDate <= limit;
      }).length,
    },
    {
      key: 'completed',
      label: 'Completed Sessions',
      items: sessions.filter((session) => session.date && new Date(session.date) < new Date()),
      count: sessions.filter((session) => session.date && new Date(session.date) < new Date()).length,
    },
  ];

  const selectedTaskCategory = taskCategories.find((category) => category.key === activeTaskFilter) || taskCategories[0];
  const selectedSessionCategory = sessionCategories.find((category) => category.key === activeSessionFilter) || sessionCategories[0];

  return (
    <div className="page-shell">
      <Sidebar />

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Planner</p>
            <h3>Task management</h3>
          </div>
          <button type="button" className="ai-button" onClick={() => setShowAiModal(true)}>
            Generate with AI
          </button>
        </header>

        {showAiModal && (
          <div className="modal-backdrop" onClick={() => setShowAiModal(false)}>
            <div className="card modal" onClick={(e) => e.stopPropagation()}>
              <h4>Generate study plan with AI</h4>
              <form onSubmit={handleAiGenerate}>
                <input
                  name="title"
                  placeholder="Task title"
                  value={aiForm.title}
                  onChange={handleAiChange}
                  required
                />
                <textarea
                  name="description"
                  placeholder="Task description"
                  value={aiForm.description}
                  onChange={handleAiChange}
                />
                <select name="subject" value={aiForm.subject} onChange={handleAiChange}>
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setShowAiModal(false)}>
                    Close
                  </button>
                  <button type="submit">Generate</button>
                </div>
              </form>

              {aiResult && (
                <div className="ai-result">
                  <h5>{aiResult.title}</h5>
                  <ul>
                    {aiResult.steps?.map((step, index) => (
                      <li key={`${step}-${index}`}>{step}</li>
                    ))}
                  </ul>

                  {aiResult.quizQuestions?.length > 0 && (
                    <div>
                      <h6>Sample quiz questions</h6>
                      <ul>
                        {aiResult.quizQuestions.map((question, index) => (
                          <li key={`${question.question}-${index}`}>
                            {question.question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button type="button" onClick={applyAiResult}>
                    Use this plan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="planner-top-controls">
          <div className="card subject-card">
            <form onSubmit={handleSubjectSubmit} className="subject-form-horizontal">
              <h4>Add Subject</h4>
              <div className="subject-form-row">
                <input
                  name="name"
                  placeholder="Subject name"
                  value={subjectForm.name}
                  onChange={handleSubjectChange}
                  required
                />
                <button type="submit">Create Subject</button>
              </div>
            </form>
          </div>
        </section>

        <section className="planner-layout">
          <div className="card">
            <h4>Sessions</h4>
            <form className="session-form" onSubmit={handleSessionSubmit}>
              <input
                name="title"
                placeholder="Session title"
                value={sessionForm.title}
                onChange={handleSessionChange}
                required
              />
              <select name="subject" value={sessionForm.subject} onChange={handleSessionChange}>
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
              <input
                type="date"
                name="date"
                value={sessionForm.date}
                onChange={handleSessionChange}
                required
              />
              <input
                type="number"
                name="durationMinutes"
                min="15"
                step="15"
                value={sessionForm.durationMinutes}
                onChange={handleSessionChange}
              />
              <textarea
                name="notes"
                placeholder="Notes"
                value={sessionForm.notes}
                onChange={handleSessionChange}
              />
              <button type="submit">Save Session</button>
            </form>

            <div className="summary-grid">
              {sessionCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`summary-card ${activeSessionFilter === category.key ? 'active' : ''}`}
                  onClick={() => setActiveSessionFilter(category.key)}
                >
                  <span>{category.label}</span>
                  <strong>{category.count}</strong>
                </button>
              ))}
            </div>

            <div className="task-list session-list">
              {selectedSessionCategory.items.length === 0 ? (
                <p>No sessions in this category yet.</p>
              ) : (
                selectedSessionCategory.items.map((session) => (
                  <div key={session._id} className="task-item session-item">
                    <div>
                      <strong>{session.title}</strong>
                      <p>{session.subject?.name || 'General'} • {session.durationMinutes} mins</p>
                      <p>{new Date(session.date).toLocaleDateString()}</p>
                      {session.notes && <p>{session.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h4>Tasks</h4>
            <form onSubmit={handleSubmit}>
              <input name="title" placeholder="Task title" value={form.title} onChange={handleChange} required />
              <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} />
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option value="low">Easy</option>
                <option value="medium">Medium</option>
                <option value="high">Hard</option>
              </select>
              <select name="subject" value={form.subject} onChange={handleChange}>
                <option value="">Select subject</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
              <button type="submit">Create Task</button>
            </form>

            <div className="summary-grid">
              {taskCategories.map((category) => (
                <button
                  key={category.key}
                  type="button"
                  className={`summary-card ${activeTaskFilter === category.key ? 'active' : ''}`}
                  onClick={() => setActiveTaskFilter(category.key)}
                >
                  <span>{category.label}</span>
                  <strong>{category.count}</strong>
                </button>
              ))}
            </div>

            <div className="task-list">
              {selectedTaskCategory.items.length === 0 ? (
                <p>No tasks in this category yet.</p>
              ) : (
                selectedTaskCategory.items.map((task) => (
                  <TaskCard key={task._id} task={task} />
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PlannerPage;

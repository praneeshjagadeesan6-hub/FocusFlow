import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';

const GroupsPage = () => {
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [resourceForm, setResourceForm] = useState({ title: '', subjectId: '', file: null });

  const fetchGroups = async () => {
    try {
      const res = await axiosInstance.get('/groups');
      setGroups(res.data);
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axiosInstance.get('/subjects');
      setSubjects(res.data);
      setResourceForm((prev) => ({
        ...prev,
        subjectId: prev.subjectId || res.data[0]?._id || '',
      }));
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  };

  const fetchResources = async () => {
    try {
      const allResources = [];

      for (const subject of subjects) {
        const res = await axiosInstance.get(`/resources/${subject._id}`).catch(() => ({ data: [] }));
        res.data.forEach((resource) => {
          allResources.push({
            ...resource,
            subjectName: subject.name,
          });
        });
      }

      setResources(allResources);
    } catch (error) {
      console.error('Failed to fetch resources', error);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjects.length) {
      fetchResources();
    }
  }, [subjects]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axiosInstance.post('/groups', form);
    setForm({ name: '', description: '' });
    fetchGroups();
  };

  const handleResourceChange = (e) => {
    const { name, value, files } = e.target;

    setResourceForm((prev) => ({
      ...prev,
      [name]: name === 'file' ? files[0] : value,
    }));
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();

    if (!resourceForm.title.trim() || !resourceForm.subjectId || !resourceForm.file) {
      return;
    }

    const formData = new FormData();
    formData.append('title', resourceForm.title.trim());
    formData.append('subjectId', resourceForm.subjectId);
    formData.append('file', resourceForm.file);

    await axiosInstance.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    setResourceForm({ title: '', subjectId: resourceForm.subjectId, file: null });
    fetchResources();
  };

  return (
    <div className="page-shell">
      <Sidebar />

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Groups</p>
            <h3>Study communities</h3>
          </div>
        </header>

        <section className="planner-layout">
          <form className="card" onSubmit={handleSubmit}>
            <h4>Create Group</h4>
            <input name="name" placeholder="Group name" value={form.name} onChange={handleChange} required />
            <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
            <button type="submit">Create Group</button>
          </form>

          <div className="card">
            <h4>Your Groups</h4>
            <div className="task-list">
              {groups.map((group) => (
                <div key={group._id} className="task-item">
                  <div>
                    <strong>{group.name}</strong>
                    <p>{group.description || 'No description'}</p>
                    <p>{group.members?.length || 0} member(s)</p>
                  </div>
                  <Link className="inline-link" to={`/room/${group._id}`}>
                    Open room
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="planner-layout" style={{ marginTop: '24px' }}>
          <form className="card resource-upload-card" onSubmit={handleResourceSubmit}>
            <h4>Upload Study Resource</h4>
            <input
              name="title"
              placeholder="Resource title"
              value={resourceForm.title}
              onChange={handleResourceChange}
              required
            />
            <select
              name="subjectId"
              value={resourceForm.subjectId}
              onChange={handleResourceChange}
              required
            >
              <option value="">Select subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>{subject.name}</option>
              ))}
            </select>

            <label className="upload-zone resource-upload-zone">
              <input type="file" name="file" className="hidden-file-input" onChange={handleResourceChange} required />
              <div className="upload-icon">📄</div>
              <p>Drag &amp; drop syllabus PDFs, lecture notes, or lab manuals</p>
              <small>Multi-format data processed via Multer • Max 25 MB</small>
            </label>

            <button type="submit">Upload Resource</button>
          </form>

          <div className="card">
            <h4>Shared Study Resources</h4>
            <div className="task-list">
              {resources.length === 0 ? (
                <p>No resources shared yet.</p>
              ) : (
                resources.map((resource) => (
                  <div key={resource._id} className="task-item">
                    <div>
                      <strong>{resource.title}</strong>
                      <p>{resource.subjectName}</p>
                    </div>
                    <a className="inline-link" href={resource.fileUrl} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default GroupsPage;

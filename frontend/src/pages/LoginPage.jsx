import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-hero">
          <p className="auth-kicker">FOR STUDENTS, BY STUDENTS</p>
          <h2>
            Study smarter.
            <br />
            Grow together.
          </h2>
          <p className="auth-hero-text">
            FocusFlow helps students stay on top of tasks, share knowledge, and make study sessions
            more productive with support from people who truly understand the journey.
          </p>

          <ul className="auth-feature-list">
            <li>
              <span className="feature-bullet">+</span>
              Plan tasks and stay focused on what matters most.
            </li>
            <li>
              <span className="feature-bullet">+</span>
              Share what you know and learn from classmates.
            </li>
            <li>
              <span className="feature-bullet">+</span>
              Meet on your terms and build momentum together.
            </li>
          </ul>
        </aside>

        <div className="auth-card">
          <h1>FocusFlow</h1>
          <p>Welcome back</p>
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <div className="error-box">{error}</div>}
            <button type="submit">Login</button>
          </form>
          <p>
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <h2>{user?.role === 'admin' ? 'Admin Console' : 'FocusFlow'}</h2>
      <nav>
        {user?.role === 'admin' ? (
          <Link to="/dashboard">Admin Console</Link>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/planner">Planner</Link>
            <Link to="/groups">Groups</Link>
            <Link to="/flashcards">Flashcards</Link>
          </>
        )}
      </nav>
      <button className="logout-button" onClick={logout}>Logout</button>
    </aside>
  );
};

export default Sidebar;

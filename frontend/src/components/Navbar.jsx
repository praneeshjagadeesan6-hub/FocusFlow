import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="topbar-nav">
      <div className="brand">
        <Link to="/dashboard">FocusFlow</Link>
      </div>

      <div className="nav-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/planner">Planner</Link>
        <Link to="/groups">Groups</Link>
        <Link to="/flashcards">Flashcards</Link>
      </div>

      <div className="nav-user">
        <span>{user?.name || 'Guest'}</span>
        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;

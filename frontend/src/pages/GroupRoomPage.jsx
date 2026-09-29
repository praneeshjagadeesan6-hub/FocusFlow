import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PomodoroRoom from '../components/PomodoroRoom';

const GroupRoomPage = () => {
  const { id } = useParams();

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Study Room</p>
            <h3>Group Session: {id}</h3>
          </div>
        </header>
        <PomodoroRoom roomId={id || 'study-room'} />
      </main>
    </div>
  );
};

export default GroupRoomPage;

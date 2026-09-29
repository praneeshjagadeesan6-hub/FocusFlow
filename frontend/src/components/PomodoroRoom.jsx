import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';

const focusDuration = 25 * 60;
const breakDuration = 5 * 60;

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const PomodoroRoom = ({ roomId = 'study-room' }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatError, setChatError] = useState('');
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!socket) return;

    setMessages([]);
    setChatError('');
    socket.emit('join-room', roomId);

    const handleTimerUpdate = ({ timeLeft: incomingTimeLeft, isRunning: incomingIsRunning, mode: incomingMode }) => {
      setTimeLeft(incomingTimeLeft);
      setIsRunning(incomingIsRunning);

      if (incomingMode) {
        setMode(incomingMode);
      }
    };
    const handleChatHistory = (history) => setMessages(history);
    const handleChatMessage = (message) => setMessages((current) => [...current, message].slice(-100));
    const handleGroupError = (error) => setChatError(error);

    socket.on('timer-update', handleTimerUpdate);
    socket.on('chat-history', handleChatHistory);
    socket.on('chat-message', handleChatMessage);
    socket.on('group-error', handleGroupError);

    return () => {
      socket.emit('leave-room', roomId);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('chat-history', handleChatHistory);
      socket.off('chat-message', handleChatMessage);
      socket.off('group-error', handleGroupError);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!isRunning || !socket) return;

    const timerId = setInterval(() => {
      setTimeLeft((previousTimeLeft) => {
        const nextTimeLeft = Math.max(previousTimeLeft - 1, 0);

        if (nextTimeLeft === 0) {
          setIsRunning(false);
          socket.emit('timer-sync', {
            roomId,
            timeLeft: 0,
            isRunning: false,
            mode,
          });
          return 0;
        }

        socket.emit('timer-sync', {
          roomId,
          timeLeft: nextTimeLeft,
          isRunning: true,
          mode,
        });

        return nextTimeLeft;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isRunning, mode, roomId, socket]);

  const syncState = (nextMode, nextTimeLeft, nextRunning) => {
    setMode(nextMode);
    setTimeLeft(nextTimeLeft);
    setIsRunning(nextRunning);
    socket?.emit('timer-sync', {
      roomId,
      timeLeft: nextTimeLeft,
      isRunning: nextRunning,
      mode: nextMode,
    });
  };

  const toggleTimer = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    socket?.emit('timer-sync', {
      roomId,
      timeLeft,
      isRunning: nextRunning,
      mode,
    });
  };

  const switchMode = (nextMode) => {
    const nextTimeLeft = nextMode === 'focus' ? focusDuration : breakDuration;
    syncState(nextMode, nextTimeLeft, false);
  };

  const resetTimer = () => {
    const nextTimeLeft = mode === 'focus' ? focusDuration : breakDuration;
    syncState(mode, nextTimeLeft, false);
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !socket) return;
    socket.emit('chat-send', { roomId, text });
    setMessageText('');
  };

  const currentModeLabel = mode === 'focus' ? 'Focus Session' : 'Break Session';

  return (
    <div className="pomodoro-room-layout">
      <div className="card pomodoro-room">
        <div className="pomodoro-header">
          <h4>Pomodoro Room</h4>
          <span className="mode-pill">{currentModeLabel}</span>
        </div>

        <div className="timer-display">{formatTime(timeLeft)}</div>

        <div className="pomodoro-controls">
        <button
          type="button"
          className={mode === 'focus' ? 'active' : ''}
          onClick={() => switchMode('focus')}
        >
          Focus
        </button>
        <button
          type="button"
          className={mode === 'break' ? 'active' : ''}
          onClick={() => switchMode('break')}
        >
          Break
        </button>
        </div>

        <div className="pomodoro-actions">
          <button type="button" onClick={toggleTimer}>{isRunning ? 'Pause' : 'Start'}</button>
          <button type="button" className="secondary" onClick={resetTimer}>Reset</button>
        </div>
      </div>

      <section className="card group-chat" aria-label="Group chat">
        <div className="pomodoro-header">
          <h4>Group Chat</h4>
          <span className="mode-pill">Members only</span>
        </div>
        <div className="group-chat-messages" aria-live="polite">
          {!socket ? <p>Connect to chat after signing in.</p> : null}
          {chatError ? <p role="alert">{chatError}</p> : null}
          {socket && !chatError && messages.length === 0 ? <p>No messages yet. Start the conversation.</p> : null}
          {messages.map((message) => (
            <article key={message._id} className="group-chat-message">
              <strong>{message.senderName}</strong>
              <p>{message.text}</p>
              <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
            </article>
          ))}
        </div>
        <form className="group-chat-form" onSubmit={sendMessage}>
          <input
            aria-label="Message"
            value={messageText}
            maxLength={1000}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write a message..."
            disabled={!socket || Boolean(chatError)}
          />
          <button type="submit" disabled={!socket || Boolean(chatError) || !messageText.trim()}>Send</button>
        </form>
      </section>
    </div>
  );
};

export default PomodoroRoom;

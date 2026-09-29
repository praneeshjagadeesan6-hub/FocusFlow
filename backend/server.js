const http = require('http');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const app = require('./app');
const initSocket = require('./socket');
const { startReminderJob } = require('./jobs/deadlineReminderJob');

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing FocusFlow backend or change PORT in the backend .env file.`);
    process.exit(1);
  }

  console.error('Server error:', error);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    startReminderJob();
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

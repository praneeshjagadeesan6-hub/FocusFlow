const cron = require('node-cron');
const Task = require('../models/Task');
const transporter = require('../config/nodemailer');

const sendDueTaskDigest = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      status: { $ne: 'done' },
      dueDate: {
        $gte: now,
        $lte: next24Hours,
      },
    }).populate('user', 'email name');

    if (!tasks.length) {
      return;
    }

    const groupedByUser = new Map();

    tasks.forEach((task) => {
      if (!task.user?.email) {
        return;
      }

      if (!groupedByUser.has(task.user._id.toString())) {
        groupedByUser.set(task.user._id.toString(), {
          email: task.user.email,
          name: task.user.name,
          tasks: [],
        });
      }

      groupedByUser.get(task.user._id.toString()).tasks.push(task);
    });

    for (const payload of groupedByUser.values()) {
      const mailBody = payload.tasks
        .map((task) => `- ${task.title} — due ${new Date(task.dueDate).toLocaleString()}`)
        .join('\n');

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: payload.email,
        subject: 'FocusFlow Deadline Reminder Digest',
        html: `
          <h3>Hello ${payload.name || 'there'},</h3>
          <p>You have upcoming tasks due in the next 24 hours:</p>
          <pre>${mailBody}</pre>
        `,
      });
    }
  } catch (error) {
    console.error('Reminder job failed:', error);
  }
};

const startReminderJob = () => {
  cron.schedule('0 8 * * *', () => {
    sendDueTaskDigest();
  });

  console.log('Daily reminder job scheduled at 08:00 AM');
};

module.exports = { startReminderJob };

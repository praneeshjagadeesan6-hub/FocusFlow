const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Task = require('../models/Task');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const Resource = require('../models/Resource');
const ModerationFlag = require('../models/ModerationFlag');
const { scanContentForRisk, getRiskStatus } = require('../utils/moderation');

const ADMIN_CONFIG = {
  email: process.env.ADMIN_EMAIL || '',
  password: process.env.ADMIN_PASSWORD || '',
  name: process.env.ADMIN_NAME || 'FocusFlow Admin',
  role: process.env.ADMIN_ROLE || 'admin',
};

const normalizeRole = (role) => {
  const allowedRoles = ['student', 'teacher', 'admin'];
  return allowedRoles.includes(role) ? role : 'student';
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const safeRole = normalizeRole(role);
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email: email.trim().toLowerCase(), password, role: safeRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const isAdminCredential = Boolean(ADMIN_CONFIG.email && ADMIN_CONFIG.password)
      && normalizedEmail === ADMIN_CONFIG.email
      && password === ADMIN_CONFIG.password;

    let user = await User.findOne({ email: normalizedEmail });

    if (isAdminCredential) {
      if (!user) {
        user = await User.create({
          name: ADMIN_CONFIG.name,
          email: normalizedEmail,
          password,
          role: ADMIN_CONFIG.role,
        });
      } else {
        user.role = ADMIN_CONFIG.role;
        user.password = password;
        user.name = ADMIN_CONFIG.name;
        await user.save();
      }
    } else {
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    if (user.status === 'dismissed') {
      return res.status(403).json({ message: 'This account has been removed from FocusFlow' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const buildUserPerformance = async (userDoc) => {
  const [tasks, subjects, sessions, resources, moderationFlags] = await Promise.all([
    Task.find({ user: userDoc._id }).sort({ createdAt: -1 }).lean(),
    Subject.find({ user: userDoc._id }).sort({ createdAt: -1 }).lean(),
    StudySession.find({ user: userDoc._id }).sort({ date: -1 }).lean(),
    Resource.find({ userId: userDoc._id }).sort({ createdAt: -1 }).lean(),
    ModerationFlag.find({ userId: userDoc._id }).select('riskScore').lean(),
  ]);

  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const overdueTasks = tasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()).length;
  const engagementScore = Math.min(100, Math.round((completedTasks * 8 + sessions.length * 10 + subjects.length * 7 + tasks.length * 2 + resources.length * 5) / 1.5));
  const riskScore = moderationFlags.reduce((highest, flag) => Math.max(highest, flag.riskScore || 0), 0);
  const aiStatus = getRiskStatus(riskScore);

  const recentActivities = [
    ...tasks.map((task) => ({
      type: 'task',
      title: task.title,
      date: task.createdAt || task.dueDate,
      status: task.status,
      priority: task.priority,
    })),
    ...sessions.map((session) => ({
      type: 'session',
      title: session.title,
      date: session.date || session.createdAt,
      durationMinutes: session.durationMinutes,
    })),
    ...resources.map((resource) => ({
      type: 'resource',
      title: resource.title,
      date: resource.createdAt,
      status: 'uploaded',
    })),
  ]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  const reasons = [];
  if (riskScore > 0) reasons.push(`${moderationFlags.length} content item(s) scanned for safety`);
  if (reasons.length === 0) reasons.push('Healthy engagement pattern');

  return {
    ...userDoc.toObject(),
    stats: {
      tasks: tasks.length,
      subjects: subjects.length,
      sessions: sessions.length,
      resources: resources.length,
      completedTasks,
      overdueTasks,
    },
    engagementScore,
    riskScore,
    aiStatus,
    reasons,
    recentActivities,
  };
};

const getAdminOverview = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    const userOverview = await Promise.all(users.map(async (userDoc) => buildUserPerformance(userDoc)));

    const summary = userOverview.reduce(
      (acc, user) => {
        acc.tasks += user.stats.tasks;
        acc.subjects += user.stats.subjects;
        acc.sessions += user.stats.sessions;
        acc.resources += user.stats.resources;
        return acc;
      },
      { users: userOverview.length, tasks: 0, subjects: 0, sessions: 0, resources: 0 }
    );

    res.json({ summary, users: userOverview });
  } catch (error) {
    next(error);
  }
};

const getAdminUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const portfolio = await buildUserPerformance(user);

    res.json({
      user: { ...portfolio, password: undefined },
      stats: portfolio.stats,
      engagementScore: portfolio.engagementScore,
      riskScore: portfolio.riskScore,
      aiStatus: portfolio.aiStatus,
      reasons: portfolio.reasons,
      recentActivities: portfolio.recentActivities,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminUserPortfolio = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [tasks, subjects, sessions, resources, flags] = await Promise.all([
      Task.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
      Subject.find({ user: user._id }).sort({ createdAt: -1 }).lean(),
      StudySession.find({ user: user._id }).sort({ date: -1 }).lean(),
      Resource.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
      ModerationFlag.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        warningCount: user.warningCount || 0,
      },
      tasks,
      subjects,
      sessions,
      resources,
      flags,
      summary: {
        tasks: tasks.length,
        subjects: subjects.length,
        sessions: sessions.length,
        resources: resources.length,
        completedTasks: tasks.filter((task) => task.status === 'done').length,
        overdueTasks: tasks.filter((task) => task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()).length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const scanContentForModeration = async (req, res, next) => {
  try {
    const { userId, content, sourceType = 'general' } = req.body;

    const targetUserId = userId || req.user?._id;
    if (!targetUserId || !content || !String(content).trim()) {
      return res.status(400).json({ message: 'userId and content are required for moderation check' });
    }

    const user = await User.findById(targetUserId).select('name email');
    const result = scanContentForRisk(content);

    const createdFlag = await ModerationFlag.create({
      userId: targetUserId,
      userName: user?.name || 'Unknown user',
      sourceType,
      content: String(content).slice(0, 500),
      reason: result.issues.join('; '),
      riskScore: result.riskScore,
      aiStatus: result.aiStatus,
      status: result.aiStatus === 'Safe' ? 'safe' : 'pending',
      reviewedBy: req.user?._id || null,
    });

    res.json({
      ...result,
      flagId: createdFlag._id,
      user: user ? { _id: user._id, name: user.name, email: user.email } : null,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminModerationFeed = async (req, res, next) => {
  try {
    const flags = await ModerationFlag.find({}).sort({ createdAt: -1 }).populate('userId', 'name email status warningCount').lean();

    res.json({
      total: flags.length,
      flagged: flags.filter((entry) => entry.riskScore > 60).length,
      items: flags.map((entry) => ({
        _id: entry._id,
        user: entry.userId ? {
          _id: entry.userId._id,
          name: entry.userId.name,
          email: entry.userId.email,
          status: entry.userId.status,
        } : null,
        sourceType: entry.sourceType,
        content: entry.content,
        riskScore: entry.riskScore,
        aiStatus: getRiskStatus(entry.riskScore || 0),
        status: entry.status,
        reason: entry.reason,
        createdAt: entry.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const warnUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'warned';
    user.warningCount = (user.warningCount || 0) + 1;
    user.lastWarningAt = new Date();
    await user.save();

    await ModerationFlag.updateMany(
      { userId: id, status: { $in: ['pending', 'safe'] } },
      { status: 'warned', reviewedBy: req.user?._id || null }
    );

    res.json({ message: 'User warning recorded', user: { _id: user._id, name: user.name, status: user.status, warningCount: user.warningCount } });
  } catch (error) {
    next(error);
  }
};

const dismissUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasHighRiskFlag = await ModerationFlag.exists({ userId: id, riskScore: { $gt: 60 } });
    if (!hasHighRiskFlag) {
      return res.status(403).json({ message: 'A user can only be removed when their risk score exceeds 60' });
    }

    user.status = 'dismissed';
    user.dismissedAt = new Date();
    await user.save();

    await ModerationFlag.updateMany(
      { userId: id },
      { status: 'dismissed', reviewedBy: req.user?._id || null }
    );

    res.json({ message: 'User removed from FocusFlow', user: { _id: user._id, name: user.name, status: user.status } });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe, getAdminOverview, getAdminUserDetail, getAdminUserPortfolio, scanContentForModeration, getAdminModerationFeed, warnUser, dismissUser };

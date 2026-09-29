const StudySession = require('../models/StudySession');

const getStudySessions = async (req, res, next) => {
  try {
    const sessions = await StudySession.find({ user: req.user._id })
      .populate('subject', 'name')
      .sort({ date: 1 });

    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

const createStudySession = async (req, res, next) => {
  try {
    const { title, subject, durationMinutes, date, notes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required' });
    }

    const session = await StudySession.create({
      title,
      subject,
      durationMinutes,
      date,
      notes,
      user: req.user._id,
    });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

const updateStudySession = async (req, res, next) => {
  try {
    const session = await StudySession.findOne({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    Object.assign(session, req.body);
    await session.save();
    res.json(session);
  } catch (error) {
    next(error);
  }
};

const deleteStudySession = async (req, res, next) => {
  try {
    const session = await StudySession.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!session) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json({ message: 'Study session deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudySessions,
  createStudySession,
  updateStudySession,
  deleteStudySession,
};

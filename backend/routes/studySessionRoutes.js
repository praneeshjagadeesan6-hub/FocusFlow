const express = require('express');
const {
  getStudySessions,
  createStudySession,
  updateStudySession,
  deleteStudySession,
} = require('../controllers/studySessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getStudySessions).post(protect, createStudySession);
router.route('/:id').put(protect, updateStudySession).delete(protect, deleteStudySession);

module.exports = router;

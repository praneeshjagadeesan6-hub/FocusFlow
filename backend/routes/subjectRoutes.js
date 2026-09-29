const express = require('express');
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getSubjects).post(protect, createSubject);
router.route('/:id').put(protect, updateSubject).delete(protect, deleteSubject);

module.exports = router;

const express = require('express');
const {
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  removeMember,
} = require('../controllers/studyGroupController');
const { protect } = require('../middleware/authMiddleware');
const { verifyGroupRole } = require('../middleware/verifyGroupRole');

const router = express.Router();

router.route('/').get(protect, getGroups).post(protect, createGroup);
router.route('/:id').put(protect, updateGroup).delete(protect, verifyGroupRole(['admin']), deleteGroup);
router.route('/:id/members/:memberId').delete(protect, verifyGroupRole(['admin', 'moderator']), removeMember);

module.exports = router;

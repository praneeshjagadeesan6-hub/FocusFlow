const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  getAdminOverview,
  getAdminUserDetail,
  getAdminUserPortfolio,
  scanContentForModeration,
  getAdminModerationFeed,
  warnUser,
  dismissUser,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/admin/overview', protect, adminOnly, getAdminOverview);
router.get('/admin/users/:id', protect, adminOnly, getAdminUserDetail);
router.get('/admin/users/:id/portfolio', protect, adminOnly, getAdminUserPortfolio);
router.post('/admin/moderation/scan', protect, adminOnly, scanContentForModeration);
router.get('/admin/moderation', protect, adminOnly, getAdminModerationFeed);
router.put('/admin/users/:id/warn', protect, adminOnly, warnUser);
router.put('/admin/users/:id/dismiss', protect, adminOnly, dismissUser);

module.exports = router;

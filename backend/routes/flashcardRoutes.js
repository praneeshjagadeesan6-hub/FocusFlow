const express = require('express');
const { getDueFlashcards, createFlashcard, reviewFlashcard } = require('../controllers/flashcardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getDueFlashcards).post(protect, createFlashcard);
router.route('/:id/review').post(protect, reviewFlashcard);

module.exports = router;

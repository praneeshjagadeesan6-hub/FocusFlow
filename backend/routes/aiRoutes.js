const express = require('express');
const multer = require('multer');
const { getGeminiBreakdown, getGeminiQuiz, generateSyllabusFlashcards } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

router.post('/breakdown', protect, getGeminiBreakdown);
router.post('/quiz', protect, getGeminiQuiz);
router.post('/syllabus-flashcards', protect, upload.single('syllabus'), generateSyllabusFlashcards);

module.exports = router;

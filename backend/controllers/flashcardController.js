const Flashcard = require('../models/Flashcard');

const getDueFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      user: req.user._id,
      nextReviewAt: { $lte: new Date() },
    }).sort({ nextReviewAt: 1 });

    res.json(flashcards);
  } catch (error) {
    next(error);
  }
};

const createFlashcard = async (req, res, next) => {
  try {
    const {
      question,
      answer,
      subject,
      type = 'theory',
      options = [],
      correctOption = 0,
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const normalizedSubject = subject || 'General';

    if (type === 'mcq') {
      const normalizedOptions = Array.isArray(options)
        ? options.map((option) => String(option || '').trim()).filter(Boolean)
        : [];

      if (normalizedOptions.length !== 4) {
        return res.status(400).json({ message: 'MCQ flashcards require exactly four options' });
      }

      const optionIndex = Number(correctOption);
      if (Number.isNaN(optionIndex) || optionIndex < 0 || optionIndex > 3) {
        return res.status(400).json({ message: 'Please select a valid correct option' });
      }

      const flashcard = await Flashcard.create({
        user: req.user._id,
        question: question.trim(),
        answer: normalizedOptions[optionIndex],
        subject: normalizedSubject,
        type: 'mcq',
        options: normalizedOptions,
        correctOption: optionIndex,
        easeFactor: 2.5,
        interval: 1,
        nextReviewAt: new Date(),
      });

      return res.status(201).json(flashcard);
    }

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: 'Answer is required for theory flashcards' });
    }

    const flashcard = await Flashcard.create({
      user: req.user._id,
      question: question.trim(),
      answer: answer.trim(),
      subject: normalizedSubject,
      type: 'theory',
      easeFactor: 2.5,
      interval: 1,
      nextReviewAt: new Date(),
    });

    res.status(201).json(flashcard);
  } catch (error) {
    next(error);
  }
};

const reviewFlashcard = async (req, res, next) => {
  try {
    const { rating } = req.body;
    const flashcard = await Flashcard.findOne({ _id: req.params.id, user: req.user._id });

    if (!flashcard) {
      return res.status(404).json({ message: 'Flashcard not found' });
    }

    const normalizedRating = Number(rating || 0);

    if (normalizedRating >= 1 && normalizedRating <= 5) {
      if (normalizedRating >= 3) {
        flashcard.easeFactor = Math.max(1.3, flashcard.easeFactor + (0.1 * (normalizedRating - 2)));
        flashcard.interval = Math.max(1, Math.round(flashcard.interval * flashcard.easeFactor));
      } else {
        flashcard.easeFactor = Math.max(1.3, flashcard.easeFactor - 0.2);
        flashcard.interval = 1;
      }

      flashcard.nextReviewAt = new Date(Date.now() + flashcard.interval * 24 * 60 * 60 * 1000);
      await flashcard.save();
    }

    res.json(flashcard);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDueFlashcards,
  createFlashcard,
  reviewFlashcard,
};

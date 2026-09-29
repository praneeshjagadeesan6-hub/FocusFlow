const axios = require('axios');
const { PDFParse } = require('pdf-parse');
const Flashcard = require('../models/Flashcard');

const buildFallbackCards = (text, subject, type) => {
  const sentences = (text.match(/[^.!?]+[.!?]?/g) || [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35)
    .slice(0, 6);

  return sentences.flatMap((sentence, index) => {
    const topic = sentence.split(/\s+/).slice(0, 5).join(' ').replace(/[,:;.]$/, '');
    const distractors = [
      'This point is not covered in the uploaded syllabus.',
      'The syllabus gives no information about this topic.',
      'This topic is unrelated to the selected subject.',
    ];
    const options = [sentence, ...distractors];
    const mcqCard = {
        question: `Which statement about ${topic} is supported by the ${subject} syllabus?`,
        answer: sentence,
        subject,
        type: 'mcq',
        options,
        correctOption: 0,
        nextReviewAt: new Date(),
    };
    const theoryCard = {
        question: `State the key point about ${topic}.`,
        answer: sentence.slice(0, 240),
        subject,
        type: 'theory',
        nextReviewAt: new Date(),
    };

    return type === 'mcq' ? [mcqCard] : [theoryCard];
  });
};

const generateSyllabusFlashcards = async (req, res, next) => {
  try {
    const subject = String(req.body.subject || '').trim();
    const type = String(req.body.type || '').trim();
    const file = req.file;

    if (!subject) return res.status(400).json({ message: 'Subject name is required' });
    if (!['mcq', 'theory'].includes(type)) return res.status(400).json({ message: 'Select MCQ or theory cards to generate' });
    if (!file) return res.status(400).json({ message: 'Upload a syllabus PDF, TXT, or MD file' });

    const extension = file.originalname.split('.').pop().toLowerCase();
    if (!['pdf', 'txt', 'md'].includes(extension)) {
      return res.status(400).json({ message: 'Only PDF, TXT, and MD syllabus files are supported' });
    }

    let extracted;
    if (extension === 'pdf') {
      const parser = new PDFParse({ data: file.buffer });
      try {
        extracted = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else {
      extracted = file.buffer.toString('utf8');
    }
    const syllabusText = extracted.replace(/\s+/g, ' ').trim().slice(0, 24000);
    if (syllabusText.length < 80) {
      return res.status(400).json({ message: 'The syllabus has too little readable text to generate revision cards' });
    }

    let generatedCards;
    let generatedBy = 'fallback';

    if (process.env.GEMINI_API_KEY) {
      const requestedType = type === 'mcq' ? 'multiple-choice' : 'short-answer theory';
      const prompt = `Create 10 ${requestedType} revision flashcards using only the syllabus text below. Return valid JSON with a "flashcards" array. Every item must have type set to "${type}", question, and answer. ${type === 'mcq' ? 'Each item must have exactly four options and correctOption as an integer from 0 to 3.' : 'Answers must be concise and no more than 40 words.'} Do not include any other card type or invent facts. Subject: ${subject}\nSyllabus: ${syllabusText}`;
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );
      const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonText = generatedText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonText.slice(jsonText.indexOf('{'), jsonText.lastIndexOf('}') + 1));
      generatedCards = (parsed.flashcards || []).flatMap((card) => {
        const question = String(card.question || '').trim();
        const answer = String(card.answer || '').trim().slice(0, 240);
        if (!question || !answer) return [];
        if (type === 'mcq' && card.type === 'mcq') {
          const options = Array.isArray(card.options) ? card.options.map((option) => String(option).trim()).filter(Boolean) : [];
          const correctOption = Number(card.correctOption);
          if (options.length !== 4 || !Number.isInteger(correctOption) || correctOption < 0 || correctOption > 3) return [];
          return [{ question, answer: options[correctOption], subject, type: 'mcq', options, correctOption, nextReviewAt: new Date() }];
        }
        if (type === 'theory' && card.type === 'theory') {
          return [{ question, answer, subject, type: 'theory', nextReviewAt: new Date() }];
        }
        return [];
      });
      generatedBy = 'gemini';
    } else {
      generatedCards = buildFallbackCards(syllabusText, subject, type);
    }

    if (!generatedCards.length) {
      return res.status(422).json({ message: 'Could not generate revision cards from this syllabus' });
    }

    const savedCards = await Flashcard.insertMany(generatedCards.map((card) => ({ ...card, user: req.user._id })));
    res.status(201).json({ count: savedCards.length, generatedBy, flashcards: savedCards });
  } catch (error) {
    next(error);
  }
};

const getGeminiBreakdown = async (req, res, next) => {
  try {
    const { taskTitle, description, subject } = req.body;

    if (!taskTitle) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const prompt = `Create a concise study breakdown for this task. Return JSON with fields: title, steps, quizQuestions.\nTask: ${taskTitle}\nDescription: ${description || ''}\nSubject: ${subject || 'General'}`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        title: taskTitle,
        steps: [
          'Review the task outline',
          'Complete the first high-priority section',
          'Revise and summarize your notes',
        ],
        quizQuestions: [
          { question: `What is the main objective of ${taskTitle}?`, options: ['To memorize facts', 'To understand and apply', 'To ignore the topic', 'To skip revision'], answer: 'To understand and apply' },
        ],
      });
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonText = text.replace(/```json|```/g, '').trim();

    res.json(JSON.parse(jsonText));
  } catch (error) {
    next(error);
  }
};

const getGeminiQuiz = async (req, res, next) => {
  try {
    const { subject, topic } = req.body;

    const fallbackQuestions = [
      {
        question: `What is the most important concept to review in ${subject || 'this subject'}?`,
        options: ['Core definitions', 'Random facts', 'Nothing', 'Only deadlines'],
        answer: 'Core definitions',
      },
    ];

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ quizQuestions: fallbackQuestions });
    }

    const prompt = `Generate 3 quiz questions for ${subject || 'a study subject'} on ${topic || 'general revision'}. Return JSON with a quizQuestions array.`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonText = text.replace(/```json|```/g, '').trim();

    res.json(JSON.parse(jsonText));
  } catch (error) {
    next(error);
  }
};

module.exports = { getGeminiBreakdown, getGeminiQuiz, generateSyllabusFlashcards };

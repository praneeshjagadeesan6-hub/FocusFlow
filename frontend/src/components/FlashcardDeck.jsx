import { useEffect, useState } from 'react';

const FlashcardDeck = ({ cards = [], onRate, type = 'theory' }) => {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setSelectedOption(null);
    setFeedback('');
  }, [cards, type]);

  if (!cards.length) {
    return (
      <div className="card">
        <h4>Flashcards</h4>
        <p>No {type === 'mcq' ? 'MCQ' : 'theory'} flashcards due today.</p>
      </div>
    );
  }

  const card = cards[idx];

  const handleRate = async (rating) => {
    if (onRate) {
      await onRate(card._id, rating);
    }

    setIdx((prev) => (prev + 1) % cards.length);
    setFlipped(false);
    setSelectedOption(null);
    setFeedback('');
  };

  const handleMcqAnswer = async (optionIndex) => {
    if (selectedOption !== null) return;

    const isCorrect = optionIndex === card.correctOption;
    setSelectedOption(optionIndex);
    setFeedback(isCorrect ? 'Correct' : 'Wrong');

    if (onRate) {
      await onRate(card._id, isCorrect ? 5 : 1);
    }

    setTimeout(() => {
      setIdx((prev) => (prev + 1) % cards.length);
      setSelectedOption(null);
      setFeedback('');
    }, 900);
  };

  if (type === 'mcq') {
    return (
      <div className="card flashcard-deck">
        <h4>MCQ Review</h4>
        <div className="flashcard mcq-question-card">
          <p>{card.question}</p>
        </div>

        <div className="mcq-options">
          {card.options?.map((option, optionIndex) => (
            <button
              key={`${card._id}-${optionIndex}`}
              type="button"
              className={`mcq-option ${selectedOption === optionIndex ? 'selected' : ''}`}
              onClick={() => handleMcqAnswer(optionIndex)}
              disabled={selectedOption !== null}
            >
              {option}
            </button>
          ))}
        </div>

        {feedback && (
          <div className={`mcq-feedback ${feedback === 'Correct' ? 'correct' : 'wrong'}`}>
            {feedback === 'Correct'
              ? 'Correct'
              : `Wrong. Correct answer: ${card.options?.[card.correctOption]}`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card flashcard-deck">
      <h4>Theory Review</h4>
      <div className="flashcard" onClick={() => setFlipped((prev) => !prev)}>
        <p>{flipped ? card.answer : card.question}</p>
      </div>
      <button type="button" className="reveal-answer-button" onClick={() => setFlipped((previous) => !previous)}>
        {flipped ? 'Show question' : "I don't know - show short answer"}
      </button>
      <div className="flashcard-actions">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button key={rating} onClick={() => handleRate(rating)}>{rating}</button>
        ))}
      </div>
    </div>
  );
};

export default FlashcardDeck;

import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import FlashcardDeck from '../components/FlashcardDeck';

const FlashcardsPage = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState('General');
  const [activeType, setActiveType] = useState('theory');
  const [syllabusSubject, setSyllabusSubject] = useState('');
  const [syllabusFile, setSyllabusFile] = useState(null);
  const syllabusInputRef = useRef(null);
  const [showGenerationOptions, setShowGenerationOptions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');

  const fetchFlashcards = async () => {
    try {
      const res = await axiosInstance.get('/flashcards');
      setFlashcards(res.data);
      return res.data;
    } catch (error) {
      console.error('Failed to fetch flashcards', error);
      return [];
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axiosInstance.get('/subjects');
      setSubjects(res.data);
    } catch (error) {
      console.error('Failed to fetch subjects', error);
    }
  };

  useEffect(() => {
    fetchFlashcards();
    fetchSubjects();
  }, []);

  const availableSubjects = Array.from(
    new Set([
      'General',
      ...subjects.map((subject) => subject.name),
      ...flashcards.map((card) => card.subject || 'General'),
    ])
  );

  useEffect(() => {
    if (availableSubjects.length && !availableSubjects.includes(activeSubject)) {
      setActiveSubject(availableSubjects[0]);
    }
  }, [availableSubjects, activeSubject]);

  const visibleCards = flashcards.filter(
    (card) => (card.subject || 'General') === activeSubject && (card.type || 'theory') === activeType
  );

  const handleReview = async (cardId, rating) => {
    try {
      await axiosInstance.post(`/flashcards/${cardId}/review`, { rating });
      fetchFlashcards();
    } catch (error) {
      console.error('Failed to review flashcard', error);
    }
  };

  const handleSyllabusSubmit = (event) => {
    event.preventDefault();
    if (!syllabusFile || !syllabusSubject.trim()) return;
    setShowGenerationOptions(true);
    setGenerationMessage('');
  };

  const generateSyllabusCards = async (type) => {
    if (!syllabusFile || !syllabusSubject.trim() || generating) return;

    const formData = new FormData();
    formData.append('subject', syllabusSubject.trim());
    formData.append('syllabus', syllabusFile);
    formData.append('type', type);
    setGenerating(true);
    setGenerationMessage('');

    try {
      const response = await axiosInstance.post('/ai/syllabus-flashcards', formData);
      await fetchFlashcards();
      setActiveSubject(syllabusSubject.trim());
      setActiveType(type);
      setGenerationMessage(`${response.data.count} ${type === 'mcq' ? 'MCQ' : 'theory'} revision cards added${response.data.generatedBy === 'fallback' ? ' using the local generator' : ''}.`);
      setSyllabusFile(null);
      setShowGenerationOptions(false);
      if (syllabusInputRef.current) syllabusInputRef.current.value = '';
    } catch (error) {
      setGenerationMessage(error.response?.data?.message || 'Could not generate cards from this syllabus.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-shell">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Flashcards</p>
            <h3>Daily review</h3>
          </div>
        </header>

        <section className="planner-layout flashcards-layout">
          <form className="card syllabus-generator" onSubmit={handleSyllabusSubmit}>
            <h4>Generate from syllabus</h4>
            <input
              value={syllabusSubject}
              onChange={(event) => {
                setSyllabusSubject(event.target.value);
                setShowGenerationOptions(false);
              }}
              placeholder="Subject name"
              aria-label="Syllabus subject name"
              required
            />
            <label className="upload-zone resource-upload-zone">
              <input
                ref={syllabusInputRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                className="hidden-file-input"
                onChange={(event) => {
                  setSyllabusFile(event.target.files?.[0] || null);
                  setShowGenerationOptions(false);
                }}
                required
              />
              <div className="upload-icon">PDF</div>
              <p>{syllabusFile?.name || 'Choose a syllabus file'}</p>
              <small>PDF, TXT, or MD · up to 8 MB</small>
            </label>
            {showGenerationOptions && (
              <>
                <p>Select the card type to start generation.</p>
                <div className="generation-type-options" role="group" aria-label="Revision card type">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => generateSyllabusCards('mcq')}
                  >
                    {generating ? 'Generating...' : 'Generate MCQ'}
                  </button>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => generateSyllabusCards('theory')}
                  >
                    {generating ? 'Generating...' : 'Generate Theory'}
                  </button>
                </div>
              </>
            )}
            {!showGenerationOptions && (
              <button type="submit" disabled={generating || !syllabusFile || !syllabusSubject.trim()}>
                Generate with AI
              </button>
            )}
            {generationMessage && <p role="status">{generationMessage}</p>}
          </form>

          <div className="card flashcards-right-panel">
            <h4>Review type</h4>
            <div className="flashcard-type-tabs">
              <button
                type="button"
                className={activeType === 'theory' ? 'active' : ''}
                onClick={() => setActiveType('theory')}
              >
                Theory
              </button>
              <button
                type="button"
                className={activeType === 'mcq' ? 'active' : ''}
                onClick={() => setActiveType('mcq')}
              >
                MCQ
              </button>
            </div>

            <h4>Subjects</h4>
            <div className="subject-list">
              {availableSubjects.map((subject) => (
                <button
                  key={subject}
                  type="button"
                  className={`subject-button ${activeSubject === subject ? 'active' : ''}`}
                  onClick={() => setActiveSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>

            <FlashcardDeck cards={visibleCards} onRate={handleReview} type={activeType} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default FlashcardsPage;

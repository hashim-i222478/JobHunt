import React, { useState } from 'react';
import axios from 'axios';
import {
    FaRobot, FaBrain, FaLightbulb, FaPlay, FaChevronDown, FaChevronUp,
    FaClock, FaCheck, FaCode, FaUsers, FaCogs, FaGraduationCap,
    FaExclamationTriangle, FaSyncAlt, FaPaperPlane, FaTimes, FaStar
} from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Easy', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'hard', label: 'Hard', color: '#ef4444' }
];

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories', icon: <FaBrain /> },
    { value: 'technical', label: 'Technical', icon: <FaCode /> },
    { value: 'behavioral', label: 'Behavioral', icon: <FaUsers /> },
    { value: 'system-design', label: 'System Design', icon: <FaCogs /> }
];

function InterviewPrep({ resumeData }) {
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [difficulty, setDifficulty] = useState('medium');
    const [category, setCategory] = useState('all');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedQuestions, setExpandedQuestions] = useState({});
    const [showHints, setShowHints] = useState({});
    const [summary, setSummary] = useState(null);
    const [askedQuestions, setAskedQuestions] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [evaluations, setEvaluations] = useState({});
    const [evaluating, setEvaluating] = useState({});

    const availableSkills = resumeData?.skills || [];

    const toggleSkill = (skill) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const selectAllSkills = () => {
        setSelectedSkills(availableSkills.slice(0, 10)); // Max 10 skills
    };

    const clearSkills = () => {
        setSelectedSkills([]);
    };

    const generateQuestions = async () => {
        if (selectedSkills.length === 0) {
            setError('Please select at least one skill');
            return;
        }

        setLoading(true);
        setError(null);
        setQuestions([]);
        setExpandedQuestions({});
        setShowHints({});
        setUserAnswers({});
        setEvaluations({});

        try {
            const response = await axios.post(`${API_URL}/interview/generate`, {
                skills: selectedSkills,
                role: resumeData?.suggestedRoles?.[0] || '',
                difficulty,
                category,
                excludeQuestions: [] // Fresh start
            });

            if (response.data.success) {
                const newQuestions = response.data.data.questions || [];
                setQuestions(newQuestions);
                setSummary(response.data.data.summary || null);
                // Track these questions to avoid repetition
                setAskedQuestions(newQuestions.map(q => q.question));
            } else {
                setError('Failed to generate questions');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Generate new questions that don't repeat previous ones
    const generateNewQuestions = async () => {
        if (selectedSkills.length === 0) {
            setError('Please select at least one skill');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_URL}/interview/generate`, {
                skills: selectedSkills,
                role: resumeData?.suggestedRoles?.[0] || '',
                difficulty,
                category,
                excludeQuestions: askedQuestions // Send previous questions to exclude
            });

            if (response.data.success) {
                const newQuestions = response.data.data.questions || [];
                // Replace current questions with new ones
                setQuestions(newQuestions);
                setSummary(response.data.data.summary || null);
                // Add new questions to tracked list
                setAskedQuestions(prev => [...prev, ...newQuestions.map(q => q.question)]);
                // Reset expanded states
                setExpandedQuestions({});
                setShowHints({});
                setUserAnswers({});
                setEvaluations({});
            } else {
                setError('Failed to generate new questions');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate new questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestion = (id) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
        // Hide hints when showing full answer
        if (!expandedQuestions[id]) {
            setShowHints(prev => ({ ...prev, [id]: false }));
        }
    };

    const toggleHints = (id) => {
        setShowHints(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Submit user's answer for AI evaluation
    const submitAnswer = async (questionId, question, expectedPoints) => {
        const userAnswer = userAnswers[questionId];
        if (!userAnswer || userAnswer.trim() === '') {
            return;
        }

        setEvaluating(prev => ({ ...prev, [questionId]: true }));

        try {
            const response = await axios.post(`${API_URL}/interview/evaluate`, {
                question,
                answer: userAnswer,
                expectedPoints
            });

            if (response.data.success) {
                setEvaluations(prev => ({
                    ...prev,
                    [questionId]: response.data.data
                }));
            }
        } catch (err) {
            setEvaluations(prev => ({
                ...prev,
                [questionId]: { error: 'Failed to evaluate answer. Please try again.' }
            }));
        } finally {
            setEvaluating(prev => ({ ...prev, [questionId]: false }));
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'technical': return <FaCode />;
            case 'behavioral': return <FaUsers />;
            case 'problem-solving': return <FaLightbulb />;
            case 'system-design': return <FaCogs />;
            default: return <FaBrain />;
        }
    };

    const getDifficultyColor = (diff) => {
        switch (diff) {
            case 'easy': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'hard': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div className="interview-prep-page">
            <div className="page-header">
                <h2><FaGraduationCap style={{ marginRight: '12px' }} />Interview Prep</h2>
                <p>Practice interview questions tailored to your skills</p>
            </div>

            {!resumeData ? (
                <div className="info-banner warning">
                    <FaExclamationTriangle />
                    <p>
                        <a href="/">Upload your resume</a> first to get personalized interview questions based on your skills.
                    </p>
                </div>
            ) : (
                <>
                    {/* Skills Selection */}
                    <div className="prep-section skills-section">
                        <div className="section-header">
                            <h3><FaCode style={{ marginRight: '8px' }} />Select Skills to Practice</h3>
                            <div className="section-actions">
                                <button className="btn btn-text" onClick={selectAllSkills}>Select All</button>
                                <button className="btn btn-text" onClick={clearSkills}>Clear</button>
                            </div>
                        </div>
                        <div className="skills-grid">
                            {availableSkills.map((skill, index) => (
                                <button
                                    key={index}
                                    className={`skill-chip ${selectedSkills.includes(skill) ? 'selected' : ''}`}
                                    onClick={() => toggleSkill(skill)}
                                >
                                    {selectedSkills.includes(skill) && <FaCheck style={{ marginRight: '6px' }} />}
                                    {skill}
                                </button>
                            ))}
                        </div>
                        {selectedSkills.length > 0 && (
                            <p className="selected-count">{selectedSkills.length} skill{selectedSkills.length > 1 ? 's' : ''} selected</p>
                        )}
                    </div>

                    {/* Options */}
                    <div className="prep-section options-section">
                        <div className="options-grid">
                            <div className="option-group">
                                <label>Difficulty</label>
                                <div className="difficulty-buttons">
                                    {DIFFICULTY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`difficulty-btn ${difficulty === opt.value ? 'active' : ''}`}
                                            onClick={() => setDifficulty(opt.value)}
                                            style={{ '--diff-color': opt.color }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="option-group">
                                <label>Question Category</label>
                                <div className="category-buttons">
                                    {CATEGORY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            className={`category-btn ${category === opt.value ? 'active' : ''}`}
                                            onClick={() => setCategory(opt.value)}
                                        >
                                            {opt.icon}
                                            <span>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="generate-section">
                        <button
                            className="btn btn-primary btn-generate"
                            onClick={generateQuestions}
                            disabled={loading || selectedSkills.length === 0}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-small"></span>
                                    Generating Questions...
                                </>
                            ) : (
                                <>
                                    <FaRobot style={{ marginRight: '8px' }} />
                                    Generate Interview Questions
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="error-message">
                            <FaExclamationTriangle style={{ marginRight: '8px' }} />
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <h3>Generating Your Interview Questions</h3>
                            <p>AI is crafting personalized questions based on your skills...</p>
                        </div>
                    )}

                    {/* Questions */}
                    {!loading && questions.length > 0 && (
                        <div className="questions-section">
                            {summary && (
                                <div className="questions-summary">
                                    <span><strong>{summary.totalQuestions}</strong> questions</span>
                                    <span><FaClock style={{ marginRight: '4px' }} />{summary.estimatedDuration}</span>
                                    {askedQuestions.length > 0 && (
                                        <span className="questions-practiced">
                                            {askedQuestions.length} practiced total
                                        </span>
                                    )}
                                    <div className="summary-actions">
                                        <button className="btn btn-outline btn-sm" onClick={generateQuestions}>
                                            <FaSyncAlt style={{ marginRight: '6px' }} />
                                            Start Fresh
                                        </button>
                                        <button className="btn btn-primary btn-sm" onClick={generateNewQuestions}>
                                            <FaPlay style={{ marginRight: '6px' }} />
                                            New Questions
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="questions-list">
                                {questions.map((q, index) => (
                                    <div key={q.id || index} className="question-card">
                                        <div
                                            className="question-header"
                                            onClick={() => toggleQuestion(q.id || index)}
                                        >
                                            <div className="question-meta">
                                                <span className="question-number">Q{index + 1}</span>
                                                <span className="question-category" style={{ color: getCategoryIcon(q.category) }}>
                                                    {getCategoryIcon(q.category)} {q.category}
                                                </span>
                                                <span
                                                    className="question-difficulty"
                                                    style={{ backgroundColor: getDifficultyColor(q.difficulty) + '20', color: getDifficultyColor(q.difficulty) }}
                                                >
                                                    {q.difficulty}
                                                </span>
                                                {q.skill && <span className="question-skill">{q.skill}</span>}
                                            </div>
                                            <span className="expand-icon">
                                                {expandedQuestions[q.id || index] ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        </div>

                                        <h4 className="question-text">{q.question}</h4>

                                        <div className="question-buttons">
                                            <button
                                                className="btn btn-show-hints"
                                                onClick={() => toggleHints(q.id || index)}
                                            >
                                                {showHints[q.id || index] ? (
                                                    <>
                                                        <FaChevronUp style={{ marginRight: '6px' }} />
                                                        Hide Hints
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaBrain style={{ marginRight: '6px' }} />
                                                        Show Hints
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-view-answer"
                                                onClick={() => toggleQuestion(q.id || index)}
                                            >
                                                {expandedQuestions[q.id || index] ? (
                                                    <>
                                                        <FaChevronUp style={{ marginRight: '6px' }} />
                                                        Hide Answer
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaLightbulb style={{ marginRight: '6px' }} />
                                                        View Answer
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* User Answer Input */}
                                        <div className="user-answer-section">
                                            <label className="answer-label">Your Answer:</label>
                                            <textarea
                                                className="answer-textarea"
                                                placeholder="Type your answer here..."
                                                value={userAnswers[q.id || index] || ''}
                                                onChange={(e) => handleAnswerChange(q.id || index, e.target.value)}
                                                disabled={evaluating[q.id || index]}
                                            />
                                            <button
                                                className="btn btn-primary btn-submit-answer"
                                                onClick={() => submitAnswer(q.id || index, q.question, q.expectedPoints)}
                                                disabled={evaluating[q.id || index] || !userAnswers[q.id || index]?.trim()}
                                            >
                                                {evaluating[q.id || index] ? (
                                                    <>
                                                        <span className="spinner-small"></span>
                                                        Evaluating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaPaperPlane style={{ marginRight: '6px' }} />
                                                        Submit Answer
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Evaluation Results */}
                                        {evaluations[q.id || index] && !evaluations[q.id || index].error && (
                                            <div className="evaluation-result">
                                                <div className="evaluation-header">
                                                    <h5><FaStar style={{ marginRight: '6px', color: 'var(--warm)' }} />AI Evaluation</h5>
                                                    <div className="score-badge" style={{
                                                        backgroundColor: evaluations[q.id || index].score >= 7 ? 'var(--status-success)' :
                                                            evaluations[q.id || index].score >= 4 ? 'var(--status-warning)' : 'var(--status-error)'
                                                    }}>
                                                        {evaluations[q.id || index].score}/10
                                                    </div>
                                                </div>

                                                {evaluations[q.id || index].strengths?.length > 0 && (
                                                    <div className="evaluation-section strengths">
                                                        <h6><FaCheck style={{ marginRight: '4px', color: 'var(--status-success)' }} />Strengths</h6>
                                                        <ul>
                                                            {evaluations[q.id || index].strengths.map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {evaluations[q.id || index].improvements?.length > 0 && (
                                                    <div className="evaluation-section improvements">
                                                        <h6><FaExclamationTriangle style={{ marginRight: '4px', color: 'var(--status-warning)' }} />Areas to Improve</h6>
                                                        <ul>
                                                            {evaluations[q.id || index].improvements.map((imp, i) => (
                                                                <li key={i}>{imp}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {evaluations[q.id || index].suggestedAnswer && (
                                                    <div className="evaluation-section suggested">
                                                        <h6><FaLightbulb style={{ marginRight: '4px', color: 'var(--electric)' }} />Suggested Answer</h6>
                                                        <p>{evaluations[q.id || index].suggestedAnswer}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Evaluation Error */}
                                        {evaluations[q.id || index]?.error && (
                                            <div className="evaluation-error">
                                                <FaTimes style={{ marginRight: '6px' }} />
                                                {evaluations[q.id || index].error}
                                            </div>
                                        )}

                                        {/* Show Hints Only */}
                                        {showHints[q.id || index] && !expandedQuestions[q.id || index] && (
                                            <div className="question-hints">
                                                <div className="answer-section">
                                                    <h5><FaLightbulb style={{ marginRight: '6px', color: 'var(--warm)' }} />Key Points</h5>
                                                    <ul className="answer-points">
                                                        {q.expectedPoints?.map((point, i) => (
                                                            <li key={i}>{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {q.tips && (
                                                    <div className="tips-section">
                                                        <h5><FaBrain style={{ marginRight: '6px', color: 'var(--electric)' }} />Tips</h5>
                                                        <p>{q.tips}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Show Full Answer */}
                                        {expandedQuestions[q.id || index] && (
                                            <div className="question-answer">
                                                {q.detailedAnswer && (
                                                    <div className="detailed-answer-section">
                                                        <h5><FaCheck style={{ marginRight: '6px', color: 'var(--status-success)' }} />Sample Answer</h5>
                                                        <div className="detailed-answer">
                                                            {q.detailedAnswer}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="answer-section">
                                                    <h5><FaLightbulb style={{ marginRight: '6px', color: 'var(--warm)' }} />Key Points</h5>
                                                    <ul className="answer-points">
                                                        {q.expectedPoints?.map((point, i) => (
                                                            <li key={i}>{point}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                {q.tips && (
                                                    <div className="tips-section">
                                                        <h5><FaBrain style={{ marginRight: '6px', color: 'var(--electric)' }} />Tips</h5>
                                                        <p>{q.tips}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && questions.length === 0 && selectedSkills.length > 0 && !error && (
                        <div className="empty-state">
                            <FaPlay style={{ fontSize: '3rem', marginBottom: '16px' }} />
                            <h3>Ready to Practice?</h3>
                            <p>Click "Generate Interview Questions" to get AI-powered questions based on your selected skills.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default InterviewPrep;

import React, { useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import {
    FaMagic, FaArrowRight, FaExclamationTriangle, FaCheck, FaCopy,
    FaChartLine, FaLightbulb, FaPlusCircle, FaFileAlt, FaRocket,
    FaExclamationCircle, FaStar, FaEdit
} from 'react-icons/fa';

function ResumeTailor({ resumeData }) {
    const location = useLocation();
    const initialJobDescription = location.state?.jobDescription || '';

    const [jobDescription, setJobDescription] = useState(initialJobDescription);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('analysis');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [showInput, setShowInput] = useState(true);

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            setError('Please enter a job description.');
            return;
        }

        const resumeText = resumeData?.rawText || JSON.stringify(resumeData);

        if (!resumeText) {
            setError('No resume data found. Please upload a resume first.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await axios.post(`${API_URL}/api/tailor`, {
                resumeText,
                jobDescription
            });
            setAnalysis(response.data);
            setActiveTab('suggestions');
            setShowInput(false); // Hide input after successful analysis
        } catch (err) {
            console.error('Analysis failed:', err);
            setError('Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const getScoreColor = (score) => {
        if (score >= 75) return '#10b981';
        if (score >= 50) return '#f59e0b';
        if (score >= 25) return '#f97316';
        return '#ef4444';
    };

    const getImpactBadge = (impact) => {
        const colors = {
            high: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', icon: <FaStar /> },
            medium: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', icon: <FaBolt /> },
            low: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', icon: <FaLightbulb /> },
        };
        const style = colors[impact] || colors.medium;
        return (
            <span className="impact-badge" style={{ background: style.bg, color: style.color }}>
                {style.icon} {impact?.toUpperCase()} IMPACT
            </span>
        );
    };

    // Helper icon components for badge above (FaBolt is not imported, swapping to FaRocket for medium)
    const FaBolt = FaRocket;

    return (
        <div className="resume-tailor-page page-container">
            {/* Hero Header */}
            <div className="tailor-hero">
                <div className="tailor-hero-content">
                    <div className="tailor-hero-icon"><FaMagic /></div>
                    <div>
                        <h2>AI Resume Tailor <span className="beta-badge">BETA</span></h2>
                        <p>Get expert advice on how to tailor your resume for a specific job description.</p>
                    </div>
                </div>
            </div>

            <div className="tailor-content-wrapper">
                {/* Input Section - Collapsible */}
                {/* Input Section - Collapsible */}
                {showInput && !loading ? (
                    <div className="tailor-input-section card fade-in">
                        <div className="section-header-row">
                            <FaFileAlt className="section-icon" />
                            <h3>Job Description</h3>
                        </div>
                        <p className="input-hint">Paste the full job posting below to get started.</p>
                        <textarea
                            className="tailor-textarea"
                            placeholder="Paste the complete job description here..."
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            rows={12}
                        />
                        <div className="input-actions end">
                            <button
                                className="btn btn-analyze"
                                onClick={handleAnalyze}
                                disabled={loading || !jobDescription.trim()}
                            >
                                <FaRocket /> Show Suggestions
                            </button>
                        </div>

                        {error && (
                            <div className="error-message">
                                <FaExclamationTriangle /> {error}
                            </div>
                        )}
                    </div>
                ) : !loading && (
                    <div className="input-collapsed-bar fade-in">
                        <div className="collapsed-info">
                            <FaCheck className="success-icon" />
                            <span>Analysis based on provided Job Description</span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowInput(true)}>
                            <FaEdit /> Edit Job Description
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loading-container fade-in">
                        <div className="loading-spinner-large"></div>
                        <h3>Analyzing Your Resume Match...</h3>
                        <p>Identifying missing keywords, formatting gaps, and potential improvements.</p>
                    </div>
                )}

                {/* Results Section */}
                {analysis && !loading && (
                    <div className="tailor-results-container fade-in">
                        {/* Tabs */}
                        <div className="tailor-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                                onClick={() => setActiveTab('analysis')}
                            >
                                <FaChartLine /> Analysis
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('suggestions')}
                            >
                                <FaLightbulb /> Rewrites
                                {analysis.suggestedRewrites && (
                                    <span className="tab-count">{analysis.suggestedRewrites.length}</span>
                                )}
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'additions' ? 'active' : ''}`}
                                onClick={() => setActiveTab('additions')}
                            >
                                <FaPlusCircle /> Add New
                                {analysis.additionalSuggestions && (
                                    <span className="tab-count">{analysis.additionalSuggestions.length}</span>
                                )}
                            </button>
                        </div>

                        {/* ====== ANALYSIS TAB ====== */}
                        {activeTab === 'analysis' && (
                            <div className="tab-content fade-in">
                                {/* Score Card */}
                                <div className="match-score-card card">
                                    <div className="score-visual">
                                        <div
                                            className="score-ring"
                                            style={{
                                                '--score': analysis.analysis.matchScore,
                                                '--score-color': getScoreColor(analysis.analysis.matchScore)
                                            }}
                                        >
                                            <span className="score-value">{analysis.analysis.matchScore}%</span>
                                        </div>
                                    </div>
                                    <div className="score-details">
                                        <h4>Overall Match Score</h4>
                                        <p className="score-summary">{analysis.analysis.summary}</p>
                                    </div>
                                </div>

                                <div className="analysis-grid-row">
                                    {/* Strengths */}
                                    {analysis.analysis.strengths?.length > 0 && (
                                        <div className="sg-card card strengths-card">
                                            <h4><FaCheck className="sg-icon green" /> Key Strengths</h4>
                                            <ul>
                                                {analysis.analysis.strengths.map((s, i) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Gaps */}
                                    {analysis.analysis.gaps?.length > 0 && (
                                        <div className="sg-card card gaps-card">
                                            <h4><FaExclamationCircle className="sg-icon red" /> Potential Gaps</h4>
                                            <ul>
                                                {analysis.analysis.gaps.map((g, i) => (
                                                    <li key={i}>{g}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Missing Keywords */}
                                <div className="keywords-card card">
                                    <h3><FaStar className="icon-gold" /> Missing Keywords</h3>
                                    <p className="section-desc">Consider adding these keywords to improve your ATS ranking.</p>
                                    <div className="keywords-grid">
                                        {analysis.missingKeywords.map((kw, i) => {
                                            const keyword = typeof kw === 'string' ? kw : kw.keyword;
                                            const context = typeof kw === 'object' ? kw.context : '';
                                            return (
                                                <div key={i} className="keyword-chip">
                                                    <span className="keyword-name">{keyword}</span>
                                                    {context && <span className="keyword-tooltip">{context}</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ====== SUGGESTIONS / REWRITES TAB ====== */}
                        {activeTab === 'suggestions' && (
                            <div className="tab-content fade-in">
                                <div className="rewrites-header">
                                    <h3>Suggested Improvements</h3>
                                    <p>Review these suggestions to strengthen specific bullet points in your resume.</p>
                                </div>
                                <div className="rewrites-list">
                                    {analysis.suggestedRewrites.map((item, i) => (
                                        <div key={i} className="rewrite-card card">
                                            <div className="rewrite-card-top">
                                                <span className="section-badge">{item.section || 'General'}</span>
                                                {item.impact && getImpactBadge(item.impact)}
                                            </div>

                                            <div className="rewrite-content-grid">
                                                <div className="content-block original">
                                                    <h5>Original Text</h5>
                                                    <div className="text-box">{item.original}</div>
                                                </div>

                                                <div className="arrow-divider">
                                                    <FaArrowRight />
                                                </div>

                                                <div className="content-block suggested">
                                                    <h5>Suggested Change</h5>
                                                    <div className="text-box highlight">{item.rewrite}</div>
                                                </div>
                                            </div>

                                            <div className="rewrite-footer">
                                                <div className="reason-text">
                                                    <FaMagic className="reason-icon" />
                                                    <span>{item.reason}</span>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-secondary copy-btn"
                                                    onClick={() => handleCopy(item.rewrite, `rewrite-${i}`)}
                                                >
                                                    {copiedIndex === `rewrite-${i}` ? <><FaCheck /> Copied</> : <><FaCopy /> Copy Suggestion</>}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ====== ADDITIONAL SUGGESTIONS TAB ====== */}
                        {activeTab === 'additions' && (
                            <div className="tab-content fade-in">
                                <div className="rewrites-header">
                                    <h3>New Content Opportunities</h3>
                                    <p>Adding these items could significantly improve your resume's relevance.</p>
                                </div>
                                <div className="additions-list">
                                    {analysis.additionalSuggestions?.map((item, i) => (
                                        <div key={i} className="addition-card card">
                                            <div className="addition-header">
                                                <div className="addition-title">
                                                    <FaPlusCircle className="add-icon" />
                                                    <h4>Add to: {item.section || 'General'}</h4>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleCopy(item.suggestion, `add-${i}`)}
                                                >
                                                    {copiedIndex === `add-${i}` ? <><FaCheck /> Copied</> : <><FaCopy /> Copy Text</>}
                                                </button>
                                            </div>
                                            <div className="addition-content">
                                                <div className="suggestion-box">
                                                    {item.suggestion}
                                                </div>
                                                <div className="reason-box">
                                                    <strong>Why:</strong> {item.reason}
                                                </div>
                                            </div>
                                        </div>
                                    )) || (
                                            <div className="empty-state card">
                                                <p>No additional content suggestions available.</p>
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResumeTailor;

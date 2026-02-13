import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaFileAlt, FaPaperPlane, FaCopy, FaDownload, FaCheckCircle, FaExclamationTriangle, FaBriefcase, FaBuilding, FaUserTie, FaLightbulb, FaStar, FaFire, FaBolt } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const POSITION_TYPES = [
    { value: 'Full-time', label: 'Full-time' },
    { value: 'Part-time', label: 'Part-time' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Remote', label: 'Remote' },
];

const EXPERIENCE_LEVELS = [
    { value: '', label: 'Select Experience Level' },
    { value: 'Entry Level', label: 'Entry Level' },
    { value: 'Mid Level', label: 'Mid Level' },
    { value: 'Senior Level', label: 'Senior Level' },
    { value: 'Lead / Manager', label: 'Lead / Manager' },
    { value: 'Executive', label: 'Executive' },
];

const TONES = [
    { value: 'professional', icon: FaBriefcase, label: 'Professional', description: 'Formal and corporate' },
    { value: 'enthusiastic', icon: FaFire, label: 'Enthusiastic', description: 'Passionate and excited' },
    { value: 'concise', icon: FaBolt, label: 'Concise', description: 'Brief and to-the-point' },
];

function CoverLetter({ resumeData }) {
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [position, setPosition] = useState('Full-time');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [tone, setTone] = useState('professional');
    const [coverLetter, setCoverLetter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const letterRef = useRef(null);
    const containerRef = useRef(null);

    // Scroll Reveal Logic
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
        );

        if (containerRef.current) {
            const elements = containerRef.current.querySelectorAll('.reveal');
            elements.forEach((el) => observer.observe(el));
        }

        return () => observer.disconnect();
    }, [coverLetter, resumeData]); // Re-run when content changes

    const handleGenerate = async () => {
        if (!resumeData) {
            setError('Please upload your resume first from the Upload Resume page.');
            return;
        }
        if (!jobDescription || jobDescription.trim().length < 10) {
            setError('Please provide a job description (at least 10 characters).');
            return;
        }

        setLoading(true);
        setError('');
        setCoverLetter(null);

        try {
            const response = await axios.post(`${API_URL}/cover-letter/generate`, {
                resumeData,
                jobTitle,
                companyName,
                jobDescription,
                position,
                experienceLevel,
                tone
            });

            if (response.data.success) {
                setCoverLetter(response.data.data);
            } else {
                setError(response.data.message || 'Failed to generate cover letter');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!coverLetter?.coverLetter) return;
        try {
            await navigator.clipboard.writeText(coverLetter.coverLetter);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = coverLetter.coverLetter;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!coverLetter?.coverLetter) return;

        const printWindow = window.open('', '_blank');
        const letterText = coverLetter.coverLetter.replace(/\n/g, '<br/>');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cover Letter - ${jobTitle || 'Job Application'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Georgia', 'Times New Roman', serif;
                        padding: 60px 80px;
                        color: #1a1a1a;
                        line-height: 1.8;
                        font-size: 12pt;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .letter-content {
                        white-space: pre-wrap;
                        font-family: inherit;
                    }
                    @media print {
                        body { padding: 40px 60px; }
                    }
                </style>
            </head>
            <body>
                <div class="letter-content">${letterText}</div>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="cover-letter-page" ref={containerRef}>
            <div className="page-header reveal">
                <h2>AI Cover Letter Generator</h2>
                <p>Create a tailored, professional cover letter in seconds</p>
            </div>

            {!resumeData && (
                <div className="info-banner reveal">
                    <span><FaFileAlt /></span>
                    <p>
                        <a href="/">Upload your resume</a> first to generate personalized cover letters based on your skills and experience.
                    </p>
                </div>
            )}

            {/* Input Form */}
            <div className="cl-form-section reveal" style={{ transitionDelay: '0.1s' }}>
                <div className="cl-form-grid">
                    {/* Job Title */}
                    <div className="cl-field">
                        <label className="cl-label">
                            <FaBriefcase className="cl-label-icon" /> Job Title
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Frontend Developer, Data Analyst"
                            className="cl-input"
                        />
                    </div>

                    {/* Company Name */}
                    <div className="cl-field">
                        <label className="cl-label">
                            <FaBuilding className="cl-label-icon" /> Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., Google, Microsoft, Startup XYZ"
                            className="cl-input"
                        />
                    </div>

                    {/* Position Type */}
                    <div className="cl-field">
                        <label className="cl-label">
                            <FaUserTie className="cl-label-icon" /> Position Type
                        </label>
                        <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className="cl-select"
                        >
                            {POSITION_TYPES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Experience Level */}
                    <div className="cl-field">
                        <label className="cl-label">
                            <FaStar className="cl-label-icon" /> Experience Level
                        </label>
                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="cl-select"
                        >
                            {EXPERIENCE_LEVELS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Job Description */}
                <div className="cl-field cl-full-width">
                    <label className="cl-label">
                        <FaFileAlt className="cl-label-icon" /> Job Description <span className="cl-required">*</span>
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here... Include responsibilities, requirements, and qualifications."
                        className="cl-textarea"
                        rows={8}
                    />
                </div>

                {/* Tone Selector */}
                <div className="cl-tone-section">
                    <label className="cl-label">
                        <FaLightbulb className="cl-label-icon" /> Letter Tone
                    </label>
                    <div className="cl-tone-options">
                        {TONES.map(t => (
                            <button
                                key={t.value}
                                className={`cl-tone-btn ${tone === t.value ? 'active' : ''}`}
                                onClick={() => setTone(t.value)}
                            >
                                <span className="cl-tone-label"><t.icon style={{ marginRight: '6px' }} /> {t.label}</span>
                                <span className="cl-tone-desc">{t.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message reveal" style={{ marginTop: '16px' }}>
                        <FaExclamationTriangle style={{ marginRight: '8px' }} /> {error}
                    </div>
                )}

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !resumeData}
                    className="btn btn-primary cl-generate-btn"
                >
                    {loading ? (
                        <>
                            <div className="spinner-small" style={{ marginRight: '8px' }}></div>
                            Generating Cover Letter...
                        </>
                    ) : (
                        <>
                            <FaPaperPlane style={{ marginRight: '8px' }} /> Generate Cover Letter
                        </>
                    )}
                </button>
            </div>

            {/* Cover Letter Preview */}
            {coverLetter && (
                <div className="cl-result-section reveal">
                    {/* Action Bar */}
                    <div className="cl-result-header">
                        <h3><FaCheckCircle style={{ color: 'var(--status-success)', marginRight: '8px' }} /> Your Cover Letter is Ready</h3>
                        <div className="cl-result-actions">
                            <button className="btn btn-outline btn-small" onClick={handleCopy}>
                                {copied ? (
                                    <><FaCheckCircle style={{ marginRight: '6px', color: 'var(--status-success)' }} /> Copied!</>
                                ) : (
                                    <><FaCopy style={{ marginRight: '6px' }} /> Copy</>
                                )}
                            </button>
                            <button className="btn btn-primary btn-small" onClick={handleDownload}>
                                <FaDownload style={{ marginRight: '6px' }} /> Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Letter Preview */}
                    <div className="cl-preview" ref={letterRef}>
                        <div className="cl-preview-content">
                            {coverLetter.coverLetter.split('\n').map((line, i) => (
                                <React.Fragment key={i}>
                                    {line === '' ? <br /> : <p>{line}</p>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="cl-insights">
                        {coverLetter.matchedSkills?.length > 0 && (
                            <div className="cl-insight-card">
                                <h4>Skills Highlighted</h4>
                                <div className="cl-insight-tags">
                                    {coverLetter.matchedSkills.map((skill, i) => (
                                        <span key={i} className="cl-skill-tag">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {coverLetter.highlights?.length > 0 && (
                            <div className="cl-insight-card">
                                <h4>Key Points</h4>
                                <ul className="cl-highlights-list">
                                    {coverLetter.highlights.map((h, i) => (
                                        <li key={i}>{h}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {coverLetter.tips && (
                            <div className="cl-insight-card cl-tip-card">
                                <h4><FaLightbulb style={{ marginRight: '6px' }} /> Pro Tip</h4>
                                <p>{coverLetter.tips}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CoverLetter;

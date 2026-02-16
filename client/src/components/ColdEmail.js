import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    FaEnvelope, FaPaperPlane, FaCopy, FaCheckCircle, FaExclamationTriangle,
    FaLinkedin, FaUserTie, FaBuilding, FaBriefcase, FaLightbulb,
    FaBolt, FaFire, FaRedo, FaClipboardCheck
} from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const EMAIL_TYPES = [
    { value: 'recruiter', icon: FaUserTie, label: 'Recruiter', description: 'Cold email to a recruiter' },
    { value: 'hiring_manager', icon: FaBriefcase, label: 'Hiring Manager', description: 'Direct to hiring manager' },
    { value: 'referral', icon: FaEnvelope, label: 'Ask Referral', description: 'Request a referral from someone' },
    { value: 'linkedin', icon: FaLinkedin, label: 'LinkedIn', description: 'Short connection request' },
];

const TONES = [
    { value: 'professional', icon: FaBriefcase, label: 'Professional' },
    { value: 'friendly', icon: FaFire, label: 'Friendly' },
    { value: 'bold', icon: FaBolt, label: 'Bold' },
];

function ColdEmail({ resumeData }) {
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [recipientRole, setRecipientRole] = useState('');
    const [emailType, setEmailType] = useState('recruiter');
    const [tone, setTone] = useState('professional');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState('');

    const [showInput, setShowInput] = useState(true);

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
    }, [result, resumeData, showInput]); // Re-run when layout changes

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!resumeData) {
            setError('Please upload your resume first');
            return;
        }

        setShowInput(false);
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.post(`${API_URL}/cold-email/generate`, {
                resumeData,
                jobTitle,
                companyName,
                jobDescription,
                recipientRole,
                emailType,
                tone
            });
            setResult(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate email. Please try again.');
            setShowInput(true); // Show input again on error
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text, key) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(''), 2000);
        } catch {
            setError('Failed to copy');
        }
    };

    return (
        <div className="cold-email-page page-container" ref={containerRef}>
            {/* Hero Header - Art Driven */}
            <div className="tailor-hero reveal">
                <div className="tailor-hero-content">
                    <div className="tailor-hero-icon"><FaEnvelope /></div>
                    <div>
                        <h2>AI Cold Email Generator <span className="beta-badge">PRO</span></h2>
                        <p>Generate personalized, high-conversion outreach emails in seconds.</p>
                    </div>
                </div>
            </div>

            {!resumeData && (
                <div className="cl-info-banner reveal">
                    <FaExclamationTriangle />
                    <span>Upload your resume first to generate personalized emails</span>
                </div>
            )}

            <div className="cold-email-layout">
                {/* Form Section */}
                {showInput && !loading ? (
                    <form onSubmit={handleGenerate} className="tailor-input-section card fade-in">
                        <div className="section-header-row">
                            <FaPaperPlane className="section-icon" />
                            <h3>Email Details</h3>
                        </div>

                        {/* Email Type Selector */}
                        <div className="ce-section">
                            <label className="ce-label">Email Type</label>
                            <div className="ce-type-grid">
                                {EMAIL_TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        className={`ce-type-btn ${emailType === t.value ? 'active' : ''}`}
                                        onClick={() => setEmailType(t.value)}
                                    >
                                        <t.icon className="ce-type-icon" />
                                        <span className="ce-type-label">{t.label}</span>
                                        <span className="ce-type-desc">{t.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Job Details */}
                        <div className="ce-form-grid">
                            <div className="ce-field">
                                <label className="ce-label"><FaBriefcase style={{ marginRight: '6px' }} /> Job Title</label>
                                <input
                                    type="text"
                                    value={jobTitle}
                                    onChange={(e) => setJobTitle(e.target.value)}
                                    placeholder="e.g. Senior Frontend Developer"
                                    className="ce-input"
                                />
                            </div>
                            <div className="ce-field">
                                <label className="ce-label"><FaBuilding style={{ marginRight: '6px' }} /> Company</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="e.g. Google"
                                    className="ce-input"
                                />
                            </div>
                            <div className="ce-field">
                                <label className="ce-label"><FaUserTie style={{ marginRight: '6px' }} /> Recipient Name/Role</label>
                                <input
                                    type="text"
                                    value={recipientRole}
                                    onChange={(e) => setRecipientRole(e.target.value)}
                                    placeholder="e.g. Sarah Johnson, Tech Recruiter"
                                    className="ce-input"
                                />
                            </div>
                        </div>

                        {/* Job Description */}
                        {emailType !== 'linkedin' && (
                            <div className="ce-field">
                                <label className="ce-label"><FaClipboardCheck style={{ marginRight: '6px' }} /> Job Description (optional)</label>
                                <textarea
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    placeholder="Paste the job description here for a more tailored email..."
                                    className="ce-input" // Using ce-input style for consistency or tailor-textarea
                                    rows={4}
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                />
                            </div>
                        )}

                        {/* Tone */}
                        <div className="ce-section">
                            <label className="ce-label">Tone</label>
                            <div className="ce-tone-row">
                                {TONES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        className={`ce-tone-btn ${tone === t.value ? 'active' : ''}`}
                                        onClick={() => setTone(t.value)}
                                    >
                                        <t.icon style={{ marginRight: '6px' }} /> {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="input-actions end">
                            <button
                                type="submit"
                                className="btn btn-analyze"
                                disabled={loading || !resumeData}
                            >
                                <FaPaperPlane style={{ marginRight: '8px' }} /> Generate Email
                            </button>
                        </div>
                    </form>
                ) : !loading && (
                    <div className="input-collapsed-bar fade-in">
                        <div className="collapsed-info">
                            <FaCheckCircle className="success-icon" />
                            <span>Email generated for <strong>{companyName || 'Target Company'}</strong></span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => setShowInput(true)}>
                            <FaRedo style={{ marginRight: '6px' }} /> Start Over / Edit
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="loading-container fade-in">
                        <div className="loading-spinner-large"></div>
                        <h3>Drafting Your Perfect Outreach...</h3>
                        <p>Analyzing resume, adapting tone, and crafting persuasive copy.</p>
                    </div>
                )}

                {/* Results */}
                {result && !loading && (
                    <div className="ce-results reveal" style={{ transitionDelay: '0.1s' }}>
                        {/* Main Email */}
                        <div className="ce-email-card card"> {/* Added card class */}
                            <div className="ce-email-header">
                                <h3>
                                    {emailType === 'linkedin' ? (
                                        <><FaLinkedin style={{ marginRight: '8px', color: '#0077b5' }} /> LinkedIn Message</>
                                    ) : (
                                        <><FaEnvelope style={{ marginRight: '8px', color: 'var(--electric)' }} /> Your Email</>
                                    )}
                                </h3>
                                <button
                                    className={`copy-btn ${copied === 'email' ? 'active' : ''}`} // Updated class
                                    onClick={() => copyToClipboard(
                                        result.subject ? `Subject: ${result.subject}\n\n${result.message}` : result.message,
                                        'email'
                                    )}
                                >
                                    {copied === 'email' ? <><FaCheckCircle /> Copied</> : <><FaCopy /> Copy Text</>}
                                </button>
                            </div>
                            {result.subject && (
                                <div className="ce-subject">
                                    <strong>Subject:</strong> {result.subject}
                                </div>
                            )}
                            <div className="ce-email-body">
                                {result.message}
                            </div>
                        </div>

                        {/* Follow-up */}
                        {result.followUp && emailType !== 'linkedin' && (
                            <div className="ce-email-card card ce-followup">
                                <div className="ce-email-header">
                                    <h3><FaRedo style={{ marginRight: '8px', color: 'var(--warm)' }} /> Follow-up (5-7 days later)</h3>
                                    <button
                                        className={`copy-btn ${copied === 'followup' ? 'active' : ''}`}
                                        onClick={() => copyToClipboard(result.followUp, 'followup')}
                                    >
                                        {copied === 'followup' ? <><FaCheckCircle /> Copied</> : <><FaCopy /> Copy Text</>}
                                    </button>
                                </div>
                                <div className="ce-email-body">
                                    {result.followUp}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        {result.tips?.length > 0 && (
                            <div className="ce-tips-card card">
                                <h3><FaLightbulb style={{ marginRight: '8px', color: '#f59e0b' }} /> Pro Tips</h3>
                                <ul className="ce-tips-list">
                                    {result.tips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <div className="error-message reveal">
                    <FaExclamationTriangle /> {error}
                </div>
            )}
        </div>
    );
}

export default ColdEmail;

import React, { useState } from 'react';
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

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!resumeData) {
            setError('Please upload your resume first');
            return;
        }

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
        <div className="cold-email-page">
            <div className="page-header">
                <h2><FaEnvelope style={{ marginRight: '12px', color: 'var(--electric)' }} />AI Cold Email Generator</h2>
                <p>Generate personalized outreach emails that get responses</p>
            </div>

            {!resumeData && (
                <div className="cl-info-banner">
                    <FaExclamationTriangle />
                    <span>Upload your resume first to generate personalized emails</span>
                </div>
            )}

            <div className="cold-email-layout">
                {/* Form */}
                <form onSubmit={handleGenerate} className="ce-form">
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
                                className="ce-textarea"
                                rows={4}
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

                    <button
                        type="submit"
                        className="btn btn-primary btn-large ce-generate-btn"
                        disabled={loading || !resumeData}
                    >
                        {loading ? (
                            <><span className="spinner-sm"></span> Generating...</>
                        ) : (
                            <><FaPaperPlane style={{ marginRight: '8px' }} /> Generate Email</>
                        )}
                    </button>
                </form>

                {/* Results */}
                {result && (
                    <div className="ce-results">
                        {/* Main Email */}
                        <div className="ce-email-card">
                            <div className="ce-email-header">
                                <h3>
                                    {emailType === 'linkedin' ? (
                                        <><FaLinkedin style={{ marginRight: '8px', color: '#0077b5' }} /> LinkedIn Message</>
                                    ) : (
                                        <><FaEnvelope style={{ marginRight: '8px', color: 'var(--electric)' }} /> Your Email</>
                                    )}
                                </h3>
                                <button
                                    className={`ce-copy-btn ${copied === 'email' ? 'copied' : ''}`}
                                    onClick={() => copyToClipboard(
                                        result.subject ? `Subject: ${result.subject}\n\n${result.message}` : result.message,
                                        'email'
                                    )}
                                >
                                    {copied === 'email' ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy</>}
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
                            <div className="ce-email-card ce-followup">
                                <div className="ce-email-header">
                                    <h3><FaRedo style={{ marginRight: '8px', color: 'var(--warm)' }} /> Follow-up (5-7 days later)</h3>
                                    <button
                                        className={`ce-copy-btn ${copied === 'followup' ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(result.followUp, 'followup')}
                                    >
                                        {copied === 'followup' ? <><FaCheckCircle /> Copied!</> : <><FaCopy /> Copy</>}
                                    </button>
                                </div>
                                <div className="ce-email-body">
                                    {result.followUp}
                                </div>
                            </div>
                        )}

                        {/* Tips */}
                        {result.tips?.length > 0 && (
                            <div className="ce-tips-card">
                                <h3><FaLightbulb style={{ marginRight: '8px', color: 'var(--warm)' }} /> Pro Tips</h3>
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
                <div className="error-message">
                    <FaExclamationTriangle /> {error}
                </div>
            )}
        </div>
    );
}

export default ColdEmail;

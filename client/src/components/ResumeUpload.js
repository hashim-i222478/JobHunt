import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function ResumeUpload({ onUploadSuccess, resumeData, onJobsFound }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('');
    const navigate = useNavigate();

    const searchJobsWithSkills = async (skills) => {
        setStatus('🔍 Finding matching jobs...');
        try {
            const response = await axios.get(`${API_URL}/jobs/search`, {
                params: { skills: skills.join(',') }
            });
            if (onJobsFound) {
                onJobsFound(response.data.data);
            }
            navigate('/jobs');
        } catch (err) {
            console.error('Job search failed:', err);
            navigate('/jobs');
        }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setStatus('🤖 AI is analyzing your resume...');

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await axios.post(`${API_URL}/resume/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const data = response.data.data;
            onUploadSuccess(data);
            setStatus('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload resume');
            setStatus('');
        } finally {
            setUploading(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        noClick: true
    });

    const aiAnalysis = resumeData?.aiAnalysis;

    return (
        <div className="resume-upload-page">
            <div className="page-header">
                <h2>{resumeData ? 'Resume Analysis' : 'Upload Your Resume'}</h2>
                <p>
                    {resumeData
                        ? 'Here is what our AI found in your resume'
                        : 'Our AI will analyze your resume and automatically find matching jobs'
                    }
                </p>
            </div>

            {!resumeData || uploading ? (
                <div
                    {...getRootProps()}
                    onClick={open}
                    className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="dropzone-content">
                        {uploading ? (
                            <>
                                <div className="spinner"></div>
                                <p>{status || 'Processing...'}</p>
                            </>
                        ) : (
                            <>
                                <div className="upload-icon">📄</div>
                                <h3>{isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}</h3>
                                <p>or click to browse</p>
                                <span className="file-hint">PDF files only, max 10MB</span>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {/* Compact upload button */}
                    <div className="compact-upload">
                        <input {...getInputProps()} />
                        <div className="current-file">
                            <span className="file-icon">📄</span>
                            <span className="file-name">{resumeData.fileName}</span>
                        </div>
                        <button type="button" onClick={open} className="btn btn-outline">
                            Upload Different Resume
                        </button>
                    </div>

                    {/* AI Summary Card */}
                    {aiAnalysis?.summary && (
                        <div className="ai-summary-card">
                            <div className="summary-header">
                                <span className="ai-badge">🤖 AI Summary</span>
                                {aiAnalysis?.seniorityLevel && (
                                    <span className="seniority-tag">{aiAnalysis.seniorityLevel.toUpperCase()}</span>
                                )}
                            </div>
                            <p className="summary-text">{aiAnalysis.summary}</p>
                        </div>
                    )}

                    {/* Suggested Roles */}
                    {aiAnalysis?.suggestedRoles?.length > 0 && (
                        <div className="analysis-section">
                            <h3>🎯 Recommended Roles</h3>
                            <div className="roles-grid">
                                {aiAnalysis.suggestedRoles.map((role, index) => (
                                    <div key={index} className="role-card">
                                        <span className="role-icon">💼</span>
                                        <span className="role-title">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categorized Skills */}
                    {aiAnalysis?.categorizedSkills && (
                        <div className="analysis-section">
                            <h3>🛠️ Skills by Category</h3>
                            <div className="skills-categories">
                                {Object.entries(aiAnalysis.categorizedSkills).map(([category, skills]) => (
                                    skills?.length > 0 && (
                                        <div key={category} className="skill-category">
                                            <h4>{category}</h4>
                                            <div className="skill-tags">
                                                {skills.map((skill, index) => (
                                                    <span key={index} className="skill-tag">{skill}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Experience Timeline */}
                    {aiAnalysis?.timeline?.length > 0 && (
                        <div className="analysis-section">
                            <h3>📅 Experience Timeline</h3>
                            <div className="timeline">
                                {aiAnalysis.timeline.map((item, index) => (
                                    <div key={index} className={`timeline-item ${item.type}`}>
                                        <div className="timeline-marker">
                                            {item.type === 'work' ? '💼' : '🎓'}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <h4>{item.title}</h4>
                                                <span className="timeline-duration">{item.duration}</span>
                                            </div>
                                            <p className="timeline-org">{item.organization}</p>
                                            {item.highlights?.length > 0 && (
                                                <ul className="timeline-highlights">
                                                    {item.highlights.map((highlight, i) => (
                                                        <li key={i}>{highlight}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact & Links */}
                    {(resumeData.email || resumeData.phone || resumeData.links) && (
                        <div className="analysis-section contact-section">
                            <h3>🔗 Contact & Links</h3>
                            <div className="contact-links-grid">
                                {resumeData.email && (
                                    <a href={`mailto:${resumeData.email}`} className="contact-link-card">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">Email</span>
                                            <span className="link-value">{resumeData.email}</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.phone && (
                                    <a href={`tel:${resumeData.phone}`} className="contact-link-card">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">Phone</span>
                                            <span className="link-value">{resumeData.phone}</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.linkedin && (
                                    <a href={resumeData.links.linkedin} target="_blank" rel="noopener noreferrer" className="contact-link-card linkedin">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">LinkedIn</span>
                                            <span className="link-value">View Profile →</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.github && (
                                    <a href={resumeData.links.github} target="_blank" rel="noopener noreferrer" className="contact-link-card github">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">GitHub</span>
                                            <span className="link-value">View Profile →</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.portfolio && (
                                    <a href={resumeData.links.portfolio} target="_blank" rel="noopener noreferrer" className="contact-link-card portfolio">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">Portfolio</span>
                                            <span className="link-value">View Site →</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.twitter && (
                                    <a href={resumeData.links.twitter} target="_blank" rel="noopener noreferrer" className="contact-link-card twitter">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">X / Twitter</span>
                                            <span className="link-value">View Profile →</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.behance && (
                                    <a href={resumeData.links.behance} target="_blank" rel="noopener noreferrer" className="contact-link-card behance">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.199.877 1.991 2.341 1.991.793 0 1.395-.332 1.727-.873h2.688zM19.027 12.29c-.12-1.077-.864-1.848-2.027-1.848-1.209 0-1.893.693-2.057 1.848h4.084zm-14.502 6.91c0-2.098 1.225-3.177 3.155-3.755l2.112-.567c.952-.255 1.27-.522 1.27-1.073 0-.593-.446-1.024-1.481-1.024-1.116 0-1.554.551-1.637 1.271H4.72c.104-1.859 1.407-3.134 4.722-3.134 3.333 0 4.618 1.32 4.618 3.134v5.468h-2.823l-.195-1.02h-.073c-.541.72-1.445 1.221-2.757 1.221-1.915 0-3.187-1.063-3.187-2.521zm5.467-.855c.868 0 1.599-.549 1.599-1.569v-.383l-1.708.446c-.71.186-1.081.501-1.081 1.032 0 .299.254.474.752.474h.438z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">Behance</span>
                                            <span className="link-value">View Portfolio →</span>
                                        </div>
                                    </a>
                                )}
                                {resumeData.links?.dribbble && (
                                    <a href={resumeData.links.dribbble} target="_blank" rel="noopener noreferrer" className="contact-link-card dribbble">
                                        <svg className="link-icon" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm7.875 5.55c1.325 1.65 2.15 3.7 2.25 5.925-.325-.075-3.6-.725-6.9-.325-.075-.175-.15-.325-.225-.5-.2-.45-.425-.9-.65-1.325 3.65-1.5 5.3-3.625 5.525-3.775zM12 1.875c2.575 0 4.925.975 6.725 2.55-.175.15-1.675 2.1-5.175 3.425-1.625-2.975-3.425-5.4-3.7-5.775 0 0 .725-.2 2.15-.2zm-4.225.675c.25.35 2.025 2.8 3.675 5.7-4.625 1.225-8.7 1.2-9.15 1.2.625-3.025 2.675-5.55 5.475-6.9zM1.875 12v-.3c.425.025 5.2.075 10.15-1.4.275.55.55 1.125.8 1.675-.125.05-.275.075-.4.125-5.175 1.675-7.925 6.25-8.15 6.575C2.725 16.825 1.875 14.525 1.875 12zM12 22.125c-2.35 0-4.525-.825-6.225-2.2.175-.3 2.2-4.275 7.875-6.25h.075c1.4 3.65 1.975 6.7 2.125 7.575-1.2.55-2.475.875-3.85.875zm5.675-1.775c-.1-.6-.625-3.5-1.95-7.1 3.1-.5 5.825.325 6.15.425-.425 2.75-1.875 5.125-4.2 6.675z" />
                                        </svg>
                                        <div className="link-details">
                                            <span className="link-label">Dribbble</span>
                                            <span className="link-value">View Shots →</span>
                                        </div>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="preview-actions">
                        <button
                            onClick={() => navigate('/jobs')}
                            className="btn btn-primary btn-large"
                        >
                            🔍 Find Matching Jobs
                        </button>
                    </div>
                </>
            )}

            {error && (
                <div className="error-message">
                    <span>⚠️</span> {error}
                </div>
            )}
        </div>
    );
}

export default ResumeUpload;

import React from 'react';
import { FaMapMarkerAlt, FaBriefcase, FaHome, FaMoneyBillWave, FaCheck, FaStar } from 'react-icons/fa';

function JobCard({ job, onSave, isSaved, className = '', style = {} }) {
    const truncateDescription = (text, maxLength = 200) => {
        if (!text) return '';
        return text.length > maxLength
            ? text.substring(0, maxLength) + '...'
            : text;
    };

    const getMatchColor = (score) => {
        if (score >= 70) return '#10b981'; // green
        if (score >= 40) return '#f59e0b'; // yellow
        return '#6b7280'; // gray
    };

    return (
        <div className={`job-card ${className}`} style={style}>
            {job.matchScore > 0 && (
                <div
                    className="match-badge"
                    style={{ backgroundColor: getMatchColor(job.matchScore) }}
                >
                    {job.matchScore}% Match
                </div>
            )}

            <div className="job-card-header">
                {job.companyLogo ? (
                    <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="company-logo"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                ) : (
                    <div className="company-logo-placeholder">
                        {job.company?.charAt(0) || '?'}
                    </div>
                )}
                <div className="job-title-section">
                    <h3 className="job-title">{job.title}</h3>
                    <p className="company-name">{job.company}</p>
                </div>
            </div>

            <div className="job-meta">
                <span className="meta-item">
                    <FaMapMarkerAlt style={{ marginRight: '6px' }} /> {job.location || 'Location not specified'}
                </span>
                {job.jobType && (
                    <span className="meta-item job-type">
                        <FaBriefcase style={{ marginRight: '6px' }} /> {job.jobType}
                    </span>
                )}
                {job.remote && (
                    <span className="meta-item remote-tag">
                        <FaHome style={{ marginRight: '6px' }} /> Remote
                    </span>
                )}
            </div>

            {job.salary && job.salary !== 'Not specified' && (
                <div className="job-salary">
                    <FaMoneyBillWave style={{ marginRight: '6px' }} /> {job.salary}
                </div>
            )}

            <p className="job-description">
                {truncateDescription(job.description)}
            </p>

            <div className="job-card-actions">
                <button
                    onClick={onSave}
                    disabled={isSaved}
                    className={`btn btn-save ${isSaved ? 'saved' : ''}`}
                >
                    {isSaved ? <><FaCheck style={{ marginRight: '4px' }} /> Saved</> : <><FaStar style={{ marginRight: '4px' }} /> Save</>}
                </button>
                {job.applyLink && (
                    <a
                        href={job.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-apply"
                    >
                        Apply Now →
                    </a>
                )}
            </div>
        </div>
    );
}

export default JobCard;

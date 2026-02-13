import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaStar, FaPencilAlt, FaMicrophone, FaTrophy, FaTimes, FaBan, FaExclamationTriangle, FaClipboardList, FaMapMarkerAlt } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

const STATUS_CONFIG = {
    saved: { label: 'Saved', color: '#6366f1', icon: <FaStar /> },
    applied: { label: 'Applied', color: '#3b82f6', icon: <FaPencilAlt /> },
    interviewing: { label: 'Interviewing', color: '#f59e0b', icon: <FaMicrophone /> },
    offered: { label: 'Offered', color: '#10b981', icon: <FaTrophy /> },
    rejected: { label: 'Rejected', color: '#ef4444', icon: <FaTimes /> },
    withdrawn: { label: 'Withdrawn', color: '#6b7280', icon: <FaBan /> }
};

function ApplicationTracker() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
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
    }, [applications, filter, loading]); // Re-run when content changes

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await axios.get(`${API_URL}/jobs/saved`);
            setApplications(response.data.data);
        } catch (err) {
            setError('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`${API_URL}/jobs/${id}/status`, { status: newStatus });
            setApplications(apps =>
                apps.map(app =>
                    app._id === id ? { ...app, status: newStatus } : app
                )
            );
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const deleteApplication = async (id) => {
        try {
            await axios.delete(`${API_URL}/jobs/${id}`);
            setApplications(apps => apps.filter(app => app._id !== id));
        } catch (err) {
            console.error('Failed to delete application:', err);
        }
    };

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

    const getStatusCounts = () => {
        const counts = { all: applications.length };
        Object.keys(STATUS_CONFIG).forEach(status => {
            counts[status] = applications.filter(app => app.status === status).length;
        });
        return counts;
    };

    const counts = getStatusCounts();

    if (loading) {
        return (
            <div className="tracker-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading your applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tracker-page" ref={containerRef}>
            <div className="page-header reveal">
                <h2>Application Tracker</h2>
                <p>Track and manage your job applications in one place</p>
            </div>

            <div className="tracker-stats reveal" style={{ transitionDelay: '0.1s' }}>
                <button
                    className={`stat-card ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    <span className="stat-number">{counts.all}</span>
                    <span className="stat-label">Total</span>
                </button>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <button
                        key={status}
                        className={`stat-card ${filter === status ? 'active' : ''}`}
                        onClick={() => setFilter(status)}
                        style={{ '--stat-color': config.color }}
                    >
                        <span className="stat-icon">{config.icon}</span>
                        <span className="stat-number">{counts[status]}</span>
                        <span className="stat-label">{config.label}</span>
                    </button>
                ))}
            </div>

            {error && (
                <div className="error-message reveal">
                    <span><FaExclamationTriangle /></span> {error}
                </div>
            )}

            {filteredApps.length === 0 ? (
                <div className="empty-state reveal">
                    <span className="empty-icon"><FaClipboardList /></span>
                    <h3>No applications {filter !== 'all' ? `with "${STATUS_CONFIG[filter]?.label}" status` : 'yet'}</h3>
                    <p>
                        {filter === 'all'
                            ? 'Save jobs from the job search to start tracking them here'
                            : 'No applications match this filter'}
                    </p>
                    {filter === 'all' && (
                        <a href="/jobs" className="btn btn-primary">Find Jobs</a>
                    )}
                </div>
            ) : (
                <div className="applications-list">
                    {filteredApps.map((app, index) => (
                        <div key={app._id} className="application-card reveal" style={{ transitionDelay: `${index * 0.05}s` }}>
                            <div className="app-main">
                                <div className="app-header">
                                    {app.companyLogo ? (
                                        <img
                                            src={app.companyLogo}
                                            alt={app.company}
                                            className="app-logo"
                                            onError={(e) => { e.target.style.display = 'none' }}
                                        />
                                    ) : (
                                        <div className="app-logo-placeholder">
                                            {app.company?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="app-info">
                                        <h3 className="app-title">{app.title}</h3>
                                        <p className="app-company">{app.company}</p>
                                        <p className="app-location"><FaMapMarkerAlt style={{ marginRight: '6px' }} /> {app.location}</p>
                                    </div>
                                </div>

                                <div className="app-status-section">
                                    <select
                                        value={app.status}
                                        onChange={(e) => updateStatus(app._id, e.target.value)}
                                        className="status-select"
                                        style={{ borderColor: STATUS_CONFIG[app.status]?.color }}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                                            <option key={value} value={value}>
                                                {config.icon} {config.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="app-actions">
                                {app.applyLink && (
                                    <a
                                        href={app.applyLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-sm"
                                    >
                                        View Job →
                                    </a>
                                )}
                                <button
                                    onClick={() => deleteApplication(app._id)}
                                    className="btn btn-sm btn-danger"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ApplicationTracker;

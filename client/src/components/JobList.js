import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import JobCard from './JobCard';
import { FaRobot, FaSearch, FaCog, FaFileAlt, FaExclamationTriangle, FaDownload, FaSyncAlt, FaBolt, FaRocket, FaClipboardList } from 'react-icons/fa';

const API_URL = 'http://localhost:5000/api';

// Experience level options (JSearch API values)
const EXPERIENCE_LEVELS = [
    { value: '', label: 'Any Experience' },
    { value: 'no_experience', label: 'No Experience / Entry Level' },
    { value: 'under_3_years_experience', label: 'Under 3 Years' },
    { value: 'more_than_3_years_experience', label: '3+ Years' }
];

// Job type options
const JOB_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'FULLTIME', label: 'Full-time' },
    { value: 'PARTTIME', label: 'Part-time' },
    { value: 'CONTRACTOR', label: 'Contract' },
    { value: 'INTERN', label: 'Internship' }
];

// Date posted options
const DATE_POSTED = [
    { value: 'all', label: 'Any Time' },
    { value: 'today', label: 'Today' },
    { value: '3days', label: 'Last 3 Days' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
];

function JobList({ resumeData, jobs, setJobs, loading, setLoading }) {
    const [error, setError] = useState(null);
    const [location, setLocation] = useState('');
    const [remoteOnly, setRemoteOnly] = useState(false);
    const [savedJobs, setSavedJobs] = useState(new Set());
    const [aiInsights, setAiInsights] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [jobSources] = useState(['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter', 'SimplyHired']);

    // Manual search filters (API-level)
    const [manualQuery, setManualQuery] = useState('');
    const [experience, setExperience] = useState('');
    const [jobType, setJobType] = useState('');
    const [datePosted, setDatePosted] = useState('month');
    const [searchMode, setSearchMode] = useState('ai'); // 'ai' or 'manual'

    // Result filters for AI mode (client-side filtering)
    const [filterJobType, setFilterJobType] = useState('');
    const [filterRemote, setFilterRemote] = useState(false);

    const containerRef = useRef(null);

    // Scroll Reveal Logic (MOVED HERE)
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
    }, [jobs, aiInsights, searchMode, loading]); // Re-run when content changes

    // Get device location on mount if no location set
    useEffect(() => {
        const getDeviceLocation = async () => {
            // Only set location if it's empty (don't override user's manual changes)
            if (location) return;

            // First check if resume has location
            if (resumeData?.location) {
                setLocation(resumeData.location);
                return;
            }

            // Try to get device location
            if (navigator.geolocation) {
                setGettingLocation(true);
                try {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 10000,
                            enableHighAccuracy: false
                        });
                    });

                    // Reverse geocode to get city name
                    const { latitude, longitude } = position.coords;
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                        );
                        const data = await response.json();
                        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state;
                        const country = data.address?.country;
                        if (city) {
                            setLocation(`${city}, ${country}`);
                        }
                    } catch (geoError) {
                        console.log('Could not reverse geocode:', geoError);
                    }
                } catch (err) {
                    console.log('Geolocation not available:', err.message);
                } finally {
                    setGettingLocation(false);
                }
            }
        };

        getDeviceLocation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeData]);

    // Populate suggested role from resume
    useEffect(() => {
        if (resumeData?.aiAnalysis?.suggestedRoles?.length > 0 && !manualQuery) {
            setManualQuery(resumeData.aiAnalysis.suggestedRoles[0]);
        }
    }, [resumeData, manualQuery]);

    // Auto-search when component loads with resume data AND location is set
    useEffect(() => {
        if (resumeData?.skills?.length > 0 && !hasSearched && jobs.length === 0 && location) {
            searchJobs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resumeData, location]);

    const searchJobs = async (isLoadMore = false) => {
        // For manual mode, require a search query
        if (searchMode === 'manual' && !manualQuery.trim()) {
            setError('Please enter a job title or keyword to search');
            return;
        }

        // For AI mode, require resume
        if (searchMode === 'ai' && (!resumeData?.skills || resumeData.skills.length === 0)) {
            setError('Please upload a resume first or switch to manual search');
            return;
        }

        if (!location.trim()) {
            setError('Please enter a location to find jobs near you');
            return;
        }

        if (isLoadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setPage(1);
            setHasMore(true);
        }
        setError(null);
        setHasSearched(true);

        const currentPage = isLoadMore ? page : 1;

        try {
            const params = {
                location: location.trim(),
                remote: remoteOnly,
                page: currentPage,
                datePosted: datePosted
            };

            // Add mode-specific params
            if (searchMode === 'manual') {
                params.query = manualQuery.trim();
                if (experience) params.experience = experience;
                if (jobType) params.jobType = jobType;
            } else {
                params.skills = resumeData.skills.join(',');
                params.rawText = resumeData.aiAnalysis?.summary || '';
                // Pass seniority level from resume analysis to avoid re-analyzing
                if (resumeData.aiAnalysis?.seniorityLevel) {
                    params.seniority = resumeData.aiAnalysis.seniorityLevel;
                }
            }

            const response = await axios.get(`${API_URL}/jobs/search`, { params });

            let newJobs = response.data.data || [];
            console.log('🔍 Jobs from API before filtering:', newJobs.length);

            // Filter jobs to only show ones matching the entered location (for AI mode)
            // For manual mode, location is already passed to API, so be less strict
            if (searchMode === 'ai') {
                const locationLower = location.toLowerCase().trim();
                const locationParts = locationLower.split(',').map(p => p.trim());

                newJobs = newJobs.filter(job => {
                    const jobLocation = (job.location || '').toLowerCase();
                    return locationParts.some(part =>
                        jobLocation.includes(part) ||
                        part.includes(jobLocation.split(',')[0]?.trim())
                    ) || job.remote;
                });
                console.log('🔍 Jobs after location filter:', newJobs.length);
            }

            if (isLoadMore) {
                setJobs(prev => {
                    const existingIds = new Set(prev.map(j => j.externalId));
                    const uniqueNewJobs = newJobs.filter(j => !existingIds.has(j.externalId));
                    return [...prev, ...uniqueNewJobs];
                });
                setPage(prev => prev + 1);
            } else {
                const seen = new Set();
                const uniqueJobs = newJobs.filter(job => {
                    if (seen.has(job.externalId)) return false;
                    seen.add(job.externalId);
                    return true;
                });
                setJobs(uniqueJobs);
                setPage(2);
            }

            if (newJobs.length < 5) {
                setHasMore(false);
            }

            if (response.data.aiAnalysis && !isLoadMore && searchMode === 'ai') {
                setAiInsights(response.data.aiAnalysis);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to search jobs');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const saveJob = async (job) => {
        try {
            await axios.post(`${API_URL}/jobs/save`, {
                ...job,
                resumeId: resumeData?.id
            });

            setSavedJobs(prev => new Set([...prev, job.externalId]));
        } catch (err) {
            if (err.response?.data?.error === 'Job already saved') {
                setSavedJobs(prev => new Set([...prev, job.externalId]));
            }
        }
    };

    // Filter jobs client-side for AI mode
    const getFilteredJobs = () => {
        if (searchMode !== 'ai') return jobs;

        return jobs.filter(job => {
            // Filter by job type (case-insensitive, handle variations)
            if (filterJobType) {
                const jobTypeNorm = (job.jobType || '').toUpperCase().replace(/[-_\s]/g, '');
                const filterNorm = filterJobType.toUpperCase().replace(/[-_\s]/g, '');
                if (!jobTypeNorm.includes(filterNorm) && !filterNorm.includes(jobTypeNorm)) {
                    return false;
                }
            }
            // Filter by remote
            if (filterRemote && !job.remote) return false;
            return true;
        });
    };

    const filteredJobs = getFilteredJobs();

    const handleNewSearch = () => {
        setHasSearched(false);
        setJobs([]);
        setAiInsights(null);
    };

    const handleModeSwitch = (mode) => {
        if (mode !== searchMode) {
            // Clear jobs and insights when switching modes
            setJobs([]);
            setAiInsights(null);
            setHasSearched(false);
            setPage(1);
            setHasMore(true);
            setError(null);
            // Reset filters
            setFilterJobType('');
            setFilterRemote(false);
        }
        setSearchMode(mode);
    };

    return (
        <div className="job-list-page" ref={containerRef}>
            <div className="page-header reveal">
                <h2>AI-Powered Job Matches</h2>
                <p>
                    {resumeData
                        ? `Finding jobs based on ${resumeData.skills?.length || 0} skills from your resume`
                        : 'Search for jobs or upload a resume for AI-powered matches'}
                </p>
            </div>

            {/* Search Mode Toggle */}
            <div className="search-mode-toggle reveal" style={{ transitionDelay: '0.1s' }}>
                <button
                    className={`mode-btn ${searchMode === 'ai' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('ai')}
                >
                    <FaRobot style={{ marginRight: '6px' }} /> AI-Powered Search
                </button>
                <button
                    className={`mode-btn ${searchMode === 'manual' ? 'active' : ''}`}
                    onClick={() => handleModeSwitch('manual')}
                >
                    <FaSearch style={{ marginRight: '6px' }} /> Manual Search
                </button>
            </div>

            {/* Search Controls */}
            <div className="search-controls reveal" style={{ transitionDelay: '0.2s' }}>
                {/* Main Search Fields */}
                <div className="search-fields">
                    {searchMode === 'manual' && (
                        <div className="search-input-wrapper">
                            <input
                                type="text"
                                placeholder="Job title, role, or keywords (e.g., React Developer)"
                                value={manualQuery}
                                onChange={(e) => setManualQuery(e.target.value)}
                                className="search-input query-input"
                            />
                        </div>
                    )}

                    <div className="location-input-wrapper">
                        <svg className="location-icon" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <input
                            type="text"
                            placeholder={gettingLocation ? "Getting your location..." : "Enter location"}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="search-input location-input"
                            disabled={gettingLocation}
                        />
                        {gettingLocation && <span className="spinner-small"></span>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="search-actions">
                    {searchMode === 'manual' && (
                        <button
                            type="button"
                            className="btn btn-outline btn-filters"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <FaCog style={{ marginRight: '6px' }} /> Filters {showAdvanced ? '▲' : '▼'}
                        </button>
                    )}
                    <button
                        onClick={() => searchJobs(false)}
                        disabled={loading || gettingLocation}
                        className="btn btn-primary"
                    >
                        {loading ? 'Searching...' : <><FaSearch style={{ marginRight: '6px' }} /> Find Jobs</>}
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel - Only for Manual Mode */}
            {showAdvanced && searchMode === 'manual' && (
                <div className="advanced-filters reveal">
                    <div className="filter-group">
                        <label>Experience Level</label>
                        <select value={experience} onChange={(e) => setExperience(e.target.value)}>
                            {EXPERIENCE_LEVELS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Job Type</label>
                        <select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                            {JOB_TYPES.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Date Posted</label>
                        <select value={datePosted} onChange={(e) => setDatePosted(e.target.value)}>
                            {DATE_POSTED.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={remoteOnly}
                                onChange={(e) => setRemoteOnly(e.target.checked)}
                            />
                            Remote Only
                        </label>
                    </div>
                </div>
            )}

            {/* AI Insights Panel */}
            {aiInsights && searchMode === 'ai' && (
                <div className="ai-insights reveal">
                    <h3><FaRobot style={{ marginRight: '8px' }} /> AI Search Analysis</h3>
                    <div className="insights-grid">
                        {aiInsights.jobTitles?.length > 0 && (
                            <div className="insight-card">
                                <h4>Searching For</h4>
                                <div className="insight-tags">
                                    {aiInsights.jobTitles.map((title, i) => (
                                        <span key={i} className="insight-tag role">{title}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {aiInsights.topSkills?.length > 0 && (
                            <div className="insight-card">
                                <h4>Matching Skills</h4>
                                <div className="insight-tags">
                                    {aiInsights.topSkills.map((skill, i) => (
                                        <span key={i} className="insight-tag skill">{skill}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {aiInsights.seniority && (
                            <div className="insight-card seniority">
                                <h4>Experience Level</h4>
                                <span className="seniority-badge">{aiInsights.seniority.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!resumeData && searchMode === 'ai' && (
                <div className="info-banner reveal">
                    <span><FaFileAlt /></span>
                    <p>
                        <a href="/">Upload your resume</a> for AI-powered matching, or switch to <strong>Manual Search</strong> to search by job title.
                    </p>
                </div>
            )}

            {error && (
                <div className="error-message reveal">
                    <span><FaExclamationTriangle /></span> {error}
                </div>
            )}

            {loading && (
                <div className="loading-state reveal">
                    <div className="spinner"></div>
                    <h3>Finding Jobs in {location || 'your area'}</h3>
                    <p><FaRobot style={{ marginRight: '6px' }} /> {searchMode === 'ai' ? 'AI is analyzing jobs' : `Searching for "${manualQuery}"`}...</p>
                    <div className="loading-sources">
                        {jobSources.map((source, i) => (
                            <span key={i} className="loading-source" style={{ animationDelay: `${i * 0.2}s` }}>
                                Checking {source}...
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {!loading && jobs.length > 0 && (
                <>
                    <div className="results-header reveal">
                        <div className="results-info">
                            <span className="results-count">Found <strong>{filteredJobs.length}</strong> jobs</span>
                            {location && <span className="results-location">in <strong>{location}</strong></span>}
                            {filteredJobs.length !== jobs.length && (
                                <span className="filter-indicator">(filtered from {jobs.length})</span>
                            )}
                        </div>
                        <div className="results-actions">
                            <button className="btn btn-outline btn-small" onClick={handleNewSearch}>
                                <FaSyncAlt style={{ marginRight: '6px' }} /> New Search
                            </button>
                            <span className="sort-info"><FaBolt style={{ marginRight: '4px' }} /> Sorted by match</span>
                        </div>
                    </div>

                    {/* Result Filters for AI Mode */}
                    {searchMode === 'ai' && (
                        <div className="result-filters reveal">
                            <span className="filter-label">Filter results:</span>
                            <select
                                value={filterJobType}
                                onChange={(e) => setFilterJobType(e.target.value)}
                                className="result-filter-select"
                            >
                                {JOB_TYPES.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <label className="result-filter-checkbox">
                                <input
                                    type="checkbox"
                                    checked={filterRemote}
                                    onChange={(e) => setFilterRemote(e.target.checked)}
                                />
                                Remote Only
                            </label>
                            {(filterJobType || filterRemote) && (
                                <button
                                    className="btn btn-text btn-clear-filters"
                                    onClick={() => { setFilterJobType(''); setFilterRemote(false); }}
                                >
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                    )}

                    <div className="jobs-grid">
                        {filteredJobs.map((job, index) => (
                            <JobCard
                                key={job.externalId || index}
                                job={job}
                                onSave={() => saveJob(job)}
                                isSaved={savedJobs.has(job.externalId)}
                                className="reveal"
                                style={{ transitionDelay: `${(index % 10) * 0.05}s` }}
                            />
                        ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="load-more-section reveal">
                            <button
                                onClick={() => searchJobs(true)}
                                disabled={loadingMore}
                                className="btn btn-secondary btn-load-more"
                            >
                                {loadingMore ? (
                                    <>
                                        <span className="spinner-small"></span>
                                        Loading more jobs...
                                    </>
                                ) : (
                                    <>
                                        <FaDownload style={{ marginRight: '6px' }} /> Load More Jobs
                                    </>
                                )}
                            </button>
                            <span className="load-more-hint">Showing {jobs.length} jobs in {location}</span>
                        </div>
                    )}

                    {!hasMore && jobs.length > 0 && (
                        <div className="no-more-jobs reveal">
                            <span>✓ You've seen all {jobs.length} jobs in {location}</span>
                        </div>
                    )}
                </>
            )}

            {!loading && jobs.length === 0 && hasSearched && (
                <div className="empty-state reveal">
                    <span className="empty-icon"><FaSearch /></span>
                    <h3>No jobs found in {location}</h3>
                    <p>Try a different {searchMode === 'manual' ? 'search term or ' : ''}location</p>
                    <button onClick={handleNewSearch} className="btn btn-secondary">
                        Try Again
                    </button>
                </div>
            )}

            {!loading && jobs.length === 0 && !hasSearched && (
                <div className="empty-state reveal">
                    <img src={require('../Logo.png')} alt="JobHunt AI" className="empty-icon-img" style={{ width: '64px', height: 'auto', marginBottom: '16px', opacity: 0.8 }} />
                    <h3>Ready to find jobs</h3>
                    <p>
                        {searchMode === 'manual'
                            ? 'Enter a job title and location to start searching'
                            : location ? `Click "Find Jobs" to search in ${location}` : 'Enter a location and click "Find Jobs"'
                        }
                    </p>
                </div>
            )}
        </div>
    );
}

export default JobList;

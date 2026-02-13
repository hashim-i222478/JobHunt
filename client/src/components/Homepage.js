import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaFileAlt, FaSearch, FaComments, FaClipboardList, FaEnvelopeOpenText, FaEnvelope,
    FaRocket, FaArrowRight, FaRobot, FaBrain, FaBolt
} from 'react-icons/fa';

const FEATURES = [
    {
        icon: FaFileAlt,
        title: 'Resume Analysis',
        description: 'AI-powered deep analysis of your resume with skill extraction, role suggestions, and professional summary.',
        link: '/resume',
        color: '#00d4ff',
    },
    {
        icon: FaSearch,
        title: 'Smart Job Search',
        description: 'Find matching jobs based on your skills, experience level, and preferred location with AI-enhanced search.',
        link: '/jobs',
        color: '#00ff88',
    },
    {
        icon: FaComments,
        title: 'Interview Prep',
        description: 'Generate tailored interview questions and get AI evaluation of your answers with detailed feedback.',
        link: '/interview',
        color: '#ff6b35',
    },
    {
        icon: FaClipboardList,
        title: 'Application Tracker',
        description: 'Track all your job applications in one place with status updates, notes, and timeline view.',
        link: '/tracker',
        color: '#ffb800',
    },
    {
        icon: FaEnvelopeOpenText,
        title: 'Cover Letter',
        description: 'Generate professional, tailored cover letters that highlight your best skills for each position.',
        link: '/cover-letter',
        color: '#6366f1',
    },
    {
        icon: FaEnvelope,
        title: 'Cold Email',
        description: 'Create compelling outreach emails to recruiters, hiring managers, and LinkedIn connections.',
        link: '/cold-email',
        color: '#ff4757',
    },
];

const STEPS = [
    {
        number: '01',
        icon: FaFileAlt,
        title: 'Upload Resume',
        description: 'Drop your PDF resume and let our AI analyze your skills, experience, and career trajectory.',
    },
    {
        number: '02',
        icon: FaBrain,
        title: 'AI Processes',
        description: 'Our AI extracts skills, matches roles, generates insights, and prepares personalized recommendations.',
    },
    {
        number: '03',
        icon: FaRocket,
        title: 'Accelerate',
        description: 'Search jobs, prep for interviews, generate cover letters, and send cold emails — all AI-powered.',
    },
];

function Homepage({ resumeData }) {
    const navigate = useNavigate();
    const homepageRef = useRef(null);

    // Scroll-reveal: observe all .reveal elements
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target); // animate once
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        const el = homepageRef.current;
        if (el) {
            el.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div className="homepage" ref={homepageRef}>
            {/* Hero */}
            <section className="hero">
                <div className="hero-badge reveal">
                    <FaRobot /> <span>Powered by AI</span>
                </div>
                <h1 className="hero-title reveal">
                    Your career deserves<br />
                    <span className="hero-gradient-text">an unfair advantage.</span>
                </h1>
                <p className="hero-subtitle reveal">
                    Upload your resume. Let AI find matching jobs, prep your interviews,
                    write cover letters, and craft cold emails — in seconds.
                </p>
                <div className="hero-actions reveal">
                    <button
                        className="hero-btn-primary"
                        onClick={() => navigate('/resume')}
                    >
                        <FaFileAlt />
                        <span>{resumeData ? 'View Analysis' : 'Upload Resume'}</span>
                        <FaArrowRight className="hero-btn-arrow" />
                    </button>
                    <button
                        className="hero-btn-secondary"
                        onClick={() => navigate('/jobs')}
                    >
                        <FaSearch />
                        <span>Search Jobs</span>
                    </button>
                </div>
                {resumeData && (
                    <div className="hero-status reveal">
                        <FaBolt className="hero-status-icon" />
                        <span>Resume loaded — {resumeData.skills?.length || 0} skills detected</span>
                    </div>
                )}
                {/* Background elements */}
                <div className="hero-glow hero-glow-1"></div>
                <div className="hero-glow hero-glow-2"></div>
                <div className="hero-grid-bg"></div>
            </section>

            {/* Features */}
            <section className="home-features">
                <div className="section-header reveal">
                    <span className="section-tag">Features</span>
                    <h2>Everything you need.<br /><span className="text-gradient">One platform.</span></h2>
                </div>
                <div className="features-grid">
                    {FEATURES.map((f, i) => (
                        <div
                            key={f.title}
                            className="feature-card reveal"
                            style={{ '--accent': f.color, transitionDelay: `${i * 0.08}s` }}
                            onClick={() => navigate(f.link)}
                        >
                            <div className="feature-icon-wrap">
                                <f.icon className="feature-icon" />
                            </div>
                            <h3>{f.title}</h3>
                            <p>{f.description}</p>
                            <span className="feature-arrow"><FaArrowRight /></span>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="home-steps">
                <div className="section-header reveal">
                    <span className="section-tag">How It Works</span>
                    <h2>Three steps to<br /><span className="text-gradient">career liftoff.</span></h2>
                </div>
                <div className="steps-row">
                    {STEPS.map((s, i) => (
                        <div key={s.number} className="step-card reveal" style={{ transitionDelay: `${i * 0.12}s` }}>
                            <span className="step-number">{s.number}</span>
                            <div className="step-icon-wrap">
                                <s.icon />
                            </div>
                            <h3>{s.title}</h3>
                            <p>{s.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="home-cta reveal">
                <div className="cta-glow"></div>
                <h2>Ready to land your<br /><span className="text-gradient">dream job?</span></h2>
                <p>Join thousands of job seekers using AI to supercharge their career search.</p>
                <button className="hero-btn-primary" onClick={() => navigate('/resume')}>
                    <FaRocket />
                    <span>Get Started Free</span>
                    <FaArrowRight className="hero-btn-arrow" />
                </button>
            </section>
        </div>
    );
}

export default Homepage;

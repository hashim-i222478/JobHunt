import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FaHome, FaFileUpload, FaBriefcase, FaListUl,
    FaUserTie, FaEnvelope, FaMagic, FaMapMarkedAlt,
    FaBars, FaTimes, FaRocket
} from 'react-icons/fa';
import '../App.css'; // Ensure we import the main CSS

function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    const links = [
        { path: '/', label: 'Home', icon: FaHome },
        { path: '/resume', label: 'Resume', icon: FaFileUpload },
        { path: '/jobs', label: 'Find Jobs', icon: FaBriefcase },
        { path: '/tracker', label: 'Tracker', icon: FaListUl },
        { path: '/interview', label: 'Interview Prep', icon: FaUserTie },
        { path: '/cover-letter', label: 'Cover Letter', icon: FaEnvelope },
        { path: '/cold-email', label: 'Cold Email', icon: FaEnvelope },
        { path: '/resume-tailor', label: 'Resume Tailor', icon: FaMagic },
        { path: '/career-roadmap', label: 'Career Roadmap', icon: FaMapMarkedAlt }
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                {isOpen ? <FaTimes /> : <FaBars />}
            </button>

            {/* Sidebar Container */}
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <FaRocket className="brand-icon" />
                        <span>JobHunt<span className="accent">AI</span></span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <link.icon className="sidebar-icon" />
                            <span className="sidebar-text">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <p>© 2026 JobHunt AI</p>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
        </>
    );
}

export default Sidebar;

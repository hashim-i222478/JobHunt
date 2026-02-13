import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage';
import ResumeUpload from './components/ResumeUpload';
import JobList from './components/JobList';
import ApplicationTracker from './components/ApplicationTracker';
import InterviewPrep from './components/InterviewPrep';
import CoverLetter from './components/CoverLetter';
import ColdEmail from './components/ColdEmail';
import Logo from './Logo.png';
import {
  FaBars, FaTimes, FaHome, FaFileAlt, FaSearch,
  FaComments, FaClipboardList, FaEnvelopeOpenText, FaEnvelope
} from 'react-icons/fa';
import './App.css';

const NAV_ITEMS = [
  { to: '/', icon: FaHome, label: 'Home', end: true },
  { to: '/resume', icon: FaFileAlt, label: 'Resume' },
  { to: '/jobs', icon: FaSearch, label: 'Find Jobs' },
  { to: '/interview', icon: FaComments, label: 'Interview' },
  { to: '/tracker', icon: FaClipboardList, label: 'Tracker' },
  { to: '/cover-letter', icon: FaEnvelopeOpenText, label: 'Cover Letter' },
  { to: '/cold-email', icon: FaEnvelope, label: 'Cold Email' },
];

function AppContent() {
  const [resumeData, setResumeData] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();

  const closeSidebar = () => setSidebarOpen(false);

  // Close sidebar on route change
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="mobile-logo">
          <img src={Logo} alt="JobHunt AI" className="logo-image" />
          <span>JobHunt<span className="accent">AI</span></span>
        </div>
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <img src={Logo} alt="JobHunt AI" className="sidebar-logo-img" />
          <h1 className="sidebar-brand">
            JobHunt<span className="accent">AI</span>
          </h1>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <item.icon className="sidebar-link-icon" />
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>© 2026 JobHuntAI</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Homepage resumeData={resumeData} />} />
          <Route
            path="/resume"
            element={
              <ResumeUpload
                onUploadSuccess={(data) => setResumeData(data)}
                resumeData={resumeData}
                onJobsFound={(foundJobs) => setJobs(foundJobs)}
              />
            }
          />
          <Route
            path="/jobs"
            element={
              <JobList
                resumeData={resumeData}
                jobs={jobs}
                setJobs={setJobs}
                loading={loading}
                setLoading={setLoading}
              />
            }
          />
          <Route path="/interview" element={<InterviewPrep resumeData={resumeData} />} />
          <Route path="/tracker" element={<ApplicationTracker />} />
          <Route path="/cover-letter" element={<CoverLetter resumeData={resumeData} />} />
          <Route path="/cold-email" element={<ColdEmail resumeData={resumeData} />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

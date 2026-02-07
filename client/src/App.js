import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import ResumeUpload from './components/ResumeUpload';
import JobList from './components/JobList';
import ApplicationTracker from './components/ApplicationTracker';
import InterviewPrep from './components/InterviewPrep';
import Logo from './Logo.png';
import './App.css';

function App() {
  const [resumeData, setResumeData] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  return (
    <Router>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <h1 className="logo">
              <img src={Logo} alt="JobHunt AI Logo" className="logo-image" />
              JobHunt<span className="accent">AI</span>
            </h1>
            <nav className="nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Upload Resume
              </NavLink>
              <NavLink to="/jobs" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Find Jobs
              </NavLink>
              <NavLink to="/interview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Interview Prep
              </NavLink>
              <NavLink to="/tracker" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                Tracker
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="main">
          <Routes>
            <Route
              path="/"
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
            <Route
              path="/interview"
              element={<InterviewPrep resumeData={resumeData} />}
            />
            <Route
              path="/tracker"
              element={<ApplicationTracker />}
            />
          </Routes>
        </main>

        <footer className="footer">
          <p>© 2026 JobHuntAI - Your AI-Powered Job Search Assistant</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;


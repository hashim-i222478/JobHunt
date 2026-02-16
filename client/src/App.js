import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import ColdEmail from './components/ColdEmail';
import ResumeTailor from './components/ResumeTailor';
import CareerRoadmap from './components/CareerRoadmap';
import Sidebar from './components/Sidebar';
import Homepage from './components/Homepage';
import ResumeUpload from './components/ResumeUpload';
import JobList from './components/JobList';
import ApplicationTracker from './components/ApplicationTracker';
import InterviewPrep from './components/InterviewPrep';
import CoverLetter from './components/CoverLetter';
// ... (keep existing imports)
// ... (keep existing imports)
import {
  FaHome, FaFileAlt, FaSearch,
  FaComments, FaClipboardList, FaEnvelopeOpenText, FaEnvelope, FaMagic
} from 'react-icons/fa';
import Logo from './Logo.png';
import './App.css';

function AppContent() {
  const [resumeData, setResumeData] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const location = useLocation();

  return (
    <div className="app-layout">
      {/* Mobile top bar and Sidebar are handled within the Sidebar component, 
          but since Sidebar is inside app-layout in the original design, 
          let's ensure we don't duplicate. 
          
          Actually, the Sidebar component I created includes the mobile toggle and overlay. 
          So I should replace the entire mobile-topbar + sidebar block with <Sidebar />.
       */}
      <Sidebar />

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
          <Route path="/resume-tailor" element={<ResumeTailor resumeData={resumeData} />} />
          <Route path="/career-roadmap" element={<CareerRoadmap resumeData={resumeData} />} /> {/* Added route */}
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

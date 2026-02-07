const express = require('express');
const router = express.Router();
const { searchJobs } = require('../services/jobSearch');

// Try to import models, but make them optional
let Application, Resume;
try {
    Application = require('../models/Application');
    Resume = require('../models/Resume');
} catch (e) { }

// In-memory storage fallback
let savedApplications = [];

/**
 * GET /api/jobs/search
 * Search for jobs using AI-powered matching or manual query
 */
router.get('/search', async (req, res) => {
    try {
        const {
            resumeId,
            skills,
            location,
            remote,
            page = 1,
            query,           // Manual search query
            experience,      // Experience level filter
            jobType,         // Job type filter (FULLTIME, PARTTIME, etc.)
            datePosted = 'month'  // Date posted filter
        } = req.query;

        let searchSkills = [];
        let experienceList = [];
        let rawText = '';

        // If resumeId provided, get skills from resume
        if (resumeId && Resume) {
            try {
                const resume = await Resume.findById(resumeId);
                if (resume) {
                    searchSkills = resume.skills || [];
                    experienceList = resume.experience || [];
                    rawText = resume.rawText || '';
                }
            } catch (e) { }
        }

        // Use skills from query if not from resume
        if (searchSkills.length === 0 && skills) {
            searchSkills = skills.split(',').map(s => s.trim());
        }

        // If no skills and no manual query, return error
        if (searchSkills.length === 0 && !query) {
            return res.status(400).json({ error: 'No skills or search query provided' });
        }

        // Search for jobs with AI analysis
        const { jobs, aiAnalysis } = await searchJobs(searchSkills, {
            location: location || '',
            remote: remote === 'true',
            page: parseInt(page),
            experience: experienceList,
            rawText,
            query,        // Pass manual query
            experienceLevel: experience,  // Pass experience filter
            jobType,      // Pass job type filter
            datePosted    // Pass date filter
        });

        res.json({
            success: true,
            count: jobs.length,
            skills: searchSkills,
            aiAnalysis: aiAnalysis,
            data: jobs
        });
    } catch (error) {
        console.error('Job search error:', error);
        res.status(500).json({
            error: 'Failed to search jobs',
            message: error.message
        });
    }
});

/**
 * POST /api/jobs/save
 * Save a job to the application tracker
 */
router.post('/save', async (req, res) => {
    try {
        const {
            externalId, title, company, companyLogo, location,
            description, salary, jobType, remote, applyLink, matchScore
        } = req.body;

        // Check if already saved
        const existing = savedApplications.find(a => a.externalId === externalId);
        if (existing) {
            return res.status(400).json({ error: 'Job already saved' });
        }

        const applicationData = {
            _id: Date.now().toString(),
            externalId,
            title,
            company,
            companyLogo,
            location,
            description,
            salary,
            jobType,
            remote,
            applyLink,
            matchScore,
            status: 'saved',
            createdAt: new Date()
        };

        // Try database first
        try {
            if (Application) {
                const application = new Application(applicationData);
                await application.save();
                applicationData._id = application._id;
            }
        } catch (e) { }

        savedApplications.push(applicationData);

        res.json({
            success: true,
            message: 'Job saved successfully',
            data: applicationData
        });
    } catch (error) {
        console.error('Save job error:', error);
        res.status(500).json({
            error: 'Failed to save job',
            message: error.message
        });
    }
});

/**
 * GET /api/jobs/saved
 * Get all saved/tracked jobs
 */
router.get('/saved', async (req, res) => {
    try {
        const { status } = req.query;
        let applications = [];

        // Try database
        try {
            if (Application) {
                let query = {};
                if (status) query.status = status;
                applications = await Application.find(query).sort({ createdAt: -1 });
            }
        } catch (e) { }

        // Fallback to in-memory
        if (applications.length === 0) {
            applications = savedApplications;
            if (status) {
                applications = applications.filter(a => a.status === status);
            }
        }

        res.json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get saved jobs',
            message: error.message
        });
    }
});

/**
 * PATCH /api/jobs/:id/status
 * Update application status
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Try database
        try {
            if (Application) {
                const update = { status };
                if (notes !== undefined) update.notes = notes;
                if (status === 'applied') update.appliedAt = new Date();

                const application = await Application.findByIdAndUpdate(
                    req.params.id,
                    update,
                    { new: true }
                );
                if (application) {
                    return res.json({ success: true, data: application });
                }
            }
        } catch (e) { }

        // Fallback to in-memory
        const app = savedApplications.find(a => a._id === req.params.id);
        if (app) {
            app.status = status;
            if (notes) app.notes = notes;
            return res.json({ success: true, data: app });
        }

        res.status(404).json({ error: 'Application not found' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update status',
            message: error.message
        });
    }
});

/**
 * DELETE /api/jobs/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        // Try database
        try {
            if (Application) {
                await Application.findByIdAndDelete(req.params.id);
            }
        } catch (e) { }

        // Remove from in-memory
        savedApplications = savedApplications.filter(a => a._id !== req.params.id);

        res.json({ success: true, message: 'Job removed' });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to delete job',
            message: error.message
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { generateCoverLetter } = require('../services/coverLetterService');

/**
 * POST /api/cover-letter/generate
 * Generate a cover letter based on resume data and job details
 */
router.post('/generate', async (req, res) => {
    try {
        const { resumeData, jobTitle, companyName, jobDescription, position, experienceLevel, tone } = req.body;

        if (!resumeData || !resumeData.skills || resumeData.skills.length === 0) {
            return res.status(400).json({
                error: 'Resume data is required',
                message: 'Please upload your resume first to generate a cover letter'
            });
        }

        if (!jobDescription || jobDescription.trim().length < 10) {
            return res.status(400).json({
                error: 'Job description is required',
                message: 'Please provide a job description (at least 10 characters)'
            });
        }

        const result = await generateCoverLetter({
            resumeData,
            jobTitle: jobTitle || '',
            companyName: companyName || '',
            jobDescription,
            position: position || 'Full-time',
            experienceLevel: experienceLevel || '',
            tone: tone || 'professional'
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Cover letter generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate cover letter',
            message: error.message
        });
    }
});

module.exports = router;

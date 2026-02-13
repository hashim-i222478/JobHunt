const express = require('express');
const router = express.Router();
const { generateColdEmail } = require('../services/coldEmailService');

/**
 * POST /api/cold-email/generate
 */
router.post('/generate', async (req, res) => {
    try {
        const { resumeData, jobTitle, companyName, jobDescription, recipientRole, emailType, tone } = req.body;

        if (!resumeData || !resumeData.skills || resumeData.skills.length === 0) {
            return res.status(400).json({
                error: 'Resume data is required',
                message: 'Please upload your resume first'
            });
        }

        const result = await generateColdEmail({
            resumeData,
            jobTitle: jobTitle || '',
            companyName: companyName || '',
            jobDescription: jobDescription || '',
            recipientRole: recipientRole || 'Recruiter',
            emailType: emailType || 'recruiter',
            tone: tone || 'professional'
        });

        res.json({ success: true, data: result });

    } catch (error) {
        console.error('Cold email generation error:', error.message);
        res.status(500).json({
            error: 'Failed to generate email',
            message: error.message
        });
    }
});

module.exports = router;

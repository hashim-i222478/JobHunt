const express = require('express');
const router = express.Router();
const { tailorResume } = require('../services/resumeTailorService');

// POST /api/tailor
// Body: { resumeText: string, jobDescription: string }
router.post('/', async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;

        if (!resumeText || !jobDescription) {
            return res.status(400).json({ error: 'Both resumeText and jobDescription are required.' });
        }

        const analysis = await tailorResume(resumeText, jobDescription);
        res.json(analysis);

    } catch (error) {
        console.error('Tailor Resume Error:', error);
        res.status(500).json({ error: error.message || 'An error occurred while tailoring the resume.' });
    }
});

module.exports = router;

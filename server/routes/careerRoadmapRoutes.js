const express = require('express');
const router = express.Router();
const { generateRoadmap } = require('../services/careerRoadmapService');

router.post('/generate', async (req, res) => {
    try {
        const { currentRole, targetRole, currentSkills } = req.body;

        if (!targetRole) {
            return res.status(400).json({ success: false, message: 'Target role is required' });
        }

        const roadmapData = await generateRoadmap(currentRole || 'Beginner', targetRole, currentSkills || []);

        res.json({
            success: true,
            data: roadmapData
        });

    } catch (error) {
        console.error('Roadmap generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate roadmap', error: error.message });
    }
});

module.exports = router;

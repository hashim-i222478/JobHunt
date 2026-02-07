const express = require('express');
const router = express.Router();
const { generateInterviewQuestions, evaluateAnswer, getInterviewTips } = require('../services/interviewService');

/**
 * POST /api/interview/generate
 * Generate interview questions based on skills
 */
router.post('/generate', async (req, res) => {
    try {
        const { skills, role, difficulty, category, excludeQuestions } = req.body;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
            return res.status(400).json({
                error: 'Skills array is required',
                message: 'Please provide at least one skill to generate questions'
            });
        }

        const questions = await generateInterviewQuestions(
            skills,
            role || '',
            difficulty || 'medium',
            category || 'all',
            excludeQuestions || []
        );

        res.json({
            success: true,
            data: questions
        });

    } catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({
            error: 'Failed to generate questions',
            message: error.message
        });
    }
});

/**
 * POST /api/interview/evaluate
 * Evaluate user's answer to a question
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { question, answer, expectedPoints } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                error: 'Question and answer are required'
            });
        }

        const evaluation = await evaluateAnswer(
            question,
            answer,
            expectedPoints || []
        );

        res.json({
            success: true,
            data: evaluation
        });

    } catch (error) {
        console.error('Error evaluating answer:', error);
        res.status(500).json({
            error: 'Failed to evaluate answer',
            message: error.message
        });
    }
});

/**
 * GET /api/interview/tips/:skill
 * Get interview tips for a specific skill
 */
router.get('/tips/:skill', (req, res) => {
    try {
        const { skill } = req.params;
        const tips = getInterviewTips(skill);

        res.json({
            success: true,
            skill: skill,
            data: tips
        });

    } catch (error) {
        console.error('Error getting tips:', error);
        res.status(500).json({
            error: 'Failed to get tips',
            message: error.message
        });
    }
});

module.exports = router;

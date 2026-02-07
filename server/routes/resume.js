const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { parsePDF } = require('../services/pdfParser');

// Try to import Resume model, but make it optional
let Resume;
try {
    Resume = require('../models/Resume');
} catch (e) {
    Resume = null;
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// In-memory storage for when MongoDB is not available
let inMemoryResumes = [];

/**
 * POST /api/resume/upload
 * Upload and parse a PDF resume
 */
router.post('/upload', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Parse the PDF
        const parsedData = await parsePDF(req.file.buffer);

        const resumeData = {
            id: Date.now().toString(),
            fileName: req.file.originalname,
            skills: parsedData.skills,
            email: parsedData.email,
            phone: parsedData.phone,
            links: parsedData.links || {},
            location: parsedData.location,
            pageCount: parsedData.pageCount,
            // AI Analysis data
            aiAnalysis: parsedData.aiAnalysis || null
        };

        // Try to save to database, fallback to in-memory
        try {
            if (Resume) {
                const resume = new Resume({
                    fileName: req.file.originalname,
                    rawText: parsedData.rawText,
                    skills: parsedData.skills,
                    email: parsedData.email,
                    phone: parsedData.phone,
                    pageCount: parsedData.pageCount
                });
                await resume.save();
                resumeData.id = resume._id.toString();
            } else {
                inMemoryResumes.push(resumeData);
            }
        } catch (dbError) {
            console.warn('DB save failed, using in-memory:', dbError.message);
            inMemoryResumes.push(resumeData);
        }

        res.json({
            success: true,
            message: 'Resume uploaded and parsed successfully',
            data: resumeData
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            error: 'Failed to process resume',
            message: error.message
        });
    }
});

/**
 * GET /api/resume/:id
 * Get a specific resume by ID
 */
router.get('/:id', async (req, res) => {
    try {
        let resume = null;

        // Try database first
        try {
            if (Resume) {
                resume = await Resume.findById(req.params.id);
            }
        } catch (e) { }

        // Fallback to in-memory
        if (!resume) {
            resume = inMemoryResumes.find(r => r.id === req.params.id);
        }

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        res.json({
            success: true,
            data: resume
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get resume',
            message: error.message
        });
    }
});

/**
 * GET /api/resume
 * Get all resumes (most recent first)
 */
router.get('/', async (req, res) => {
    try {
        let resumes = [];

        try {
            if (Resume) {
                resumes = await Resume.find()
                    .select('fileName skills uploadedAt')
                    .sort({ uploadedAt: -1 })
                    .limit(10);
            }
        } catch (e) { }

        // Add in-memory resumes if DB is empty
        if (resumes.length === 0) {
            resumes = inMemoryResumes.slice(-10).reverse();
        }

        res.json({
            success: true,
            data: resumes
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get resumes',
            message: error.message
        });
    }
});

module.exports = router;

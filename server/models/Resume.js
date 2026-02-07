const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    rawText: {
        type: String,
        required: true
    },
    skills: [{
        type: String
    }],
    email: {
        type: String
    },
    phone: {
        type: String
    },
    experience: [{
        type: String
    }],
    pageCount: {
        type: Number,
        default: 1
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for searching
resumeSchema.index({ skills: 1 });

module.exports = mongoose.model('Resume', resumeSchema);

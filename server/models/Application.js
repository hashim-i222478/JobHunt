const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    // Job details from API
    externalId: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    companyLogo: {
        type: String
    },
    location: {
        type: String
    },
    description: {
        type: String
    },
    salary: {
        type: String
    },
    jobType: {
        type: String
    },
    remote: {
        type: Boolean,
        default: false
    },
    applyLink: {
        type: String
    },

    // Application tracking
    status: {
        type: String,
        enum: ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'],
        default: 'saved'
    },
    notes: {
        type: String
    },
    appliedAt: {
        type: Date
    },

    // Reference to resume used
    resumeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resume'
    }
}, {
    timestamps: true
});

// Index for filtering by status
applicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);

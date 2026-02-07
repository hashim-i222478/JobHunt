const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Use AI to analyze resume and generate optimal job search queries
 */
async function analyzeResumeForJobSearch(skills, experience, rawText) {
    if (!GROQ_API_KEY) {
        console.log('No Groq API key, using basic search');
        return { queries: skills.slice(0, 3), jobTitles: [], seniority: 'mid' };
    }

    const prompt = `Analyze this resume information and suggest the best job search strategy.

Skills: ${skills.join(', ')}
Experience keywords: ${experience.join(', ')}
${rawText ? `Resume excerpt: ${rawText.substring(0, 1500)}` : ''}

Return a JSON object with:
1. "jobTitles": Array of 3-5 specific job titles this person should apply for (e.g., "Full Stack Developer", "React Developer")
2. "searchQueries": Array of 3 optimized search queries for job boards
3. "seniority": One of "junior", "mid", "senior", "lead" based on experience
4. "topSkills": The 5 most marketable skills from their resume

Return ONLY valid JSON, no markdown or explanation.`;

    try {
        const response = await axios.post(GROQ_URL, {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const text = response.data.choices?.[0]?.message?.content || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                jobTitles: parsed.jobTitles || [],
                queries: parsed.searchQueries || skills.slice(0, 3),
                seniority: parsed.seniority || 'mid',
                topSkills: parsed.topSkills || skills.slice(0, 5)
            };
        }
    } catch (error) {
        console.error('AI analysis error:', error.response?.data || error.message);
    }

    return { queries: skills.slice(0, 3), jobTitles: [], seniority: 'mid', topSkills: skills.slice(0, 5) };
}

/**
 * Search for jobs using JSearch API with AI-optimized queries
 */
async function searchJobs(skills, options = {}) {
    const {
        location = '',
        remote = false,
        page = 1,
        numPages = 3,
        experience = [],
        rawText = '',
        query: manualQuery,        // Manual search query override
        experienceLevel,           // Experience level filter
        jobType,                   // Job type filter
        datePosted = 'month'       // Date posted filter
    } = options;

    let aiAnalysis = null;
    let query;

    // If manual query provided, use it directly
    if (manualQuery && manualQuery.trim()) {
        query = manualQuery.trim();
        aiAnalysis = { jobTitles: [manualQuery], topSkills: skills.slice(0, 5), seniority: experienceLevel || 'mid' };
    } else {
        // Use AI to analyze and get better search queries
        aiAnalysis = await analyzeResumeForJobSearch(skills, experience, rawText);

        // Create search query - prioritize AI job titles, fall back to skills
        if (aiAnalysis.jobTitles && aiAnalysis.jobTitles.length > 0) {
            query = aiAnalysis.jobTitles.slice(0, 2).join(' OR ');
        } else if (aiAnalysis.queries && aiAnalysis.queries.length > 0) {
            query = aiAnalysis.queries[0];
        } else {
            query = skills.slice(0, 3).join(' ');
        }
    }

    if (location) query += ` in ${location}`;

    console.log('🔍 Search query:', query);
    console.log('📊 Filters:', { experienceLevel, jobType, datePosted, remote });

    try {
        // Build API params
        const params = {
            query: query,
            page: page.toString(),
            num_pages: numPages.toString(),
            date_posted: datePosted,
            remote_jobs_only: remote.toString()
        };

        // Add optional filters
        if (experienceLevel) {
            params.job_requirements = experienceLevel;
        }
        if (jobType) {
            params.employment_types = jobType;
        }

        const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
            params,
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
            }
        });

        console.log('📦 API Response - Total jobs from API:', response.data?.data?.length || 0);

        if (!response.data || !response.data.data) {
            return { jobs: [], aiAnalysis };
        }

        // Map and score jobs based on skill match
        const jobs = response.data.data.map(job => {
            const matchScore = calculateMatchScore(job, skills, aiAnalysis.topSkills);

            return {
                externalId: job.job_id,
                title: job.job_title,
                company: job.employer_name,
                companyLogo: job.employer_logo,
                location: job.job_city ? `${job.job_city}, ${job.job_state || job.job_country}` : job.job_country || 'Remote',
                description: job.job_description,
                salary: formatSalary(job.job_min_salary, job.job_max_salary, job.job_salary_currency),
                jobType: job.job_employment_type,
                remote: job.job_is_remote,
                applyLink: job.job_apply_link,
                postedAt: job.job_posted_at_datetime_utc,
                matchScore: matchScore,
                requiredSkills: job.job_required_skills || []
            };
        });

        // Sort by match score
        jobs.sort((a, b) => b.matchScore - a.matchScore);

        return { jobs, aiAnalysis };
    } catch (error) {
        console.error('JSearch API Error:', error.response?.data || error.message);
        throw new Error('Failed to search jobs: ' + (error.response?.data?.message || error.message));
    }
}

/**
 * Calculate match score between job and resume skills
 */
function calculateMatchScore(job, skills, topSkills) {
    const jobText = `${job.job_title} ${job.job_description}`.toLowerCase();
    let score = 0;

    skills.forEach(skill => {
        if (jobText.includes(skill.toLowerCase())) {
            score += 10;
        }
    });

    if (topSkills) {
        topSkills.forEach(skill => {
            if (jobText.includes(skill.toLowerCase())) {
                score += 5;
            }
        });
    }

    return Math.min(100, score);
}

/**
 * Format salary range
 */
function formatSalary(min, max, currency = 'USD') {
    if (!min && !max) return 'Not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max.toLocaleString()}`;
}

module.exports = { searchJobs, analyzeResumeForJobSearch };

const pdfParse = require('pdf-parse');
const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Parse PDF buffer and extract text content
 */
async function parsePDF(pdfBuffer) {
    try {
        const data = await pdfParse(pdfBuffer);
        const text = data.text;

        // Basic extraction
        const basicSkills = extractSkills(text);
        const email = extractEmail(text);
        const phone = extractPhone(text);
        const links = extractLinks(text);
        const location = extractLocation(text);

        // AI Analysis (if API key available)
        let aiAnalysis = null;
        if (GROQ_API_KEY) {
            aiAnalysis = await analyzeResumeWithAI(text);
        }

        // Use AI-detected location if available, fallback to regex extraction
        const detectedLocation = aiAnalysis?.location || location;

        return {
            rawText: text,
            skills: aiAnalysis?.categorizedSkills ? flattenSkills(aiAnalysis.categorizedSkills) : basicSkills,
            email,
            phone,
            links,
            location: detectedLocation,
            pageCount: data.numpages,
            aiAnalysis: aiAnalysis || {
                summary: 'AI analysis unavailable. Please add a Groq API key.',
                suggestedRoles: [],
                categorizedSkills: { Technical: basicSkills },
                timeline: [],
                location: location
            }
        };
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF: ' + error.message);
    }
}

/**
 * Use Groq AI to deeply analyze the resume
 */
async function analyzeResumeWithAI(resumeText) {
    const prompt = `Analyze this resume and provide a structured analysis. Return ONLY valid JSON with no markdown.

Resume:
${resumeText.substring(0, 6000)}

Return this exact JSON structure:
{
  "summary": "A 2-3 sentence professional summary of this candidate highlighting their key strengths and experience level",
  "suggestedRoles": ["Role 1", "Role 2", "Role 3", "Role 4", "Role 5"],
  "seniorityLevel": "junior|mid|senior|lead|executive",
  "location": "City, Country or City, State - extract from resume address or mentioned location",
  "categorizedSkills": {
    "Programming Languages": ["skill1", "skill2"],
    "Frameworks & Libraries": ["skill1", "skill2"],
    "Databases": ["skill1", "skill2"],
    "Cloud & DevOps": ["skill1", "skill2"],
    "Tools & Platforms": ["skill1", "skill2"],
    "Soft Skills": ["skill1", "skill2"]
  },
  "timeline": [
    {
      "type": "work",
      "title": "Job Title",
      "organization": "Company Name",
      "duration": "Jan 2022 - Present",
      "highlights": ["Key achievement 1", "Key achievement 2"]
    },
    {
      "type": "education",
      "title": "Degree Name",
      "organization": "University Name",
      "duration": "2018 - 2022",
      "highlights": ["GPA or honors if mentioned"]
    }
  ]
}

Rules:
- suggestedRoles should be specific job titles they should apply for
- categorizedSkills should only include skills ACTUALLY mentioned in the resume
- timeline should be in reverse chronological order (most recent first)
- location should be the candidate's current location (city, country/state)
- Keep summary concise but insightful
- Return ONLY the JSON object, nothing else`;

    try {
        const response = await axios.post(GROQ_URL, {
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2,
            max_tokens: 2000
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
            console.log('✅ AI Resume Analysis complete (Groq)');
            return parsed;
        }
    } catch (error) {
        console.error('AI analysis error:', error.response?.data || error.message);
    }

    return null;
}

/**
 * Flatten categorized skills into a single array
 */
function flattenSkills(categorizedSkills) {
    const allSkills = [];
    for (const category in categorizedSkills) {
        if (Array.isArray(categorizedSkills[category])) {
            allSkills.push(...categorizedSkills[category]);
        }
    }
    return [...new Set(allSkills)];
}

/**
 * Extract skills from resume text (fallback)
 */
function extractSkills(text) {
    const commonSkills = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
        'React', 'Angular', 'Vue', 'Next.js', 'HTML', 'CSS', 'SASS', 'Tailwind', 'Bootstrap', 'jQuery',
        'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'FastAPI', 'Rails', 'Laravel', 'ASP.NET',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Firebase', 'DynamoDB',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible',
        'Git', 'GitHub', 'GitLab', 'Jira', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'Microservices',
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
        'React Native', 'Flutter', 'iOS', 'Android',
        'Linux', 'Unix', 'Bash', 'PowerShell'
    ];

    const foundSkills = [];
    const lowerText = text.toLowerCase();

    commonSkills.forEach(skill => {
        if (lowerText.includes(skill.toLowerCase())) {
            foundSkills.push(skill);
        }
    });

    return [...new Set(foundSkills)];
}

/**
 * Extract email from text
 */
function extractEmail(text) {
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/gi;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
}

/**
 * Extract phone number from text
 */
function extractPhone(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : null;
}

/**
 * Extract professional links from text (LinkedIn, GitHub, Portfolio, etc.)
 */
function extractLinks(text) {
    const links = {};

    // LinkedIn
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+\/?/gi);
    if (linkedinMatch) {
        let url = linkedinMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        links.linkedin = url;
    }

    // GitHub
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/gi);
    if (githubMatch) {
        let url = githubMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        links.github = url;
    }

    // Portfolio / Personal website (common patterns)
    const portfolioPatterns = [
        /(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:dev|io|me|com|co|tech|design|portfolio)(?:\/[\w-]*)?/gi,
    ];

    for (const pattern of portfolioPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches) {
                // Exclude known social media sites
                if (!match.includes('linkedin') &&
                    !match.includes('github') &&
                    !match.includes('twitter') &&
                    !match.includes('facebook') &&
                    !match.includes('rapidapi') &&
                    !match.includes('google')) {
                    let url = match;
                    if (!url.startsWith('http')) url = 'https://' + url;
                    links.portfolio = url;
                    break;
                }
            }
        }
    }

    // Twitter/X
    const twitterMatch = text.match(/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[\w-]+\/?/gi);
    if (twitterMatch) {
        let url = twitterMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        links.twitter = url;
    }

    // Behance (for designers)
    const behanceMatch = text.match(/(?:https?:\/\/)?(?:www\.)?behance\.net\/[\w-]+\/?/gi);
    if (behanceMatch) {
        let url = behanceMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        links.behance = url;
    }

    // Dribbble (for designers)
    const dribbbleMatch = text.match(/(?:https?:\/\/)?(?:www\.)?dribbble\.com\/[\w-]+\/?/gi);
    if (dribbbleMatch) {
        let url = dribbbleMatch[0];
        if (!url.startsWith('http')) url = 'https://' + url;
        links.dribbble = url;
    }

    return links;
}

/**
 * Extract location from text (city, state/country)
 */
function extractLocation(text) {
    // Common patterns for location in resumes
    const patterns = [
        // "City, State" or "City, Country"
        /(?:located?\s*(?:in|at)?|address|location|based\s*in|living\s*in)?[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z][A-Za-z\s]+)/gi,
        // "City, ST" format (US states)
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\b/g,
        // Common major cities
        /\b(New York|Los Angeles|San Francisco|Chicago|Boston|Seattle|Austin|Denver|Atlanta|Dallas|Houston|Miami|Washington D\.?C\.?|London|Toronto|Sydney|Melbourne|Berlin|Paris|Singapore|Dubai|Mumbai|Bangalore|Karachi|Lahore|Islamabad|Rawalpindi|Faisalabad|Peshawar)\b/gi
    ];

    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            // Clean up and return the first valid match
            let location = matches[0].trim();
            // Remove common prefixes
            location = location.replace(/^(located?\s*(?:in|at)?|address|location|based\s*in|living\s*in)[:\s]*/i, '').trim();
            if (location.length > 3 && location.length < 50) {
                return location;
            }
        }
    }

    return null;
}

module.exports = { parsePDF, analyzeResumeWithAI, extractSkills, extractLocation };

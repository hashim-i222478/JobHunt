const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate a professional cover letter using AI
 * @param {Object} params - Cover letter parameters
 * @returns {Promise<Object>} Generated cover letter
 */
async function generateCoverLetter({ resumeData, jobTitle, companyName, jobDescription, position, experienceLevel, tone }) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    // Build resume context from parsed data
    const skills = resumeData?.skills?.join(', ') || 'Not provided';
    const experience = resumeData?.experience || [];
    const education = resumeData?.education || [];
    const name = resumeData?.name || 'The Applicant';
    const summary = resumeData?.aiAnalysis?.summary || '';

    const experienceText = experience.map(exp =>
        `${exp.title || ''} at ${exp.company || ''} (${exp.duration || ''}): ${exp.highlights?.join('; ') || ''}`
    ).join('\n') || 'Not provided';

    const educationText = education.map(edu =>
        `${edu.degree || ''} from ${edu.institution || ''} (${edu.year || ''})`
    ).join('\n') || 'Not provided';

    const toneInstructions = {
        professional: 'Use a formal, professional tone. Be polished and corporate-appropriate.',
        enthusiastic: 'Use an enthusiastic and passionate tone while remaining professional. Show genuine excitement about the opportunity.',
        concise: 'Keep the letter brief and to-the-point. Focus on the most impactful qualifications. Aim for 3 short paragraphs maximum.'
    };

    const toneGuide = toneInstructions[tone] || toneInstructions.professional;

    const prompt = `You are an expert career coach and professional writer. Generate a compelling, personalized cover letter.

APPLICANT INFORMATION:
- Name: ${name}
- Skills: ${skills}
- Experience: ${experienceText}
- Education: ${educationText}
- Profile Summary: ${summary}

JOB DETAILS:
- Job Title: ${jobTitle || 'Not specified'}
- Company: ${companyName || 'Not specified'}
- Position Type: ${position || 'Full-time'}
- Experience Level Required: ${experienceLevel || 'Not specified'}
- Job Description: ${jobDescription || 'Not provided'}

TONE: ${toneGuide}

INSTRUCTIONS:
1. Write a professional cover letter tailored to this specific job and company
2. Highlight relevant skills and experiences from the applicant's resume that match the job requirements
3. Show knowledge of the company if possible based on the job description
4. Include specific examples from the applicant's experience
5. Keep it to 3-4 paragraphs (opening, body with qualifications, why this company, closing)
6. Do NOT include placeholder brackets like [Your Name] - use the actual applicant name
7. Do NOT include the address header or date - just start with the salutation
8. End with a professional closing

Return ONLY valid JSON in this exact format:
{
    "coverLetter": "Dear Hiring Manager,\\n\\n[Full cover letter text with proper paragraph breaks using \\n\\n]\\n\\nSincerely,\\n${name}",
    "highlights": ["Key point 1 emphasized in the letter", "Key point 2", "Key point 3"],
    "matchedSkills": ["skill1", "skill2", "skill3"],
    "tips": "A brief tip about how to further customize this letter"
}`;

    try {
        const response = await axios.post(GROQ_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional cover letter writer. Always respond with valid JSON only. No markdown, no code fences, no extra text.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4000
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Clean and parse the JSON response
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```')) {
            cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }

        const parsed = JSON.parse(cleanContent);
        return parsed;

    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Rate limit exceeded. Please wait a moment and try again.');
        }
        if (error instanceof SyntaxError) {
            throw new Error('Failed to parse AI response. Please try again.');
        }
        throw error;
    }
}

module.exports = { generateCoverLetter };

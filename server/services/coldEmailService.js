const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate cold outreach emails and LinkedIn messages using AI
 */
async function generateColdEmail({ resumeData, jobTitle, companyName, jobDescription, recipientRole, emailType, tone }) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const skills = resumeData?.skills?.join(', ') || 'Not provided';
    const name = resumeData?.name || 'The Applicant';
    const experience = resumeData?.experience || [];
    const summary = resumeData?.aiAnalysis?.summary || '';
    const links = resumeData?.links || {};

    const experienceText = experience.slice(0, 3).map(exp =>
        `${exp.title || ''} at ${exp.company || ''}`
    ).join(', ') || 'Not provided';

    const linksText = [
        links.linkedin ? `LinkedIn: ${links.linkedin}` : '',
        links.github ? `GitHub: ${links.github}` : '',
        links.portfolio ? `Portfolio: ${links.portfolio}` : '',
        links.twitter ? `Twitter/X: ${links.twitter}` : '',
        links.behance ? `Behance: ${links.behance}` : '',
        links.dribbble ? `Dribbble: ${links.dribbble}` : '',
    ].filter(Boolean).join('\n  ') || 'None provided';

    const toneGuide = {
        professional: 'Formal and polished. Corporate-appropriate.',
        friendly: 'Warm, conversational, and approachable while remaining professional.',
        bold: 'Confident and attention-grabbing. Stand out from the crowd.'
    }[tone] || 'Professional and polished.';

    const emailTypeInstructions = {
        recruiter: `This is a cold email to a RECRUITER (${recipientRole || 'Recruiter'}). Focus on making their job easier — show you're a strong fit they'd want to present to their clients/hiring managers.`,
        hiring_manager: `This is a cold email to a HIRING MANAGER (${recipientRole || 'Hiring Manager'}). Focus on the business value you bring and how you can solve their team's problems.`,
        referral: `This is an email asking for a REFERRAL from someone at the company. Be respectful of their time, mention what drew you to the company, and make it easy for them to refer you.`,
        linkedin: `This is a SHORT LinkedIn connection request message (under 300 characters). Be concise, personalized, and give a clear reason for connecting.`
    }[emailType] || 'Cold outreach email to a recruiter.';

    const prompt = `You are an expert career coach who writes highly effective cold outreach emails that get responses.

APPLICANT INFO:
- Name: ${name}
- Key Skills: ${skills}
- Recent Experience: ${experienceText}
- Profile: ${summary}
- Online Profiles:
  ${linksText}

TARGET:
- Company: ${companyName || 'Not specified'}
- Job Title of Interest: ${jobTitle || 'Not specified'}
- Job Description: ${jobDescription || 'Not provided'}
- Recipient: ${recipientRole || 'Recruiter'}

TYPE: ${emailTypeInstructions}

TONE: ${toneGuide}

INSTRUCTIONS:
1. Write a compelling, personalized outreach message
2. Keep it concise — max 150 words for emails, max 280 characters for LinkedIn
3. Include a clear subject line for emails
4. Reference specific skills/experience that match the role
5. End with a clear, low-friction call to action
6. Do NOT use placeholder brackets — use actual applicant data
7. Make it feel human, not templated
8. If the applicant has relevant online profiles (LinkedIn, GitHub, portfolio), naturally weave them into the email signature or body where appropriate — do NOT force all links in if they're not relevant

Return ONLY valid JSON in this exact format:
{
    "subject": "Email subject line (empty string for LinkedIn messages)",
    "message": "The full email or LinkedIn message body",
    "followUp": "A polite 2-sentence follow-up message to send after 5-7 days",
    "tips": ["Tip 1 for improving response rate", "Tip 2", "Tip 3"],
    "type": "${emailType}"
}`;

    try {
        const response = await axios.post(GROQ_URL, {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    content: 'You are a cold email expert. Always respond with valid JSON only. No markdown, no code fences.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.75,
            max_tokens: 2000
        }, {
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const content = response.data.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        let clean = content.trim();
        if (clean.startsWith('```')) {
            clean = clean.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }

        return JSON.parse(clean);

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

module.exports = { generateColdEmail };

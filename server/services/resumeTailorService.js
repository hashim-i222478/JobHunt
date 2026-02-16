const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Tailor the resume based on the provided job description.
 * @param {string} resumeText - The text content of the user's resume.
 * @param {string} jobDescription - The text of the job description.
 * @returns {Promise<Object>} - The analysis result containing missing keywords and rewrites.
 */
async function tailorResume(resumeText, jobDescription) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured.');
  }

  const prompt = `You are an elite Resume Strategist, ATS optimization expert, and Career Coach.
Your task is to deeply analyze the candidate's resume against the Job Description (JD) and provide actionable, section-specific tailoring suggestions.

Resume:
${resumeText.substring(0, 5000)}

Job Description:
${jobDescription.substring(0, 5000)}

Return a valid JSON object with EXACTLY this structure:
{
  "analysis": {
    "matchScore": 0-100,
    "summary": "1-2 sentence assessment of overall fit.",
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"]
  },
  "missingKeywords": [
    {
      "keyword": "The keyword or skill",
      "importance": "critical" | "important" | "nice-to-have",
      "context": "Brief note on where/how it appears in the JD"
    }
  ],
  "suggestedRewrites": [
    {
      "section": "The resume section this belongs to, e.g. Professional Summary, Work Experience, Skills, Projects, Education",
      "original": "The exact original text from the resume that should be improved.",
      "rewrite": "The improved version incorporating JD keywords and stronger action verbs.",
      "reason": "Why this change improves ATS match and recruiter appeal.",
      "impact": "high" | "medium" | "low"
    }
  ],
  "additionalSuggestions": [
    {
      "section": "The section to add this to, e.g. Skills, Professional Summary",
      "suggestion": "New content to add (e.g., a new skill line, a summary sentence, a project description).",
      "reason": "Why adding this content helps match the JD."
    }
  ]
}

Rules:
1. Identify at least 5 missing keywords, each with importance level.
2. Provide at least 4 high-impact rewrites across DIFFERENT resume sections.
3. The "original" text MUST be an exact substring from the provided resume.
4. Never invent experiences. Reframe existing ones to highlight transferable skills.
5. Include at least 2 additional suggestions for new content to add.
6. Prioritize by impact: high-impact changes first.
7. Return ONLY valid JSON. No markdown, no code blocks, no extra text.`;

  try {
    const response = await axios.post(GROQ_URL, {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that outputs only valid JSON. You never wrap JSON in markdown code blocks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.15,
      max_tokens: 3000
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const text = response.data.choices?.[0]?.message?.content || '';

    // Extract JSON from potential markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Failed to parse AI response as JSON');
    }

  } catch (error) {
    console.error('Error in tailorResume:', error.response?.data || error.message);
    throw new Error('Failed to generate resume tailoring suggestions.');
  }
}

module.exports = { tailorResume };

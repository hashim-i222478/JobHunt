const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Generate interview questions based on skills and role
 * @param {string[]} skills - List of skills from resume
 * @param {string} role - Target job role (optional)
 * @param {string} difficulty - easy, medium, hard
 * @param {string} category - technical, behavioral, all
 * @returns {Promise<Object>} Generated questions
 */
async function generateInterviewQuestions(skills, role = '', difficulty = 'medium', category = 'all', excludeQuestions = []) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const skillsList = skills.slice(0, 10).join(', '); // Limit to top 10 skills
    const roleContext = role ? `for a ${role} position` : '';

    const categoryInstructions = {
        'technical': 'Focus only on technical questions about the listed skills.',
        'behavioral': 'Focus only on behavioral/situational questions relevant to software development.',
        'system-design': 'Focus only on system design and architecture questions.',
        'all': 'Include a mix of technical, behavioral, and problem-solving questions.'
    };

    // Build exclusion instruction if there are questions to exclude
    const exclusionInstruction = excludeQuestions.length > 0
        ? `\n\nIMPORTANT: Do NOT generate questions similar to these previously asked questions:\n${excludeQuestions.slice(-20).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nGenerate completely different questions that test different aspects of the skills.`
        : '';

    // Difficulty-specific instructions
    const difficultyInstructions = {
        'easy': 'EASY difficulty: Generate beginner-friendly questions that test basic understanding, definitions, and simple concepts. These should be answerable by junior developers or those new to the technology.',
        'medium': 'MEDIUM difficulty: Generate intermediate questions that require practical experience, understanding of common patterns, and ability to explain trade-offs. Suitable for mid-level developers.',
        'hard': 'HARD difficulty: Generate advanced questions that require deep expertise, complex problem-solving, system design thinking, and knowledge of edge cases. These should challenge senior developers.'
    };

    const prompt = `You are an expert technical interviewer. Generate interview questions ${roleContext} for a candidate with these skills: ${skillsList}.

${difficultyInstructions[difficulty] || difficultyInstructions['medium']}
${categoryInstructions[category] || categoryInstructions['all']}${exclusionInstruction}

Generate exactly 10 questions. ALL questions must be ${difficulty.toUpperCase()} difficulty level. For each question:
1. Question text
2. Category (technical, behavioral, or problem-solving)  
3. Difficulty (must be "${difficulty}")
4. A concise but complete sample answer (1-2 paragraphs max)
5. Key points (3 bullet points)
6. Brief tip

Return ONLY valid JSON:
{
    "questions": [
        {
            "id": 1,
            "question": "Question text",
            "category": "technical",
            "difficulty": "${difficulty}",
            "skill": "Skill name",
            "detailedAnswer": "Complete sample answer in 1-2 paragraphs.",
            "expectedPoints": ["Point 1", "Point 2", "Point 3"],
            "tips": "Brief tip"
        }
    ],
    "summary": {
        "totalQuestions": 10,
        "skillsCovered": ["skill1", "skill2"],
        "estimatedDuration": "45 minutes"
    }
}`;

    try {
        const response = await axios.post(
            GROQ_URL,
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a technical interviewer. Respond with valid JSON only. Keep answers concise. No markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 8000
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;

        // Try to parse JSON from the response
        let jsonStr = content;

        // Remove markdown code blocks if present
        if (content.includes('```json')) {
            jsonStr = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            jsonStr = content.split('```')[1].split('```')[0];
        }

        const result = JSON.parse(jsonStr.trim());
        return result;

    } catch (error) {
        console.error('Error generating interview questions:', error.message);

        // Return fallback questions if AI fails
        return getFallbackQuestions(skills, difficulty);
    }
}

/**
 * Evaluate a user's answer to an interview question
 * @param {string} question - The interview question
 * @param {string} answer - User's answer
 * @param {string[]} expectedPoints - Expected answer points
 * @returns {Promise<Object>} Evaluation result
 */
async function evaluateAnswer(question, answer, expectedPoints) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured');
    }

    const prompt = `You are an interview coach evaluating a candidate's answer.

Question: ${question}

Expected key points: ${expectedPoints.join(', ')}

Candidate's answer: ${answer}

Evaluate the answer and provide:
1. Score (1-10)
2. Strengths (what they did well)
3. Areas to improve
4. Suggested better answer

Return ONLY valid JSON:
{
    "score": 7,
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"],
    "suggestedAnswer": "A more complete answer would be..."
}`;

    try {
        const response = await axios.post(
            GROQ_URL,
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an interview coach. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;
        let jsonStr = content;

        if (content.includes('```json')) {
            jsonStr = content.split('```json')[1].split('```')[0];
        } else if (content.includes('```')) {
            jsonStr = content.split('```')[1].split('```')[0];
        }

        return JSON.parse(jsonStr.trim());

    } catch (error) {
        console.error('Error evaluating answer:', error.message);
        return {
            score: 5,
            strengths: ['Attempted to answer the question'],
            improvements: ['Could not evaluate - please try again'],
            suggestedAnswer: 'Evaluation failed'
        };
    }
}

/**
 * Get fallback questions when AI is unavailable
 */
function getFallbackQuestions(skills, difficulty) {
    const primarySkill = skills[0] || 'programming';

    return {
        questions: [
            {
                id: 1,
                question: `Explain the key concepts of ${primarySkill} and when you would use it.`,
                category: 'technical',
                difficulty: difficulty,
                skill: primarySkill,
                expectedPoints: [
                    'Clear definition',
                    'Use cases',
                    'Advantages and limitations'
                ],
                tips: 'Start with a clear definition, then provide concrete examples.'
            },
            {
                id: 2,
                question: 'Tell me about a challenging project you worked on and how you overcame obstacles.',
                category: 'behavioral',
                difficulty: 'medium',
                skill: 'Problem Solving',
                expectedPoints: [
                    'Clear problem description',
                    'Actions taken',
                    'Results achieved',
                    'Lessons learned'
                ],
                tips: 'Use the STAR method: Situation, Task, Action, Result.'
            },
            {
                id: 3,
                question: `How would you debug a performance issue in a ${primarySkill} application?`,
                category: 'problem-solving',
                difficulty: difficulty,
                skill: primarySkill,
                expectedPoints: [
                    'Systematic approach',
                    'Profiling tools',
                    'Common bottlenecks',
                    'Optimization strategies'
                ],
                tips: 'Show your debugging process step by step.'
            }
        ],
        summary: {
            totalQuestions: 3,
            skillsCovered: [primarySkill, 'Problem Solving'],
            estimatedDuration: '15 minutes'
        }
    };
}

/**
 * Get interview tips for a specific skill
 */
function getInterviewTips(skill) {
    const commonTips = {
        'React': {
            keyTopics: ['Hooks', 'State management', 'Virtual DOM', 'Component lifecycle', 'Performance optimization'],
            commonQuestions: [
                'Explain the difference between state and props',
                'What are React Hooks and why were they introduced?',
                'How does the Virtual DOM work?'
            ],
            resources: ['React documentation', 'React patterns']
        },
        'Node.js': {
            keyTopics: ['Event loop', 'Async/await', 'Express.js', 'Streams', 'Error handling'],
            commonQuestions: [
                'Explain the Node.js event loop',
                'How do you handle errors in async code?',
                'What are streams and when would you use them?'
            ],
            resources: ['Node.js docs', 'Node best practices']
        },
        'Python': {
            keyTopics: ['Decorators', 'Generators', 'OOP', 'List comprehensions', 'GIL'],
            commonQuestions: [
                'What are decorators and how do they work?',
                'Explain the difference between lists and tuples',
                'What is the GIL and how does it affect multithreading?'
            ],
            resources: ['Python docs', 'Real Python tutorials']
        }
    };

    // Return tips for the skill or generic tips
    return commonTips[skill] || {
        keyTopics: ['Core concepts', 'Best practices', 'Common patterns', 'Debugging techniques'],
        commonQuestions: [
            `What are the main features of ${skill}?`,
            `When would you choose ${skill} over alternatives?`,
            `What are common pitfalls when using ${skill}?`
        ],
        resources: ['Official documentation', 'Online tutorials']
    };
}

module.exports = {
    generateInterviewQuestions,
    evaluateAnswer,
    getInterviewTips
};

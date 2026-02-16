const axios = require('axios');

const generateRoadmap = async (currentRole, targetRole, currentSkills) => {
    try {
        const prompt = `
        Create a detailed, step-by-step career roadmap for a user transitioning from "${currentRole}" to "${targetRole}".
        
        Current Skills: ${currentSkills ? currentSkills.join(', ') : 'None specified'}
        
        Return a JSON object with a "nodes" array and an "edges" array suitable for a graph visualization.
        
        Format requirements:
        1. "nodes": Array of objects. Each node must have:
           - "id": string (e.g., "1", "2")
           - "type": "milestoneNode" (custom type we will use)
           - "data": object containing:
             - "label": Short title (e.g., "Learn React")
             - "description": 1-2 sentence description.
             - "estimatedTime": e.g., "2 weeks"
             - "resources": Array of objects, each having:
                - "title": Title of the resource (e.g., "React Docs")
                - "url": A valid URL (e.g., "https://react.dev"). Ensure the URL is real or a valid search query link.
           - "position": { "x": 0, "y": 0 } (we will layout automatically so just returning 0 is fine)
        
        2. "edges": Array of objects. Each edge must have:
           - "id": string (e.g., "e1-2")
           - "source": node id (e.g., "1")
           - "target": node id (e.g., "2")
           - "animated": true
        
        Make the roadmap logical, starting from foundations to advanced topics.
        The first node should be the starting point (Current Role), and the last node the destination (Target Role), with clear learning milestones in between.
        Include at least 5-8 intermediate steps.
        
        RETURN JSON ONLY. NO MARKDOWN.
        `;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are an expert career coach and technical mentor. Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;

        // Clean markdown code blocks if present
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);

    } catch (error) {
        console.error('Error in generateRoadmap:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { generateRoadmap };

const axios = require('axios');

/**
 * Build direct search URLs on real learning platforms.
 * Each URL takes the user directly to course/tutorial listings on that platform.
 */
const buildLearningLinks = (searchQuery, topic) => {
    const q = encodeURIComponent(searchQuery);
    const t = encodeURIComponent(topic);

    return {
        resources: [
            {
                title: `${topic} — Coursera Courses`,
                url: `https://www.coursera.org/search?query=${q}`,
                platform: 'Coursera'
            },
            {
                title: `${topic} — Udemy Courses`,
                url: `https://www.udemy.com/courses/search/?q=${q}`,
                platform: 'Udemy'
            },
            {
                title: `${topic} — freeCodeCamp`,
                url: `https://www.freecodecamp.org/news/search/?query=${q}`,
                platform: 'freeCodeCamp'
            },
            {
                title: `${topic} — MDN Web Docs`,
                url: `https://developer.mozilla.org/en-US/search?q=${q}`,
                platform: 'MDN'
            }
        ],
        videos: [
            {
                title: `${topic} — Full Course`,
                url: `https://www.youtube.com/results?search_query=${t}+full+course+tutorial`
            },
            {
                title: `${topic} — Crash Course`,
                url: `https://www.youtube.com/results?search_query=${t}+crash+course+for+beginners`
            },
            {
                title: `${topic} — Project Tutorial`,
                url: `https://www.youtube.com/results?search_query=${t}+project+tutorial+build`
            }
        ]
    };
};

/**
 * After the LLM returns the roadmap skeleton, enrich every node
 * with real platform links constructed from the topic/keywords.
 */
const enrichWithLearningMaterials = (roadmapData) => {
    if (!roadmapData.nodes) return roadmapData;

    roadmapData.nodes = roadmapData.nodes.map(node => {
        if (!node.data) return node;

        const label = node.data.label || '';

        // Use the LLM's search queries if available, otherwise fall back to the label
        const llmResources = node.data.resources || [];
        const searchTerms = llmResources.length > 0
            ? llmResources.map(r => r.searchQuery || r.title || label)
            : [label];

        // Build the primary search query from the most specific term
        const primaryQuery = searchTerms[0];
        const links = buildLearningLinks(primaryQuery, label);

        node.data.resources = links.resources;
        node.data.videos = links.videos;

        return node;
    });

    return roadmapData;
};

const generateRoadmap = async (currentRole, targetRole, currentSkills) => {
    try {
        const prompt = `
        Create a detailed, step-by-step career roadmap for a user transitioning from "${currentRole}" to "${targetRole}".
        
        Current Skills: ${currentSkills ? currentSkills.join(', ') : 'None specified'}
        
        Return a JSON object with a "nodes" array and an "edges" array suitable for a graph visualization.
        
        Format requirements:
        1. "nodes": Array of objects. Each node must have:
           - "id": string (e.g., "1", "2")
           - "type": "milestoneNode"
           - "data": object containing:
             - "label": Short title (e.g., "Learn React")
             - "description": 1-2 sentence description.
             - "estimatedTime": e.g., "2 weeks"
             - "resources": Array of 2-3 objects with:
                - "title": A descriptive topic name (e.g., "React Hooks", "Python Data Structures")
                - "searchQuery": A specific search phrase to find learning materials for this topic (e.g., "react hooks tutorial for beginners", "python data structures course")
                DO NOT include any URLs. We will generate links to Coursera, Udemy, freeCodeCamp, YouTube etc. automatically.
           - "position": { "x": 0, "y": 0 }
        
        2. "edges": Array of objects. Each edge must have:
           - "id": string (e.g., "e1-2")
           - "source": node id (e.g., "1")
           - "target": node id (e.g., "2")
           - "animated": true

        IMPORTANT: 
        - DO NOT include any URLs. Only provide "title" and "searchQuery" in resources.
        - Make the searchQuery specific and descriptive so it matches real courses/tutorials.
        - Make the roadmap logical, starting from foundations to advanced topics.
        - The first node should be the starting point (Current Role), and the last node the destination (Target Role).
        - Include at least 5-8 intermediate steps.
        
        RETURN JSON ONLY. NO MARKDOWN.
        `;

        const response = await axios.post(
            process.env.AZURE_OPENAI_URL,
            {
                model: "gpt-4.1-mini",
                messages: [
                    { role: "system", content: "You are an expert career coach and technical mentor. Return valid JSON only. Do NOT include any URLs — only provide title and searchQuery for resources." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 3000
            },
            {
                headers: {
                    'api-key': process.env.AZURE_OPENAI_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;

        // Clean markdown code blocks if present
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const roadmapData = JSON.parse(jsonString);

        // Enrich with real learning platform links
        return enrichWithLearningMaterials(roadmapData);

    } catch (error) {
        console.error('Error in generateRoadmap:', error.response?.data || error.message);
        throw error;
    }
};

module.exports = { generateRoadmap };

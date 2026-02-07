# JobHuntAI - AI-Powered Career Assistant 🚀

**JobHuntAI** is a comprehensive, AI-driven platform designed to supercharge your job search. It goes beyond simple job matching by acting as your personal career coach—analyzing your resume, finding the perfect roles, tracking your applications, and even preparing you for interviews with AI-simulated questions and feedback.

![JobHuntAI Dashboard](client/public/logo.png)

## ✨ Key Features

### 1. 📄 AI Resume Analysis
- **Deep Parsing**: Extracts skills, experience, and education from PDF resumes.
- **Smart Feedback**: AI analyzes your resume to suggest improvements and highlight strengths.
- **Role Matching**: Automatically suggests job roles that fit your profile.

### 2. 🔍 Intelligent Job Search
- **AI-Powered Matching**: Finds jobs that actually match your skills and experience level using JSearch API.
- **Smart Filters**: Filter by remote, full-time, salary, and more.
- **Match Score**: See how well you fit a job description at a glance.

### 3. 🎯 Interview Preparation
- **AI Question Generator**: Generates custom interview questions based on your specific skills and target role.
- **Detailed Sample Answers**: Provides comprehensive, high-quality answers for every question.
- **Answer Evaluation**: **Submit your own answers** and get instant AI feedback on your strengths, areas for improvement, and a score (0-10).
- **Mode Toggle**: Practice with different difficulty levels (Easy, Medium, Hard) and categories (Technical, Behavioral, System Design).

### 4. 📊 Application Tracker
- **Kanban-Style Tracking**: Manage your applications through stages: Saved, Applied, Interviewing, Offer, Rejected.
- **Statistics**: Visual breakdown of your application progress.
- **Notes & Updates**: Keep track of interview dates and follow-ups.

## 🛠️ Tech Stack

- **Frontend**: React.js, CSS Modules ("Obsidian Forge" Design System)
- **Backend**: Node.js, Express.js
- **AI Engine**: Groq (Llama 3 70B) for blazing-fast inference
- **Database**: MongoDB (Mongoose)
- **APIs**: JSearch (RapidAPI) for real-time job listings

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (Running locally or Atlas URI)
- Groq API Key (for AI features)
- RapidAPI Key (for JSearch)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/JobHuntAI.git
    cd JobHuntAI
    ```

2.  **Setup Backend:**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in `server/`:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/jobhuntai
    # Get free key from console.groq.com
    GROQ_API_KEY=your_groq_api_key
    # Get from rapidapi.com/letscrape-6bRBa3qPH/api/jsearch
    RAPIDAPI_KEY=your_rapidapi_key
    RAPIDAPI_HOST=jsearch.p.rapidapi.com
    ```

3.  **Setup Frontend:**
    ```bash
    cd ../client
    npm install
    ```

### Running the App

1.  **Start Backend:**
    ```bash
    cd server
    npm run dev
    ```
    Server runs on `http://localhost:5000`

2.  **Start Frontend:**
    ```bash
    cd client
    npm start
    ```
    App opens at `http://localhost:3000`

## 🔮 Future Roadmap
- 🎤 **Voice Interview Mode**: Speak your answers and get audio feedback.
- 📧 **Cold Email Generator**: AI-crafted messages to recruiters.
- 🗺️ **Career Roadmap**: Visual path to reach your dream role.

## 🤝 Contributing
Contributions are welcome! Fork the repo and submit a PR.

## 📄 License
MIT License

# JobHuntAI - Resume-to-Job Matcher & Tracker

JobHuntAI is a full-stack web application designed to streamline the job search process. Users can upload their PDF resumes, which are automatically parsed to extract key skills and roles. The application then matches these profiles with relevant live job listings using the JSearch API and provides a dashboard to track job applications.

## 🚀 Features

- **Resume Parsing**: Automatically extracts text and keywords from PDF resumes.
- **Smart Job Search**: Finds relevant job listings based on parsed resume data (using JSearch API).
- **Application Tracking**: Kanban-style or list view to track the status of your applications (Applied, Interviewing, Offer, Rejected).
- **Modern UI**: Clean, responsive interface built with React and External CSS.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), CSS Modules/Vanilla CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **External APIs**: JSearch (RapidAPI)
- **Libraries**: 
    - `pdf-parse`: For extracting text from PDF resumes.
    - `axios`: For API requests.
    - `react-router-dom`: For client-side routing.
    - `multer`: For handling file uploads.

## 📂 Project Structure

```
JobHuntAI/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                 # Node.js Backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── server.js           # Entry point
│   └── package.json
└── README.md
```

## ⚡ Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local or Atlas connection string)
- RapidAPI Key for JSearch

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
    - Create a `.env` file in the `server` directory and add your credentials:
        ```env
        PORT=5000
        MONGODB_URI=mongodb://localhost:27017/jobhuntai
        RAPIDAPI_KEY=your_rapidapi_key
        ```

3.  **Setup Frontend:**
    ```bash
    cd ../client
    npm install
    ```

### Running the Application

1.  **Start the Backend Server:**
    ```bash
    cd server
    npm run dev
    ```
    The server will start on `http://localhost:5000`.

2.  **Start the Frontend Client:**
    ```bash
    cd client
    npm run dev
    ```
    The client will start on `http://localhost:5173`.

## 🛣️ API Endpoints

### Resume
- `POST /api/resume/upload`: Upload and parse a PDF resume.

### Jobs
- `GET /api/jobs/search?query=...`: Search for jobs using the JSearch API.

### Applications
- `GET /api/applications`: Get all tracked applications.
- `POST /api/applications`: Add a new application to track.
- `PATCH /api/applications/:id`: Update application status.
- `DELETE /api/applications/:id`: Delete an application.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## 📄 License

This project is licensed under the MIT License.

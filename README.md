# ResumeIQ

ResumeIQ is an AI-powered interview preparation application. A user saves one or more career profiles containing a resume, target job description, and self-description. The application then generates interview-readiness reports, section-based mock tests, and mock interview sessions tailored to that profile.

## Main flow

1. User creates an account or signs in.
2. User creates a Career Profile with a resume, job description, and self-description.
3. User generates a base interview report from that profile.
4. User starts a mock test or mock interview using the report.
5. After completing practice, the user can generate a performance report that uses saved mock-test and mock-interview results.

Each profile is separate. This means one user can prepare for different roles, such as Frontend Developer and Data Analyst, without mixing their resume, job description, reports, or practice history.

## Tech stack

- Frontend: React, Vite, Tailwind CSS, React Router, Lucide icons
- Backend: Node.js, Express, TypeScript, Mongoose
- Database: MongoDB
- AI: Google Gemini through `@google/genai`
- Uploads: Multer and `pdf-parse`

## Project structure

```text
.
├── BACKEND/                 # Express + TypeScript API
│   └── src/
│       ├── controllers/
│       ├── model/
│       ├── router/
│       ├── services/
│       └── middleware/
├── Frontend/                # React + Vite application
│   └── src/
│       ├── features/auth/
│       ├── Interview/
│       ├── api/
│       └── context/
└── README.md
```

## Local setup

### 1. Backend

```bash
cd BACKEND
npm install
```

Create `BACKEND/.env` from `BACKEND/.env.example` and set the required values:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/resumeiq
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_GENAI_API_KEY=your_google_gemini_api_key
SMTP_USER=your_resumeiq_gmail@gmail.com
SMTP_PASS=your_16_digit_google_app_password
EMAIL_FROM=ResumeIQ <your_resumeiq_gmail@gmail.com>
```

Start the backend:

```bash
npm run dev
```

The API starts at `http://localhost:5000` by default.

### Email verification

New users must verify the email address they entered before they can sign in. The backend sends a six-digit OTP through Gmail SMTP. For a free setup, enable 2-Step Verification on the Gmail account used by ResumeIQ, create a Google App Password, and use that 16-digit value as `SMTP_PASS`. Do not use your normal Gmail password.

Without `SMTP_USER` and `SMTP_PASS`, the backend prints the OTP only in its terminal for local development; it does not send a real email.

### 2. Frontend

```bash
cd Frontend
npm install
```

Optionally create `Frontend/.env` when the backend is running on a different URL:

```env
VITE_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

## Career Profile API

All endpoints below require this header, except authentication endpoints:

```text
Authorization: Bearer <token>
```

### Create a profile

`POST /api/ai/career-profile`

Use `multipart/form-data` when uploading a resume PDF:

| Field | Required | Description |
| --- | --- | --- |
| `resume` | Yes* | Resume PDF, maximum 5 MB |
| `resumeText` | Yes* | Resume as plain text. Use this instead of `resume`. |
| `jobDescription` | Yes | Target job description |
| `selfDescription` | Yes | Candidate background, goals, and strengths |
| `name` | No | Saved profile name |
| `targetRole` | No | Example: `Frontend Developer` |

`resume` or `resumeText` is required. When a PDF is uploaded, its extracted text is stored in MongoDB as `resumeText`; the original PDF is not stored on server disk.

Example JSON body using resume text:

```json
{
  "name": "Frontend developer 2026",
  "targetRole": "Frontend Developer",
  "resumeText": "React developer with two years of experience in JavaScript, React, Node.js and MongoDB.",
  "jobDescription": "We need a Frontend Developer with React, TypeScript, REST API and Git experience.",
  "selfDescription": "I want to improve frontend system design and technical interview communication."
}
```

### Get saved profiles

`GET /api/ai/career-profiles`

### Get one profile

`GET /api/ai/career-profile/:profileId`

### Update a profile

`PATCH /api/ai/career-profile/:profileId`

Send any fields that need to change. A new `resume` PDF or `resumeText` replaces the previous saved resume text.

## Report and practice API

### Generate a base report

`POST /api/ai/generate-interview-report`

```json
{
  "careerProfileId": "PUT_PROFILE_ID_HERE",
  "reportType": "base"
}
```

### Generate a performance report

This report uses completed mock-test and mock-interview data belonging to the same career profile.

`POST /api/ai/generate-interview-report`

```json
{
  "careerProfileId": "PUT_PROFILE_ID_HERE",
  "reportType": "performance"
}
```

### Start a mock test

`POST /api/ai/mock-test/start`

```json
{
  "reportId": "PUT_REPORT_ID_HERE",
  "experienceLevel": "Fresher"
}
```

The backend first generates an assessment pattern, for example Aptitude, Technical, and Coding sections. It then generates MCQ questions for each pattern section. The `MockTestSession` stores the overall attempt and section pattern, while each saved question has its own `category` so it can be returned section-wise.

### Submit a mock test

`POST /api/ai/mock-test/submit`

```json
{
  "mocktestId": "PUT_MOCK_TEST_SESSION_ID_HERE",
  "mocktestsheet": [
    {
      "questionId": "PUT_QUESTION_ID_HERE",
      "chosenAnswer": "HyperText Markup Language"
    }
  ]
}
```

### Start a mock interview

`POST /api/ai/mock-interview/start`

```json
{
  "reportId": "PUT_REPORT_ID_HERE",
  "totalQuestions": 5
}
```

### Submit a mock interview answer

`POST /api/ai/mock-interview/answer`

Send `reportId`, `mockInterviewSessionId`, `mockInterviewId`, and `answerText` as JSON, or use `multipart/form-data` with `audioAnswer` for an audio response.

## Data model relationships

```text
User
  └── CareerProfile
        ├── InterviewReport (base or performance)
        │     ├── MockTestSession
        │     └── MockInterviewSession
        └── saved resumeText + jobDescription + selfDescription
```

`InterviewReport`, `MockTestSession`, and `MockInterviewSession` each store a `careerProfile` reference. This is what keeps all preparation activity linked to the correct saved profile.

## Authentication endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/user/create` | Create a user account |
| `POST` | `/api/user/login` | Sign in and receive a token |
| `GET` | `/api/user/get-me` | Get the current authenticated user |
| `GET` | `/api/user/logout` | Log out the current token |

## Current scope

- Resume uploads are PDF-only and only the extracted text is persisted.
- Mock-test questions are currently MCQs, including questions in a Coding section.
- Code editor, sample input/output, hidden test cases, code execution, and automatic code evaluation are not implemented yet.
- The frontend supports creating and reusing Career Profiles and generating base reports. Mock-test and mock-interview interfaces can be added next on top of the existing backend APIs.

## Build checks

```bash
cd BACKEND && npm run build
cd Frontend && npm run build
```

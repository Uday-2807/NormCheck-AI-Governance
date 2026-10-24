# NormCheck AI

**Publish with confidence. Stay on brand.**

NormCheck AI is a content compliance review platform designed to help teams check written content against configured brand guidelines, identify potential issues, and make consistent review decisions before publishing.

**Live Website:** https://normcheck-ai-governance.onrender.com/

## Features

- **Content Checking:** Check submitted text against configured rules.
- **Potential Findings:** Identify wording that may need attention and review suggested improvements.
- **Brand Knowledge:** Organize approved terminology, guidelines, and restricted phrases.
- **Review Workflow:** Examine findings and make informed review decisions.
- **Activity History:** Revisit previous content checks where history is available.

## Technology Stack

- Node.js
- Express.js
- MongoDB
- HTML, CSS, and JavaScript

## Project Structure

```text
Norm-Check/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── ...
└── frontend/
    └── ...
```

## Local Installation

### Prerequisites

- Node.js and npm
- A MongoDB database

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file inside the `backend` directory:

```dotenv
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
PORT=3000
```

Use the variable names expected by your backend code. Never commit `.env` files or expose database credentials publicly.

### 3. Start the application

```bash
npm start
```

This requires the backend `package.json` to define a start script, such as `"start": "node server.js"`.

Open the local address configured by the server.

## Deployment

NormCheck AI is deployed on Render.

For deployment from the repository root, the commands are:

**Build Command**

```bash
cd backend && npm install
```

**Start Command**

```bash
cd backend && npm start
```

Configure the required environment variables in Render's Environment Variables settings. Keep the `backend` and `frontend` directories together because the backend serves the frontend.

These commands assume the backend start script exists and the server's frontend path matches the deployed directory structure.

## Security

- Keep database credentials and API keys private.
- Never commit `.env` files to GitHub.
- Exclude `node_modules` from source control.
- Rotate credentials if they are accidentally exposed.

## Important Note

NormCheck AI supports content review and helps identify potential issues. Findings should be reviewed by a person before content is published. The platform does not replace professional legal advice or formal regulatory approval.

## Team members
 **UDAY K**
 **VASAMSETTI MANOJ KUMAR**

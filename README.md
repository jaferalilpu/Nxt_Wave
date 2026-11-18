# Proofdesk: AI-Powered Code Assessment & Question Generator

Proofdesk is a full-stack monorepo application that uses Google Gemini to automatically analyze technical markdown study materials containing code snippets and generate rigorous, grounded assessment questions with complete pedagogical validation.

---

##  Links
* **Live Application URL:** [https://nxt-wave-g162.onrender.com](https://nxt-wave-g162.onrender.com)
* **GitHub Repository:** [Github}(https://github.com/jaferalilpu/Nxt_Wave)

---

## Architecture & Tech Stack
* **Monorepo Structure:** Unified single-service deployment where Express serves both the REST API endpoints and the compiled Vite/React static assets.
* **Frontend:** React, Vite, Tailwind CSS / modern CSS.
* **Backend:** Node.js, Express.js.
* **AI Model Integration:** Google Gemini REST API (`gemini-1.5-flash` / `gemini-1.5-pro`) via direct server-to-server `fetch` with automated retry logic for high-demand resilience.

---

## Project Structure
```text
├── backend/
│   ├── src/
│   │   ├── routes/api.js          # REST endpoints (/health, /generate, /regenerate, /verify, /export)
│   │   ├── services/generator.js  # Core orchestration (parsing, model calls, grounding check)
│   │   ├── services/llmClient.js  # Gemini API client with 503 high-demand retry handling
│   │   ├── services/validator.js  # Structural validation rules
│   │   ├── services/grounding.js  # Material grounding checks
│   │   └── server.js              # Express entry point & static asset serving
│   └── package.json
├── frontend/
│   ├── src/                       # React components & UI state management
│   └── package.json
└── README.md.
```
## Setup & Local Installation Instructions
To run this project locally for development or testing:

## Clone the Repository:

* **git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
* **cd your-repo-name

## Install Frontend Dependencies & Build:

* **cd frontend**
* **npm install**
* **npm run build**
* **cd ..**

## Install Backend Dependencies:

* **cd backend**
* **npm install**
## Configure Environment Variables:
Create a .env file inside the backend/ directory with:
Code snippet
PORT=4000
GEMINI_API_KEY=your_google_ai_studio_api_key_here
MODEL=gemini-1.5-flash
## Start the Application:

* **npm --prefix backend start**
Open your browser and navigate to http://localhost:4000.

## 📝 Architectural Decisions & Trade-Offs
1. Unified Monorepo Hosting vs. Separate Services
Decision: We chose to configure the Express backend to serve the compiled React dist folder directly (express.static + catch-all * routing).

Trade-Off: While separating frontend (e.g., Vercel) and backend (e.g., Render) is common, a unified single-service deployment eliminates CORS complexity, simplifies environment variable management, and ensures zero configuration drift between client and server.

2. Direct REST Integration with Gemini vs. Official SDK
Decision: We implemented direct server-side fetch calls to the Google Gemini REST API (generateContent) rather than relying on heavy wrapper SDKs.

Trade-Off: This gives us absolute granular control over timeouts (AbortSignal), payload formatting (systemInstruction, contents, generationConfig), and custom retry loops for handling 503 Service Unavailable capacity spikes gracefully.

3. Strict Material Validation & Grounding
Decision: The backend enforces strict validation rules (e.g., minimum character length, mandatory markdown code blocks, and automated grounding checks).

Trade-Off: This prevents the LLM from hallucinating questions detached from the study text, ensuring that every generated question is strictly supported by the provided source material.

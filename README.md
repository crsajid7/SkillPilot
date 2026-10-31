# SkillPilot AI — Universal Visual AI Skill Coach

> **See your work. Ask for guidance. Get better.**

[![License: MIT](https://img.shields.io/badge/License-MIT-gray.svg)](./LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React_19_+_TypeScript_+_Tailwind_CSS-black.svg)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js_+_Express-black.svg)](https://nodejs.org/)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Gemma_4_(gemma--4--26b--a4b--it)-lime.svg)](https://ai.google.dev/)

**SkillPilot AI** is a universal visual AI skills coach designed with a minimalist black textured interface. A user shows what they are working on through their physical webcam or shared screen, asks a question via speech or text, and receives concise, context-aware, actionable guidance.

---

## 📐 Product Philosophy & Aesthetic

* **Universal Domain Support**:
  * **Creative software**: DaVinci Resolve, Photoshop, Blender, coding IDEs, audio DAWs.
  * **Physical skills**: Guitar and instruments, handwriting, drawing, cooking, woodworking.
  * **Sports & movement**: Exercise technique, juggling, coordination, posture.
  * **Practical technical work**: Electronics, soldering, component assembly, mechanical repair.
* **Minimalist Black Textured Interface**:
  * Near-black palette (`#08090B`, `#0D0F12`, `#111317`) with subtle charcoal borders (`#24272D`) and restrained electric lime accenting (`#C8FF55`).
  * CSS/SVG fine-grain low-contrast texture overlay.
  * Precision layout with single-screen efficiency designed for desktop laptop viewports (1440 × 900).
* **Ground Truth & Honest AI**:
  * Strictly avoids fake sample feeds, synthetic skeleton overlays, or mock detections.
  * Captures real single-frame compressed JPEG snapshots when asking for guidance, avoiding high-bandwidth streaming overhead.
  * Never fakes AI responses when an API key is unconfigured; reports honest setup guidance.

---

## 🏗️ Architecture

```mermaid
graph LR
  User([User]) -->|Webcam / Screen Share / Voice / Text| Frontend[React Desktop Workspace :5173]
  Frontend -->|Snapshot JPEG + Question + Context| Backend[Express Backend :3001 /api/coach]
  Backend -->|Validate & Rate Limit| GenAIService[AI Coach Service]
  GenAIService -->|Model: gemma-4-26b-a4b-it| GoogleGenAI[@google/genai SDK]
  GoogleGenAI -->|Structured JSON| GenAIService
  GenAIService -->|Observation + Steps + Outcome + Uncertainty| Backend
  Backend -->|Structured Action Card| Frontend
  Frontend -->|Render Action Card| User
```

---

## ⚙️ Installation & Prerequisites

* **Node.js**: v20.0+ (Tested on Node v24.15.0)
* **npm**: v10.0+

### 1. Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/skillpilot-ai.git
cd skillpilot-ai

# Install root, backend, and frontend packages
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Server Environment

Copy the example environment template into `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Configure your environment variables in `backend/.env`:

```env
PORT=3001

# Your Google AI Studio API Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Target multimodal model
GEMINI_MODEL=gemma-4-26b-a4b-it

# Rate limiting
RATE_LIMIT_MAX=100
```

> [!IMPORTANT]
> The API key is stored exclusively on the server in `backend/.env`. It is never bundled, passed to the client, or committed to Git.

---

## 🚀 Running the Application

### Concurrently (Frontend + Backend)

From the project root:

```bash
npm run dev
```

* **Frontend Workspace**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:3001](http://localhost:3001)
* **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

### Running Separately

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

---

## 🧪 Testing Camera, Screen Sharing & Voice Input

1. **Launch the application**: Open [http://localhost:5173](http://localhost:5173).
2. **Camera Test**:
   * Click **"Camera"** in the empty workspace or top controls.
   * Accept the browser camera prompt.
   * Your live video stream will render at natural aspect ratio with live resolution telemetry.
   * Click **"Stop"** to verify that tracks are released cleanly.
3. **Screen Share Test**:
   * Click **"Share Screen"**.
   * Select a window (e.g. IDE, Blender, DaVinci Resolve) or entire screen.
   * Notice real-time preview. Stop share either in browser banner or with "Stop" button.
4. **Voice Input Test**:
   * Click the **Microphone** icon beside the question input.
   * Speak your query (e.g. *"How do I fix this solder joint?"*).
   * Speech is transcribed directly into the editable input. You can edit text before sending.
5. **Frame Analysis**:
   * With camera or screen sharing active, click **"Ask"** or press <kbd>Ctrl+Enter</kbd>.
   * A single high-resolution JPEG snapshot is captured and sent to `/api/coach`.
   * The coach returns a structured action card:
     * **Observation**: What is visible in the frame.
     * **Try This**: Up to 5 numbered, imperative steps.
     * **Expected Outcome**: Immediate tangible outcome.
     * **Uncertainty**: Target clarification if frame is ambiguous.
6. **Reference Panel**:
   * Click **"Reference"** in the top bar to attach a blueprint/schematic or open verified documentation URLs.

---

## ⚠️ Limitations & Notes

* **Single-Frame Analysis**: SkillPilot AI analyzes high-quality snapshots upon question submission. It does not stream continuous real-time video to Google's API to respect bandwidth and token costs.
* **Browser SpeechRecognition**: Voice transcription relies on the browser's Web Speech API. If unsupported in a specific browser, the editable text box serves as a reliable fallback.
* **Text-Only Responses**: SkillPilot AI delivers concise structured text action cards without synthetic AI voice synthesis.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

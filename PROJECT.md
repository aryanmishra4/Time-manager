# Aura - AI Productivity Companion
## Project Documentation & Specification

---

### 1. Problem Statement
Modern students, researchers, and professionals face a fragmented productivity ecosystem. While planning studies, tracking timers, structuring notes, and maintaining active recall flashcards are proven learning methodologies, they are usually split across disjointed tools (e.g., Todoist, Notion, Pomofocus, and Anki). 

This fragmented workflow leads to:
- **Cognitive Overload**: Constant context switching between tabs and tools destroys deep focus (flow state).
- **Plan-to-Action Friction**: Simply making a list of study chapters doesn't translate into actionable milestone steps without significant manual breakdown effort.
- **Underutilized Syllabus Content**: Static notes sit in folders instead of being actively transformed into active recall tests (flashcards) or prioritized schedules.
- **Lack of Adaptive Guidance**: Traditional study planners remain static and do not proactively advise students on where they should direct their focus based on immediate deadlines and note contents.

---

### 2. Solution Overview
**Aura AI** solves this fragmentation by uniting the core pillars of academic productivity into a single, fully-integrated, **Immersive Dark Space**. It leverages the state-of-the-art **Gemini 3.5 Flash** model via the **Google GenAI SDK** to act as a proactive academic coach that synchronizes information across four interactive modules:

1. **Aura Focus Arena (Pomodoro)**: A highly-stylized focus clock featuring a custom Web Audio API synthesizer for clean chiming signals. It links directly to any task in your planning board, allowing you to track deep focus sessions paired with direct academic targets.
2. **Aura Action Planner (Task Decomposition)**: A smart study list where a user can enter raw, high-level learning goals. With a single click of the "AI Steps" trigger, Aura decomposes high-level goals into bite-sized actionable milestones.
3. **Active Study Deck (Dynamic Recall)**: An auto-generating flashcard engine. Aura instantly parses any syllabus topic, raw reference list, or subject matter to forge active recall study decks featuring 3D card-flip animations and retention progress metrics.
4. **Interactive Syllabus Notepad**: A unified drafting board. Aura organizes raw note drafts into structured study guides and translates them into actionable planners at the tap of a button.
5. **Academic Coaching Companion (Aura Coach)**: A persistent coaching sidebar that performs real-time semantic analysis over current pending tasks and notebook categories to output tailored focus tips, motivation micro-quotes, and high-priority session plans.

---

### 3. Core Architecture & Workflow Diagrams

#### High-Level System Architecture
```
                                +-----------------------------------+
                                |            User Client            |
                                |       (Vite + React + Tailwind)   |
                                +-----------------------------------+
                                  |     ^        |     ^        |     ^
               (Task Planner API) |     |        |     |        |     | (Coaching API)
                                  v     |        |     |        v     |
  +---------------------------------------+      |     |      +---------------------+
  |             Express Backend           |      |     |      |  Web Audio Engine   |
  |               (server.ts)             |      |     |      |  (Synth Bell / Tick)|
  +---------------------------------------+      |     |      +---------------------+
                     |                           |     |
     (Google GenAI)  |                           |     | (Active State Memory)
                     v                           v     v
  +---------------------------------------------------------------------------------+
  |                            Google Gemini 3.5 Flash                              |
  |           Decompose Steps | Generate Recall Cards | Analyze Schedules           |
  +---------------------------------------------------------------------------------+
```

#### Workflow 1: AI Task Decomposition & Milestone Planning
```
 [User creates task] -> [Triggers "AI Steps"] -> [POST request to /api/ai/suggest-subtasks]
                                                                |
 [Aura App Planner] <--- [Populates micro-milestones] <--- [Gemini return structured JSON]
```

#### Workflow 2: Active Recall Card Generation
```
 [User inputs study topic] -> [Triggers "AI Create"] -> [POST to /api/ai/generate-flashcards]
                                                                |
 [Recall Deck Library] <--- [Adds custom study deck] <--- [Gemini outputs Q&A schema]
```

---

### 4. Key Features
- **Immersive Dark Theme**: Designed specifically to optimize eye-comfort during deep-focus study blocks, using rich translucent glassmorphism panels and radiant orange focal markers.
- **Interactive Pomodoro**: Dynamic timing controls supporting deep work, short breaks, and long breaks with progress circular trackers and audio-synthesized chimes.
- **Smart Priority Sorter**: Algorithmic sorting matching task deadlines against high priority, so urgent academic reviews never slip through the cracks.
- **Active Recall Engine**: 3D flip-cards with automated progress grading (Practice Needed, Getting There, Mastered).
- **Proactive AI Companion Chat**: A persistent sidebar facilitating deep academic queries, exam preparation advice, and stress mitigation coaching.

---

### 5. Technologies Used
- **Frontend Core**: React 19, TypeScript, Vite
- **Styling Architecture**: Tailwind CSS 4 with custom glassmorphism layers and neon focal shadows
- **Interactive Elements & Micro-Animations**: Lucide React Icons
- **Synthesized Audio Feed**: HTML5 Web Audio API (real-time sine/triangle wave osc chimes)
- **Backend Architecture**: Node.js, Express, tsx, esbuild bundling

---

### 6. Google Technologies Utilized
- **Google Gemini 3.5 Flash (`gemini-3.5-flash`)**: Selected for its blazing-fast sub-second latency, robust reasoning, and perfect fidelity outputting highly strict JSON formats.
- **Google GenAI SDK (`@google/genai`)**: Utilized to facilitate structured model declarations, system coaching guidance parameters, and type-safe query formats.
- **Google Cloud Run (Platform Ingress)**: Serving the production companion app seamlessly with isolated secure container headers and auto-scaling.

---

### 7. Google Doc Submission Guide
To submit your details directly into a shared Google Doc:
1. **Open Google Docs** (docs.google.com) and create a new document.
2. **Copy the formatted Markdown content** from this `PROJECT.md` file (or directly from the final response text).
3. **Paste it into your Google Doc**. (Google Docs natively supports formatting on paste).
4. **Set sharing permissions**: Click **Share** in the top-right corner -> Change under General Access to **"Anyone with the link"** -> Set role to **"Viewer"** or **"Editor"**.
5. Copy the generated link and submit it for your evolution period tracking!

# RAG × Cybersecurity — CAISP Platform

An interactive demo platform showing how **Retrieval-Augmented Generation (RAG)** improves LLM responses in cybersecurity workflows. Toggle RAG on/off in real time and feel the difference between a grounded answer and a base-knowledge guess.

Built with **TypeScript + Vite**, powered by a local **Ollama** model — no cloud APIs, no data leaves your machine.

---

## Preview

> Login → Dashboard → Open the chat assistant → Ask a security question with RAG ON vs OFF

![Tech Stack](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-local-black?style=flat)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?style=flat&logo=threedotjs)

---

## Features

### RAG Chat Assistant
- **RAG ON** — retrieves the top-3 most relevant knowledge chunks, injects them as context into the LLM prompt, and returns a cited answer with a confidence score
- **RAG OFF** — sends your question directly to the model with no retrieval, so you can compare answer quality
- Keyword-based retrieval with stop-word filtering and TF-style scoring
- Markdown rendering (code blocks, lists, bold/italic, headings)
- Real-time loading indicator while Ollama is generating

### Dashboard
- 5-step RAG pipeline visualisation (Query → Retrieve → Augment → Generate → Response)
- Knowledge base browser — 15+ cybersecurity topic cards (SOC, CVE research, malware analysis, red teaming, compliance, and more)
- One-click example queries that pre-fill the chat

### UI / UX
- Cappuccino design system — warm dark theme (`#D6B588` gold · `#422701` chocolate · `#0a0604` deep black)
- Three.js animated brain background
- Neumorphic chat FAB button with 3D hover tilt
- Back-to-top button with smooth scroll
- Themed scrollbar (gold-on-dark)
- Hash-based SPA router — no server-side routing needed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript ~5.9 |
| Build tool | Vite ^8.0 |
| 3D graphics | Three.js ^0.183 |
| LLM inference | Ollama (local) |
| Default model | `qwen2.5:3b` |
| Styling | Vanilla CSS (custom design system) |
| Routing | Custom hash-based SPA router |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Ollama](https://ollama.com/) installed and running locally

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Aditya-kukreti-ba/RAG-tester.git
cd RAG-tester

# 2. Install dependencies
npm install

# 3. Pull the model (first time only)
ollama pull qwen2.5:3b

# 4. Start Ollama
ollama serve

# 5. Start the dev server
npm run dev
```

Open `http://localhost:5173` (or whichever port Vite picks).

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@caisp.ai` | `admin123` |
| Student | `student@caisp.ai` | `student123` |

---

## Using the Chat

1. Click the **coffee-bot button** in the bottom-right corner
2. Leave **RAG ON** (default) and ask a security question
3. See the retrieved sources + confidence score below the answer
4. Toggle **RAG OFF** and ask the same question — compare the difference

### Example questions
- *What is RAG used for in a SOC?*
- *How does RAG help with CVE research?*
- *Explain prompt injection attacks*
- *How does malware analysis use RAG?*

---

## Changing the Model

Open `src/components/rag-chat.ts` and update line 9:

```ts
const OLLAMA_MODEL = 'qwen2.5:3b'; // change to any installed model
```

Any model available via `ollama list` works — e.g. `mistral`, `llama2`, `phi3`, `deepseek-r1`.

---

## Project Structure

```
caisp-platform/
├── public/
│   ├── chatbot1.png        # FAB button icon
│   ├── brain-bg.html       # Three.js brain animation (iframe)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── rag-chat.ts     # Chat panel, retrieval logic, Ollama API
│   ├── views/
│   │   ├── dashboard.ts    # Dashboard layout & knowledge base
│   │   └── login.ts        # Login form
│   ├── data.ts             # Knowledge base (15+ cybersecurity chunks)
│   ├── router.ts           # Hash-based SPA router
│   ├── store.ts            # Auth state & RAG toggle state
│   ├── main.ts             # App entry point
│   └── style.css           # Full design system
├── index.html
├── package.json
└── tsconfig.json
```

---

## Build for Production

```bash
npm run build   # TypeScript compile + Vite bundle → dist/
npm run preview # Serve the production build locally
```

---

## How RAG Works (in this app)

1. **Query** — user types a question
2. **Retrieve** — each knowledge chunk is scored by counting how many query words appear in its title, content, and keywords (keyword matches get a 3× bonus); top-3 chunks are selected
3. **Augment** — retrieved chunks are prepended to the system prompt as `--- RETRIEVED CONTEXT ---`
4. **Generate** — Ollama runs `qwen2.5:3b` with the augmented prompt
5. **Response** — the answer is returned with source titles and a confidence score (mapped from the retrieval score to 60–99%)

---

## License

MIT

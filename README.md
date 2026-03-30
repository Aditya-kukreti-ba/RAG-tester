# RAG × Cybersecurity — CAISP Platform

An interactive demo platform showing how **Retrieval-Augmented Generation (RAG)** improves LLM responses in cybersecurity workflows. Toggle RAG on/off in real time and feel the difference between a grounded answer and a base-knowledge guess.

Built with **TypeScript + Vite**, powered by **WebLLM** — the model runs entirely in your browser via WebGPU. No server, no API, no data leaves your machine.

🚀 **Live Demo → [https://caisp-platform.vercel.app](https://caisp-platform.vercel.app)**

---

## Preview

> Login → Dashboard → Open the chat assistant → Ask a security question with RAG ON vs OFF

![Tech Stack](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite&logoColor=white)
![WebLLM](https://img.shields.io/badge/WebLLM-in--browser-orange?style=flat)
![WebGPU](https://img.shields.io/badge/WebGPU-enabled-green?style=flat)
![Three.js](https://img.shields.io/badge/Three.js-0.183-black?style=flat&logo=threedotjs)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat&logo=vercel)

---

## How it works (no server required)

The LLM runs **directly in the browser tab** using [WebLLM](https://github.com/mlc-ai/web-llm) and WebGPU — there is no backend, no Ollama server, and no cloud API call. On first visit the model (~400 MB) is downloaded and cached in your browser; every subsequent visit loads instantly from cache.

```
First visit  → model downloads once → cached in browser
Every visit  → model loads from cache into GPU (~5–15 s warm-up)
Chat open    → inference runs locally on your GPU, zero network calls
```

---

## Features

### RAG Chat Assistant
- **RAG ON** — retrieves the top-3 most relevant knowledge chunks, injects them as context into the LLM prompt, and returns a cited answer with a confidence score
- **RAG OFF** — sends your question directly to the model with no retrieval, so you can compare answer quality side-by-side
- Keyword-based retrieval with stop-word filtering and TF-style scoring
- Markdown rendering (code blocks, lists, bold/italic, headings)
- Real-time streaming progress bar while the model initialises

### Dashboard
- 5-step RAG pipeline visualisation (Query → Retrieve → Augment → Generate → Response)
- Knowledge base browser — 15+ cybersecurity topic cards (SOC, CVE research, malware analysis, red teaming, compliance, and more)
- One-click example queries that pre-fill the chat

### UI / UX
- Cappuccino design system — warm dark theme (`#D6B588` gold · `#422701` chocolate · `#0a0604` deep black)
- Three.js animated brain background
- Custom robot chatbot FAB with neumorphic 3D hover tilt effect
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
| LLM inference | WebLLM (in-browser, WebGPU) |
| Default model | `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` |
| Styling | Vanilla CSS (custom design system) |
| Routing | Custom hash-based SPA router |
| Hosting | Vercel (static, free tier) |

---

## Browser Requirements

WebLLM requires **WebGPU** support:

| Browser | Supported |
|---|---|
| Chrome 113+ | ✅ |
| Edge 113+ | ✅ |
| Firefox | ❌ (no WebGPU yet) |
| Safari | ⚠️ Experimental (enable in flags) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- That's it — no Ollama, no Python, no backend

---

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/Aditya-kukreti-ba/RAG-tester.git
cd RAG-tester

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in Chrome or Edge.

On first open, the model will download to your browser cache (~400 MB). This only happens once.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@caisp.ai` | `admin123` |
| Student | `student@caisp.ai` | `student123` |

---

## Using the Chat

1. Click the **robot bot button** in the bottom-right corner
2. Wait for the model to load (first time only — progress bar shown)
3. Leave **RAG ON** (default) and ask a security question
4. See the retrieved sources + confidence score below the answer
5. Toggle **RAG OFF** and ask the same question — compare the difference

### Example questions
- *What is RAG used for in a SOC?*
- *How does RAG help with CVE research?*
- *Explain prompt injection attacks*
- *How does malware analysis use RAG?*

---

## Changing the Model

Open `src/components/rag-chat.ts` and update line 9:

```ts
const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'; // change to any WebLLM model
```

Any model from the [WebLLM model list](https://github.com/mlc-ai/web-llm/blob/main/src/config.ts) works. Larger models need more VRAM:

| Model | Size | VRAM needed |
|---|---|---|
| `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | ~400 MB | ~1 GB |
| `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | ~900 MB | ~2 GB |
| `Qwen2.5-3B-Instruct-q4f16_1-MLC` | ~1.5 GB | ~4 GB |
| `Llama-3.2-1B-Instruct-q4f16_1-MLC` | ~700 MB | ~2 GB |

---

## Project Structure

```
caisp-platform/
├── public/
│   ├── Chatbot.png         # Robot chat FAB icon
│   ├── chatbot1.png        # Chat button icon (command style)
│   ├── brain-bg.html       # Three.js brain animation (iframe)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── rag-chat.ts     # Chat panel, retrieval logic, WebLLM inference
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

### Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deploys on every push.

---

## How RAG Works (in this app)

1. **Query** — user types a question
2. **Retrieve** — each knowledge chunk is scored by counting how many query words appear in its title, content, and keywords (keyword matches get a 3× bonus); top-3 chunks are selected
3. **Augment** — retrieved chunks are prepended to the system prompt as `--- RETRIEVED CONTEXT ---`
4. **Generate** — WebLLM runs `Qwen2.5-0.5B` entirely in-browser via WebGPU with the augmented prompt
5. **Response** — the answer is returned with source titles and a confidence score (mapped from the retrieval score to 60–99%)

---

## License

MIT

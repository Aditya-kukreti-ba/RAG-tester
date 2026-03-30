/* ═══════════════════════════════════════════════════════════
   RAG Chat — Ollama-powered assistant with live retrieval
   ═══════════════════════════════════════════════════════════ */
import { isRagEnabled, setRagEnabled } from '../store';
import { KNOWLEDGE_BASE, type KnowledgeChunk } from '../data';

/* ── Config ─────────────────────────────────────────────── */
const OLLAMA_BASE  = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen2.5:3b'; // Change to your installed model, e.g. 'mistral', 'phi3', 'llama2'
const TOP_K        = 3;          // How many chunks to retrieve

/* ── Types ───────────────────────────────────────────────── */
interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
    sources?: string[];
    confidence?: number;
    isError?: boolean;
    isLoading?: boolean;
}

interface RetrievedChunk {
    chunk: KnowledgeChunk;
    score: number;
}

/* ── Retrieval ───────────────────────────────────────────── */
/**
 * Keyword-based retrieval: scores each chunk by how many query
 * words appear in its title + content + keywords, then returns top-K.
 */
function retrieve(query: string, topK: number = TOP_K): RetrievedChunk[] {
    const stopWords = new Set(['the','a','an','is','are','was','were','be','been',
        'have','has','had','do','does','did','will','would','could','should',
        'may','might','shall','can','need','dare','ought','used','what','how',
        'why','when','where','who','which','that','this','these','those','it',
        'its','in','on','at','to','for','of','and','or','but','not','with','as']);

    const queryWords = query.toLowerCase()
        .split(/\W+/)
        .filter(w => w.length > 2 && !stopWords.has(w));

    if (queryWords.length === 0) return [];

    const scored = KNOWLEDGE_BASE.map(chunk => {
        const haystack = [
            chunk.title,
            chunk.content,
            ...chunk.keywords,
        ].join(' ').toLowerCase();

        let score = 0;
        for (const word of queryWords) {
            // Exact keyword match gets a bonus
            if (chunk.keywords.includes(word)) score += 3;
            // Count occurrences in full text
            const re = new RegExp(`\\b${word}`, 'g');
            score += (haystack.match(re) || []).length;
        }

        // Slight normalisation so longer docs don't dominate
        const wordCount = haystack.split(/\s+/).length;
        const normScore = (score / queryWords.length) * (100 / wordCount);
        return { chunk, score: normScore };
    });

    return scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
}

/* ── Ollama API ──────────────────────────────────────────── */
async function ollamaChat(
    messages: Array<{ role: string; content: string }>,
): Promise<string> {
    let res: Response;
    try {
        res = await fetch(`${OLLAMA_BASE}/api/chat`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
        });
    } catch {
        throw new Error(
            `Cannot reach Ollama at ${OLLAMA_BASE}. ` +
            `Make sure it is running: <code>ollama serve</code>`,
        );
    }

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(
            `Ollama returned HTTP ${res.status}. ` +
            (body.includes('model') ? `Model <code>${OLLAMA_MODEL}</code> not found — run <code>ollama pull ${OLLAMA_MODEL}</code>` : body),
        );
    }

    const data = await res.json();
    return data.message?.content ?? '(empty response)';
}

/* ── Query handler ───────────────────────────────────────── */
async function handleQuery(
    query: string,
    ragEnabled: boolean,
): Promise<{ text: string; sources?: string[]; confidence?: number }> {

    if (ragEnabled) {
        /* --- RAG mode ---- */
        const results = retrieve(query);

        if (results.length === 0) {
            /* No relevant chunks — still use Ollama but without injected context */
            const text = await ollamaChat([
                {
                    role: 'system',
                    content:
                        'You are a knowledgeable cybersecurity and AI assistant. ' +
                        'No relevant documents were found in the knowledge base for this query, so use your own expertise. ' +
                        'Be conversational, helpful, and accurate.',
                },
                { role: 'user', content: query },
            ]);
            return { text, sources: [], confidence: 0 };
        }

        /* Build context block from retrieved chunks */
        const context = results
            .map(r => `### ${r.chunk.title}\n${r.chunk.content}`)
            .join('\n\n');

        /* Rough confidence: map normalised score to [0.60, 0.99] */
        const maxScore   = results[0].score;
        const confidence = Math.min(0.99, 0.60 + Math.min(maxScore * 4, 0.39));

        const text = await ollamaChat([
            {
                role: 'system',
                content:
                    'You are a cybersecurity and AI assistant. Use the retrieved context documents below to ground your answer. ' +
                    'You may supplement with your own knowledge when helpful, but prioritise the context for accuracy. ' +
                    'Be conversational, clear, and helpful.\n\n' +
                    '--- RETRIEVED CONTEXT ---\n' + context + '\n--- END CONTEXT ---',
            },
            { role: 'user', content: query },
        ]);

        return {
            text,
            sources:    results.map(r => r.chunk.title),
            confidence,
        };

    } else {
        /* --- Basic (no-RAG) mode ---- */
        const text = await ollamaChat([
            {
                role: 'system',
                content: 'You are a knowledgeable cybersecurity and AI assistant. Chat naturally — answer any question helpfully and conversationally. You have deep expertise in threat intelligence, RAG systems, incident response, malware analysis, and AI security.',
            },
            { role: 'user', content: query },
        ]);
        return { text };
    }
}

/* ── Component state ─────────────────────────────────────── */
let messages: ChatMessage[] = [];
let isOpen    = false;
let isWaiting = false;   // true while Ollama request is in flight

/* ── Render ──────────────────────────────────────────────── */
function getHTML(): string {
    const ragOn = isRagEnabled();

    const messagesHTML = messages.map(m => {
        if (m.role === 'user') {
            return `<div class="msg msg--user">${escHtml(m.text)}</div>`;
        }

        if (m.isLoading) {
            return `<div class="msg msg--ai msg--loading">
                        <span class="dot-flashing"></span> Thinking…
                    </div>`;
        }

        let extra = '';
        if (!m.isError && m.sources !== undefined) {
            if (m.sources.length > 0) {
                extra += `<div class="msg__sources">
                    <strong>Sources (${m.sources.length}):</strong><br/>
                    ${m.sources.map(s => `<span class="msg__source-tag">${escHtml(s)}</span>`).join('')}
                    ${m.confidence !== undefined
                        ? `<div class="msg__confidence">⚡ Confidence: ${Math.round(m.confidence * 100)}%</div>`
                        : ''}
                </div>`;
            } else {
                extra += `<div class="msg__sources" style="opacity:.5;font-size:12px;">
                    No relevant chunks found — answered from model's base knowledge.
                </div>`;
            }
        }

        const cls = m.isError ? 'msg msg--ai msg--error' : 'msg msg--ai';
        const body = m.isError ? escHtml(m.text) : renderMarkdown(m.text);
        return `<div class="${cls}"><div class="msg__body">${body}</div>${extra}</div>`;
    }).join('');

    const placeholder = ragOn
        ? 'Ask anything — RAG will retrieve context…'
        : 'Ask anything — direct Ollama query…';

    return `
    <!-- FAB -->
    <button class="rag-fab" id="rag-fab" title="AI Assistant">
        <div class="rag-fab__content">
            <div class="rag-fab__indicator"></div>
        </div>
    </button>

    <!-- Overlay -->
    <div class="rag-overlay ${isOpen ? 'rag-overlay--visible' : ''}" id="rag-overlay"></div>

    <!-- Panel -->
    <div class="rag-panel ${isOpen ? 'rag-panel--open' : ''}" id="rag-panel">

        <div class="rag-panel__header">
            <span class="rag-panel__title">🤖 RAG Assistant <small style="font-size:11px;opacity:.5;">${OLLAMA_MODEL}</small></span>
            <button class="rag-panel__close" id="rag-close">✕</button>
        </div>

        <div class="rag-panel__toggle-bar">
            <div class="rag-status ${ragOn ? 'rag-status--on' : ''}" id="rag-status">
                <span class="rag-status__dot"></span>
                <span>RAG ${ragOn ? 'ON' : 'OFF'}</span>
            </div>
            <div class="toggle ${ragOn ? 'toggle--active' : ''}" id="rag-toggle">
                <span class="toggle__label">RAG</span>
                <div class="toggle__track"><div class="toggle__thumb"></div></div>
            </div>
        </div>

        <div class="rag-panel__messages" id="rag-messages">
            ${messages.length === 0 ? `
                <div class="msg msg--ai msg--welcome">
                    <div class="msg__welcome-icon">🤖</div>
                    <div class="msg__body">
                        ${renderMarkdown(`Hey! I'm your **cybersecurity + RAG** assistant, running on \`${OLLAMA_MODEL}\` locally.\n\n**RAG ON** — I search the knowledge base first and ground my answer with retrieved docs + sources.\n\n**RAG OFF** — I chat directly from my own knowledge, no retrieval.\n\nAsk me anything — security questions, RAG concepts, CVEs, threats, or just chat 💬`)}
                    </div>
                </div>
            ` : messagesHTML}
        </div>

        <div class="rag-panel__input">
            <input type="text" id="rag-input" placeholder="${placeholder}" ${isWaiting ? 'disabled' : ''} />
            <button id="rag-send" ${isWaiting ? 'disabled' : ''}>→</button>
        </div>
    </div>
    `;
}

/* ── Helpers ─────────────────────────────────────────────── */
function escHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Lightweight markdown → HTML renderer.
 * Handles: headings, bold, italic, inline code, code blocks,
 * ordered lists, unordered lists, horizontal rules, paragraphs.
 */
function renderMarkdown(raw: string): string {
    const lines = raw.split('\n');
    const out: string[] = [];
    let inUl = false;
    let inOl = false;
    let inCode = false;
    let codeLines: string[] = [];

    function closeList() {
        if (inUl) { out.push('</ul>'); inUl = false; }
        if (inOl) { out.push('</ol>'); inOl = false; }
    }

    function inlineFormat(text: string): string {
        return text
            // inline code (must come before bold/italic)
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // bold
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            // italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>');
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ── fenced code block ──────────────────────────
        if (line.trim().startsWith('```')) {
            if (!inCode) {
                closeList();
                inCode = true;
                codeLines = [];
            } else {
                out.push(`<pre><code>${escHtml(codeLines.join('\n'))}</code></pre>`);
                inCode = false;
                codeLines = [];
            }
            continue;
        }
        if (inCode) { codeLines.push(line); continue; }

        // ── horizontal rule ────────────────────────────
        if (/^[-*_]{3,}$/.test(line.trim())) {
            closeList();
            out.push('<hr/>');
            continue;
        }

        // ── headings ───────────────────────────────────
        const h3 = line.match(/^###\s+(.*)/);
        const h2 = line.match(/^##\s+(.*)/);
        const h1 = line.match(/^#\s+(.*)/);
        if (h1 || h2 || h3) {
            closeList();
            const lvl = h3 ? 3 : h2 ? 2 : 1;
            const text = (h3 || h2 || h1)![1];
            out.push(`<h${lvl} class="md-h${lvl}">${inlineFormat(escHtml(text))}</h${lvl}>`);
            continue;
        }

        // ── unordered list ─────────────────────────────
        const ulMatch = line.match(/^[\-\*\+]\s+(.*)/);
        if (ulMatch) {
            if (inOl) { out.push('</ol>'); inOl = false; }
            if (!inUl) { out.push('<ul class="md-ul">'); inUl = true; }
            out.push(`<li>${inlineFormat(escHtml(ulMatch[1]))}</li>`);
            continue;
        }

        // ── ordered list ───────────────────────────────
        const olMatch = line.match(/^\d+\.\s+(.*)/);
        if (olMatch) {
            if (inUl) { out.push('</ul>'); inUl = false; }
            if (!inOl) { out.push('<ol class="md-ol">'); inOl = true; }
            out.push(`<li>${inlineFormat(escHtml(olMatch[1]))}</li>`);
            continue;
        }

        // ── blank line ─────────────────────────────────
        if (line.trim() === '') {
            closeList();
            out.push('<div class="md-spacer"></div>');
            continue;
        }

        // ── regular paragraph line ─────────────────────
        closeList();
        out.push(`<p class="md-p">${inlineFormat(escHtml(line))}</p>`);
    }

    closeList();
    if (inCode) out.push(`<pre><code>${escHtml(codeLines.join('\n'))}</code></pre>`);

    return out.join('');
}

function scrollToBottom(): void {
    const el = document.getElementById('rag-messages');
    if (el) el.scrollTop = el.scrollHeight;
}

/* ── Mount / bind ────────────────────────────────────────── */
function mount(): void {
    let container = document.getElementById('rag-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'rag-container';
        document.body.appendChild(container);
    }
    container.innerHTML = getHTML();
    bindEvents();
}

function bindEvents(): void {
    const fab = document.getElementById('rag-fab');

    /* 3-D tilt on mousemove */
    fab?.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width  / 2);   // -1 → 1
        const dy = (e.clientY - cy) / (rect.height / 2);   // -1 → 1
        const rotX = -dy * 22;
        const rotY =  dx * 22;
        (e.currentTarget as HTMLElement).style.transform =
            `perspective(300px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.12)`;
    });

    fab?.addEventListener('mouseleave', (e: MouseEvent) => {
        (e.currentTarget as HTMLElement).style.transform = '';
    });

    fab?.addEventListener('click', () => {
        isOpen = true;
        mount();
        setTimeout(() => document.getElementById('rag-input')?.focus(), 350);
    });

    document.getElementById('rag-close')?.addEventListener('click', () => {
        isOpen = false; mount();
    });

    document.getElementById('rag-overlay')?.addEventListener('click', () => {
        isOpen = false; mount();
    });

    document.getElementById('rag-toggle')?.addEventListener('click', () => {
        setRagEnabled(!isRagEnabled()); mount();
    });

    const input   = document.getElementById('rag-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('rag-send');

    async function handleSend() {
        if (!input || !input.value.trim() || isWaiting) return;
        const query = input.value.trim();
        input.value = '';

        /* Add user bubble */
        messages.push({ role: 'user', text: query });

        /* Add loading placeholder */
        const loadingIdx = messages.length;
        messages.push({ role: 'ai', text: '', isLoading: true });

        isWaiting = true;
        mount();
        scrollToBottom();

        try {
            const result = await handleQuery(query, isRagEnabled());
            /* Replace loading placeholder with real answer */
            messages[loadingIdx] = {
                role:       'ai',
                text:       result.text,
                sources:    result.sources,
                confidence: result.confidence,
            };
        } catch (err) {
            messages[loadingIdx] = {
                role:    'ai',
                text:    (err as Error).message,
                isError: true,
            };
        } finally {
            isWaiting = false;
            mount();
            scrollToBottom();
        }
    }

    sendBtn?.addEventListener('click', handleSend);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSend(); });
}

/* ── Public init ─────────────────────────────────────────── */
export function initRagChat(): void {
    mount();
    window.addEventListener('caisp:view-mounted', () => mount());
}

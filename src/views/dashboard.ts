/* ═══════════════════════════════════════════════════════════
   Dashboard — RAG × Cybersecurity Demo
   ═══════════════════════════════════════════════════════════ */
import { getUser } from '../store';
import { KNOWLEDGE_BASE } from '../data';

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? '')
        .join('');
}

function renderNav(): string {
    const user = getUser();
    void getInitials(user?.name || 'U'); // reserved for avatar
    return `
    <nav class="nav" id="main-nav">
        <a class="nav__logo" href="#/dashboard">
            <div class="nav__logo-icon">R</div>
            <span class="nav__logo-text">RAG × CyberSec</span>
        </a>
        <ul class="nav__links">
            <li>
                <button class="nav__link nav__user-btn" id="nav-logout" title="Sign out">
                    <svg class="nav__logout-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                </button>
            </li>
        </ul>
    </nav>
    `;
}

export function renderDashboard(): string {
    const steps = [
        { icon: '💬', label: 'Query',     desc: 'You ask a security question' },
        { icon: '🔍', label: 'Retrieve',  desc: 'Top-K chunks fetched from knowledge base' },
        { icon: '📄', label: 'Augment',   desc: 'Context injected into LLM prompt' },
        { icon: '🤖', label: 'Generate',  desc: 'Qwen2.5-3B answers with grounded context via WebGPU' },
        { icon: '✅', label: 'Response',  desc: 'Cited answer with confidence score' },
    ];

    const stepsHTML = steps.map((s, i) => `
        <div class="rag-step">
            <div class="rag-step__icon">${s.icon}</div>
            <div class="rag-step__body">
                <div class="rag-step__label">${s.label}</div>
                <div class="rag-step__desc">${s.desc}</div>
            </div>
            ${i < steps.length - 1 ? '<div class="rag-step__arrow">→</div>' : ''}
        </div>
    `).join('');

    const kbCards = KNOWLEDGE_BASE.map(chunk => `
        <div class="kb-card" title="${chunk.content.slice(0, 140)}…">
            <div class="kb-card__icon">${chunk.icon}</div>
            <div class="kb-card__body">
                <div class="kb-card__title">${chunk.title}</div>
                <div class="kb-card__desc">${chunk.description}</div>
                <div class="kb-card__tags">
                    ${chunk.keywords.slice(0, 3).map(k => `<span class="kb-tag">${k}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    return `
    ${renderNav()}
    <div class="page">
        <div class="page__content anim-fade-in">

            <!-- Hero -->
            <div class="db-hero">
                <div class="db-hero__label">Retrieval-Augmented Generation</div>
                <h1 class="db-hero__title">RAG <span class="db-hero__x">×</span> Cybersecurity</h1>
                <p class="db-hero__sub">
                    See how grounding a local LLM with a cybersecurity knowledge base changes the quality of answers.
                    Toggle <strong>RAG ON/OFF</strong> in the chat to feel the difference live.
                </p>
            </div>

            <!-- Pipeline -->
            <div class="db-section glass-thin">
                <div class="db-section__head">
                    <span class="db-section__icon">⚡</span>
                    <span class="db-section__title">How it works</span>
                </div>
                <div class="rag-pipeline">${stepsHTML}</div>
            </div>

            <!-- Knowledge Base -->
            <div class="db-section glass-thin">
                <div class="db-section__head">
                    <span class="db-section__icon">📚</span>
                    <span class="db-section__title">Knowledge Base</span>
                    <span class="db-section__badge">${KNOWLEDGE_BASE.length} docs</span>
                </div>
                <div class="kb-grid">${kbCards}</div>
            </div>

            <!-- Try It -->
            <div class="db-section glass-thin">
                <div class="db-section__head">
                    <span class="db-section__icon">🚀</span>
                    <span class="db-section__title">Try It</span>
                </div>
                <ul class="try-list">
                    <li>Click the <strong>🤖 button</strong> at the bottom-right to open the assistant</li>
                    <li><strong>RAG ON</strong> — retrieves relevant docs → feeds as context to <code>Qwen2.5-3B</code> → shows sources + confidence</li>
                    <li><strong>RAG OFF</strong> — sends your question directly to <code>Qwen2.5-3B</code> with no context</li>
                </ul>
                <div class="try-examples">
                    <span class="try-chip">What is RAG used for in a SOC?</span>
                    <span class="try-chip">How does RAG help with CVE research?</span>
                    <span class="try-chip">Explain prompt injection attacks</span>
                    <span class="try-chip">How does malware analysis use RAG?</span>
                </div>
                <div class="try-note">
                    ⚡ Model runs fully in your browser via <strong>WebGPU</strong> &nbsp;·&nbsp; No server needed &nbsp;·&nbsp; <code>Qwen2.5-3B-Instruct</code>
                </div>
            </div>

        </div>
    </div>

    <!-- Back to Top -->
    <button class="back-top-btn" id="back-top-btn" aria-label="Back to top">
        <svg class="back-top-icon" viewBox="0 0 384 512">
            <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
        </svg>
    </button>
    `;
}

export function initDashboard(): void {
    document.getElementById('nav-logout')?.addEventListener('click', () => {
        import('../store').then(({ logoutUser }) => logoutUser());
    });

    /* Back to Top button */
    const backTopBtn = document.getElementById('back-top-btn');
    if (backTopBtn) {
        const onScroll = () => {
            backTopBtn.classList.toggle('back-top-btn--visible', window.scrollY > 300);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        backTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* Clicking a try-chip pre-fills the chat */
    document.querySelectorAll('.try-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const input = document.getElementById('rag-input') as HTMLInputElement | null;
            if (input) {
                input.value = (chip as HTMLElement).innerText;
                input.focus();
            }
            /* Open panel if closed */
            const panel = document.getElementById('rag-panel');
            if (panel && !panel.classList.contains('rag-panel--open')) {
                (document.getElementById('rag-fab') as HTMLElement)?.click();
                setTimeout(() => {
                    const inp = document.getElementById('rag-input') as HTMLInputElement | null;
                    if (inp) inp.value = (chip as HTMLElement).innerText;
                }, 400);
            }
        });
    });
}

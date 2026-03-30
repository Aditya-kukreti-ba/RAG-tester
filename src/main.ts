/* ═══════════════════════════════════════════════════════════
   RAG Demo — Main Entry Point
   ═══════════════════════════════════════════════════════════ */
import './style.css';
import { addRoute, initRouter } from './router';
import { renderLogin, initLogin } from './views/login';
import { renderDashboard, initDashboard } from './views/dashboard';
import { initRagChat } from './components/rag-chat';

/* ── Routes ── */
addRoute('/login',     () => renderLogin(),    false);
addRoute('/dashboard', () => renderDashboard(), true);

/* ── View Init Hooks ── */
window.addEventListener('caisp:view-mounted', (e) => {
    const { path } = (e as CustomEvent).detail;
    if (path === '/login')     initLogin();
    else if (path === '/dashboard') initDashboard();
});

/* ── Boot ── */
initRouter();
initRagChat();

/* ═══════════════════════════════════════════════════════════
   Store — LocalStorage-backed State Management
   ═══════════════════════════════════════════════════════════ */

export interface UserState {
    email: string;
    name: string;
    loggedIn: boolean;
}

const KEYS = {
    USER: 'caisp_user',
    RAG:  'caisp_rag_enabled',
} as const;

/* ── User Auth ── */
export function getUser(): UserState | null {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
}

export function loginUser(email: string, password: string): UserState | null {
    const valid =
        (email === 'admin@caisp.ai' && password === 'admin123') ||
        (email === 'student@caisp.ai' && password === 'student123');
    if (!valid) return null;

    const user: UserState = {
        email,
        name: email === 'admin@caisp.ai' ? 'Dr. Alex Mercer' : 'Jordan Blake',
        loggedIn: true,
    };
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('caisp:auth-change'));
    return user;
}

export function logoutUser(): void {
    localStorage.removeItem(KEYS.USER);
    window.dispatchEvent(new CustomEvent('caisp:auth-change'));
}

/* ── RAG Toggle ── */
export function isRagEnabled(): boolean {
    return localStorage.getItem(KEYS.RAG) !== 'false';
}

export function setRagEnabled(enabled: boolean): void {
    localStorage.setItem(KEYS.RAG, String(enabled));
    window.dispatchEvent(new CustomEvent('caisp:rag-change', { detail: { enabled } }));
}

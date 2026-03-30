/* ═══════════════════════════════════════════════════════════
   Router — Hash-based SPA Navigation
   ═══════════════════════════════════════════════════════════ */
import { getUser } from './store';

type RouteHandler = (params: Record<string, string>) => string;

interface Route {
    pattern: RegExp;
    handler: RouteHandler;
    requiresAuth: boolean;
}

const routes: Route[] = [];

export function addRoute(
    path: string,
    handler: RouteHandler,
    requiresAuth = false,
): void {
    /* Convert path pattern like /module/:id to regex */
    const pattern = new RegExp(
        '^' + path.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$',
    );
    routes.push({ pattern, handler, requiresAuth });
}

export function navigate(path: string): void {
    window.location.hash = '#' + path;
}

export function getCurrentPath(): string {
    return window.location.hash.slice(1) || '/login';
}

/** Replace current history entry without pushing a new one */
function replaceRoute(path: string): void {
    window.location.replace(
        window.location.pathname + window.location.search + '#' + path,
    );
}

function resolve(): void {
    const fullPath = getCurrentPath();
    const app = document.getElementById('app');
    if (!app) return;

    /* Strip query string before matching routes */
    const [path, queryString] = fullPath.split('?');

    for (const route of routes) {
        const match = path.match(route.pattern);
        if (match) {
            /* If already logged in and hitting /login, skip back to dashboard */
            if (path === '/login' && getUser()) {
                replaceRoute('/dashboard');
                return;
            }

            /* Auth guard — not logged in, trying protected route */
            if (route.requiresAuth && !getUser()) {
                replaceRoute('/login');
                return;
            }

            const params = match.groups || {};

            /* Parse query params and merge into params */
            if (queryString) {
                const searchParams = new URLSearchParams(queryString);
                searchParams.forEach((value, key) => {
                    params[key] = value;
                });
            }

            app.innerHTML = route.handler(params);

            /* Dispatch mounted event for view init scripts */
            window.dispatchEvent(new CustomEvent('caisp:view-mounted', {
                detail: { path, params },
            }));
            return;
        }
    }

    /* 404 fallback */
    replaceRoute(getUser() ? '/dashboard' : '/login');
}

export function initRouter(): void {
    window.addEventListener('hashchange', resolve);
    window.addEventListener('caisp:auth-change', () => {
        const user = getUser();
        if (!user) replaceRoute('/login');
        else if (getCurrentPath() === '/login') replaceRoute('/dashboard');
    });

    resolve();
}

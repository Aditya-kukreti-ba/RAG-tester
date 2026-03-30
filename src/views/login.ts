/* ═══════════════════════════════════════════════════════════
   Login View
   ═══════════════════════════════════════════════════════════ */
import { loginUser } from '../store';

export function renderLogin(): string {
    return `
    <div class="page page__center">
        <div class="login anim-fade-in">
            <div class="login__panel glass">
                <div class="login__header">
                    <div class="login__badge">🔐 Secure Access</div>
                    <h1 class="login__title">Welcome to CAISP</h1>
                    <p class="login__sub">Certified AI Systems Professional for Cybersecurity</p>
                </div>

                <div id="login-error" class="login__error"></div>

                <form id="login-form">
                    <div class="form-group">
                        <label class="form-label" for="login-email">Email Address</label>
                        <input
                            class="form-input"
                            id="login-email"
                            type="email"
                            placeholder="admin@caisp.ai"
                            autocomplete="email"
                            required
                        />
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="login-password">Password</label>
                        <input
                            class="form-input"
                            id="login-password"
                            type="password"
                            placeholder="••••••••"
                            autocomplete="current-password"
                            required
                        />
                    </div>
                    <button class="btn btn--primary btn--block" type="submit">
                        Sign In →
                    </button>
                </form>

                <div class="login__demo">
                    Demo: <code>admin@caisp.ai</code> / <code>admin123</code><br/>
                    or <code>student@caisp.ai</code> / <code>student123</code>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function initLogin(): void {
    const form = document.getElementById('login-form') as HTMLFormElement;
    const errorEl = document.getElementById('login-error') as HTMLElement;
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = (document.getElementById('login-email') as HTMLInputElement).value;
        const pass  = (document.getElementById('login-password') as HTMLInputElement).value;
        const user  = loginUser(email, pass);

        if (!user) {
            errorEl.textContent = 'Invalid credentials. Please try the demo accounts above.';
            errorEl.style.display = 'block';
        }
    });
}

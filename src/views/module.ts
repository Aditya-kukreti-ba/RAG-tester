/* ═══════════════════════════════════════════════════════════
   Module Detail View — Lesson Content & Navigation
   ═══════════════════════════════════════════════════════════ */
import { MODULES } from '../data';
import {
    isLessonComplete,
    markLessonComplete,
    getModuleProgress,
} from '../store';
import { renderNav } from './dashboard';

export function renderModule(params: Record<string, string>): string {
    const mod = MODULES.find(m => m.id === params.id);
    if (!mod) return '<div class="page page__center"><h1>Module not found</h1></div>';

    const lessonId = params.lesson || mod.lessons[0].id;
    const activeLesson = mod.lessons.find(l => l.id === lessonId) || mod.lessons[0];
    const progress = getModuleProgress(mod.id);
    const currentIdx = mod.lessons.findIndex(l => l.id === activeLesson.id);
    const nextLesson = mod.lessons[currentIdx + 1];
    const isComplete = isLessonComplete(mod.id, activeLesson.id);

    const lessonItems = mod.lessons.map(l => {
        const completed = isLessonComplete(mod.id, l.id);
        const active = l.id === activeLesson.id;
        return `
        <li class="lesson-item ${active ? 'lesson-item--active' : ''} ${completed ? 'lesson-item--completed' : ''}"
            data-lesson-id="${l.id}">
            <span class="lesson-item__check">${completed ? '✓' : ''}</span>
            <span>${l.title}</span>
        </li>
        `;
    }).join('');

    return `
    ${renderNav('module')}
    <div class="page">
        <div class="page__content anim-fade-in">
            <button class="back-link" id="back-to-dashboard">← Back to Dashboard</button>

            <div class="section-label">Module ${mod.number}</div>
            <h1 class="section-title" style="font-size: clamp(22px, 3vw, 36px); margin-bottom: 8px;">${mod.title}</h1>
            <div class="progress" style="max-width: 400px; margin-bottom: 32px;">
                <div class="progress__fill" style="width: ${progress}%"></div>
            </div>

            <div class="module-detail">
                <aside class="module-sidebar">
                    <div class="module-sidebar__card glass">
                        <h3 class="module-sidebar__title">📋 Lessons</h3>
                        <ul class="lesson-list" id="lesson-list">
                            ${lessonItems}
                        </ul>
                    </div>
                </aside>

                <main class="module-content">
                    <div class="module-content__header">
                        <h2 class="module-content__lesson-title">${activeLesson.title}</h2>
                    </div>
                    <div class="module-content__body glass" style="padding: 32px;">
                        ${activeLesson.content}
                    </div>
                    <div class="module-content__actions">
                        ${!isComplete ? `
                            <button class="btn btn--primary" id="mark-complete-btn">
                                ✓ Mark as Complete
                            </button>
                        ` : `
                            <button class="btn btn--ghost" disabled style="opacity: 0.6;">
                                ✓ Completed
                            </button>
                        `}
                        ${nextLesson ? `
                            <button class="btn btn--ghost" id="next-lesson-btn" data-next="${nextLesson.id}">
                                Next: ${nextLesson.title} →
                            </button>
                        ` : ''}
                    </div>
                </main>
            </div>
        </div>
    </div>
    `;
}

export function initModule(params: Record<string, string>): void {
    const mod = MODULES.find(m => m.id === params.id);
    if (!mod) return;

    const lessonId = params.lesson || mod.lessons[0].id;

    /* Back button */
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
        window.location.hash = '#/dashboard';
    });

    /* Lesson navigation */
    document.querySelectorAll('[data-lesson-id]').forEach(item => {
        item.addEventListener('click', () => {
            const lid = (item as HTMLElement).dataset.lessonId;
            window.location.hash = `#/module/${params.id}?lesson=${lid}`;
        });
    });

    /* Mark complete */
    document.getElementById('mark-complete-btn')?.addEventListener('click', () => {
        markLessonComplete(params.id, lessonId);
        /* Re-render */
        window.location.hash = `#/module/${params.id}?lesson=${lessonId}`;
        /* Force hashchange even if same hash */
        window.dispatchEvent(new HashChangeEvent('hashchange'));
    });

    /* Next lesson */
    document.getElementById('next-lesson-btn')?.addEventListener('click', () => {
        const nextId = (document.getElementById('next-lesson-btn') as HTMLElement).dataset.next;
        window.location.hash = `#/module/${params.id}?lesson=${nextId}`;
    });

    /* Logout */
    document.getElementById('nav-logout')?.addEventListener('click', () => {
        import('../store').then(({ logoutUser }) => logoutUser());
    });
}

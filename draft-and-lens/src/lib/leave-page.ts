/**
 * Leave a secondary page (glossary, account, ledger) and return to the app.
 *
 * Every route into these pages opens a new tab, so closing it is what actually
 * returns the writer to the reading they came from. But `window.close()` only
 * works for a window opened by script — browsers ignore it for a tab the user
 * opened themselves, or navigated to directly, or restored from history. In
 * those cases a bare `window.close()` does nothing at all and the writer is
 * stranded on a page whose only exit silently fails.
 *
 * So: try to close, and if the tab is still here a moment later, navigate to
 * the app instead. Slightly worse than closing when closing would have worked;
 * far better than a dead control.
 *
 * Client-only — imports nothing server-side, so it is safe in any component.
 */
export function closeOrGoHome(): void {
  if (typeof window === 'undefined') return;
  window.close();
  setTimeout(() => {
    if (!window.closed) window.location.href = '/';
  }, 100);
}

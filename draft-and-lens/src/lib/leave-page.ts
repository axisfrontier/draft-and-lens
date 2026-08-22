/**
 * Leave a secondary page (glossary, account, ledger, legal) and return the
 * writer to wherever they actually came from.
 *
 * Three strategies, in order of how precisely each restores the previous view:
 *
 * 1. `window.close()` — correct when the page was opened in a new tab, which is
 *    how every in-app link reaches these pages (they all carry target=_blank).
 *    Closing puts the writer back on the exact reading they left, untouched,
 *    because that tab never went anywhere.
 *
 * 2. `history.back()` — correct when the writer navigated here in the same tab
 *    (a typed URL from an existing page, a link without target, browser
 *    history). Returns to the precise previous entry rather than a generic
 *    landing page. `window.close()` is a no-op for such tabs, so this is the
 *    common real-world path.
 *
 * 3. `/` — last resort, only when there is no history to go back to: the page
 *    was opened cold, in a fresh tab, from outside the app.
 *
 * KNOWN LIMIT, and it is not fixable here: a reading itself has no URL. It
 * lives in client state on `/`, so strategy 2 lands on an empty upload form
 * rather than the reading, and the reading is gone. Only strategy 1 preserves
 * it. Making a reading addressable is the "stable URL per reading" item on the
 * launch checklist — until that exists, no back control can restore a reading
 * that was navigated away from in the same tab.
 */
export function closeOrGoBack(): void {
  if (typeof window === 'undefined') return;

  window.close();

  setTimeout(() => {
    if (window.closed) return;
    // A fresh tab has a single history entry — its own. Anything more means
    // there is a real previous page to return to.
    if (window.history.length > 1) {
      window.history.back();
      // If the previous entry was on another origin the browser may refuse, in
      // which case we are still here a moment later; fall through to the app
      // rather than leave the control looking broken.
      setTimeout(() => {
        if (!window.closed && window.location.pathname.match(/^\/(ledger|glossary|account|about|how-i-read|how-i-remember|feedback|privacy|terms|acceptable-use)/)) {
          window.location.href = '/';
        }
      }, 400);
      return;
    }
    window.location.href = '/';
  }, 100);
}

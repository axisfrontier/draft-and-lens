/**
 * DLTrace — dev-only pipeline tracer (§20).
 * Gated behind DL_TRACE_ENABLED or staff flag; never active in production.
 */
export function traceMark(_label: string): void {
  if (process.env.DL_TRACE_ENABLED === 'true') {
    // Stage 4 — full implementation
  }
}

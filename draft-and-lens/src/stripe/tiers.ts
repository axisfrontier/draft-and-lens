/**
 * Subscription tier definitions — Stage 5 (§07).
 * Billing integration in Stage 7.
 *
 * ⚠ ZERO CONSUMERS, as of the 2026-09-01 audit. Nothing in `src/` or `tests/`
 * imports `TIERS`. It is a specification artifact for billing that has not been
 * built, not a config anything enforces — no route checks `analysesPerMonth`,
 * no component reads `features`. Kept rather than deleted because it records
 * product intent a git log would not, but do not read it as live behaviour:
 * every writer today gets everything, regardless of what this says.
 *
 * FLAGGED FOR NENAD, not actioned: whether this stays here, moves into a
 * pricing doc, or goes. It is dead code by the checklist's definition and
 * reads as covered ground, which is exactly the risk the checklist names.
 */
export const TIERS = {
  free: {
    priceGBP: 0,
    analysesPerMonth: 2,
    wordLimit: 10_000,
    features: {
      fullReport: true,
      lensVoices: 'selection' as const,
      // `interrogate: true` was removed by the merge (2026-09-01). It gated a
      // mode that no longer exists as something to gate — every reading is
      // interrogated, so an entitlement for it could only ever be `true` for
      // everyone, which is not an entitlement.
      mentorTaster: 'single-session' as const,
      mentorPersistent: false,
      conversation: false,
      studioMatching: false,
      reportDownload: false,
      history: false,
    },
  },
} as const;

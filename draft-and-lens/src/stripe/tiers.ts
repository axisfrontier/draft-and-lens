/**
 * Subscription tier definitions — Stage 5 (§07).
 * Billing integration in Stage 7.
 */
export const TIERS = {
  free: {
    priceGBP: 0,
    analysesPerMonth: 2,
    wordLimit: 10_000,
    features: {
      fullReport: true,
      lensVoices: 'selection' as const,
      interrogate: true,
      mentorTaster: 'single-session' as const,
      mentorPersistent: false,
      conversation: false,
      studioMatching: false,
      reportDownload: false,
      history: false,
    },
  },
} as const;

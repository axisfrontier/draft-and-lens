import 'server-only';

/**
 * Minimal security / audit log (data-protection verification — the breach hook).
 *
 * The single chokepoint for security-relevant events. Records WHAT happened, WHO,
 * and WHEN — NEVER any submitted text or reading content, only metadata. Written
 * as structured lines to stdout so the host (Vercel) captures them; this is the
 * hook the 72-hour breach-notification *process* (in the legal docs) builds on.
 * Upgrade target for production: route these to a dedicated log store + alerting.
 */
export type SecurityEvent =
  | 'auth_denied' // a data endpoint was hit without a valid session (possible probing)
  | 'data_exported' // a user downloaded their data export
  | 'account_deleted' // a full account wipe ran
  | 'moderation_blocked'; // a submission was refused by the moderation gate

export function logSecurityEvent(
  event: SecurityEvent,
  detail: Record<string, string | number> = {}
): void {
  // Only metadata is ever passed in — no manuscript, no reading text.
  const record = { kind: 'security', event, at: new Date().toISOString(), ...detail };
  console.warn(`[security] ${JSON.stringify(record)}`);
}

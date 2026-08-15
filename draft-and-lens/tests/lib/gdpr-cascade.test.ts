import { describe, expect, it } from 'vitest';

import { isMissingTable } from '../../src/lib/readings';

/**
 * `isMissingTable` decides when a failed ledger delete is allowed to count as
 * success. Getting it wrong in the permissive direction means an account wipe
 * reports success while leaving the writer's data behind — the exact failure
 * the launch checklist's deletion-cascade test exists to catch — so the set of
 * tolerated codes is pinned here rather than left to review.
 */
describe('isMissingTable', () => {
  it('tolerates PostgREST schema-cache miss (table not created yet)', () => {
    expect(isMissingTable({ code: 'PGRST205' })).toBe(true);
  });

  it('tolerates Postgres undefined_table', () => {
    expect(isMissingTable({ code: '42P01' })).toBe(true);
  });

  it('does NOT tolerate permission errors — those must fail the delete', () => {
    expect(isMissingTable({ code: '42501' })).toBe(false);
  });

  it('does NOT tolerate a foreign-key violation', () => {
    expect(isMissingTable({ code: '23503' })).toBe(false);
  });

  it('does NOT tolerate an unknown or absent code', () => {
    expect(isMissingTable({ code: 'PGRST301' })).toBe(false);
    expect(isMissingTable({})).toBe(false);
    expect(isMissingTable(null)).toBe(false);
    expect(isMissingTable(undefined)).toBe(false);
  });
});

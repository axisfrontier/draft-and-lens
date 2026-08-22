import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Two claims in this product are legal statements rather than features:
 * `deleteAllUserData` says nothing is left behind, and `exportUserData` says
 * nothing is held back. Both are lists a person has to remember to add to, and
 * both have been wrong in exactly the same way — user_milestones missed the
 * deletion list on the way in (2026-08-21), and writer_patterns was absent from
 * the export from the day its table was created until 2026-08-22.
 *
 * So this reads the source rather than the behaviour. A per-user table is
 * discoverable: it is a module in src/lib exporting a `*_TABLE` constant. Every
 * one of them must appear in both functions, and a new table that forgets one
 * fails here on the day it is written rather than the day a writer asks for
 * their data.
 */

const LIB = path.resolve(__dirname, '../../src/lib');
const READINGS = fs.readFileSync(path.join(LIB, 'readings.ts'), 'utf8');

/** The body of one exported function, from its signature to the next top-level one. */
function functionBody(source: string, name: string): string {
  const start = source.indexOf(`export async function ${name}`);
  expect(start, `${name} not found in readings.ts`).toBeGreaterThan(-1);
  const rest = source.slice(start + 1);
  const end = rest.indexOf('\nexport ');
  return end === -1 ? rest : rest.slice(0, end);
}

/** Every per-user table, as the source itself declares them. */
function perUserTables(): Array<{ module: string; constant: string; table: string }> {
  const out: Array<{ module: string; constant: string; table: string }> = [];
  for (const file of fs.readdirSync(LIB)) {
    if (!file.endsWith('.ts') || file === 'readings.ts') continue;
    const text = fs.readFileSync(path.join(LIB, file), 'utf8');
    const direct = text.match(/export const ([A-Z_]*TABLE)\s*=\s*'([a-z_]+)'/);
    if (direct?.[1] && direct[2]) {
      out.push({ module: file, constant: direct[1], table: direct[2] });
      continue;
    }
    // The other idiom: `const TABLE = 'x'` re-exported under a public name.
    const aliased = text.match(/export const ([A-Z_]*TABLE)\s*=\s*TABLE;/);
    const local = text.match(/^const TABLE = '([a-z_]+)';$/m);
    if (aliased?.[1] && local?.[1]) {
      out.push({ module: file, constant: aliased[1], table: local[1] });
    }
  }
  return out;
}

describe('per-user tables are complete in both directions', () => {
  const tables = perUserTables();

  it('finds the per-user tables at all — the guard is worthless if it finds none', () => {
    // A refactor that renames the constants must break this loudly, not turn
    // every assertion below into a vacuous pass over an empty list.
    expect(tables.length).toBeGreaterThanOrEqual(3);
    expect(tables.map((t) => t.table)).toEqual(
      expect.arrayContaining(['user_milestones', 'writer_patterns', 'writer_goals'])
    );
  });

  it('deletes every one of them on an account wipe', () => {
    const body = functionBody(READINGS, 'deleteAllUserData');
    for (const t of tables) {
      expect(body, `${t.constant} (${t.module}) is missing from deleteAllUserData`).toContain(
        t.constant
      );
    }
  });

  it('exports every one of them when a writer asks for their data', () => {
    const body = functionBody(READINGS, 'exportUserData');
    for (const t of tables) {
      expect(body, `${t.constant} (${t.module}) is missing from exportUserData`).toContain(
        t.constant
      );
    }
  });

  it('names the ledger tables in both, though they are declared locally', () => {
    // FACTS_TABLE, FLAGS_TABLE and MANUSCRIPTS_TABLE are consts inside
    // readings.ts rather than exports elsewhere, so the discovery above cannot
    // see them. They are pinned by name instead.
    const wipe = functionBody(READINGS, 'deleteAllUserData');
    const dump = functionBody(READINGS, 'exportUserData');
    for (const constant of ['FACTS_TABLE', 'FLAGS_TABLE', 'MANUSCRIPTS_TABLE']) {
      expect(wipe, `${constant} is missing from deleteAllUserData`).toContain(constant);
      expect(dump, `${constant} is missing from exportUserData`).toContain(constant);
    }
  });
});

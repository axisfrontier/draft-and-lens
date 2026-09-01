import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Every column `logSubmissionTelemetry` inserts must exist in a migration.
 *
 * WHY THIS TEST EXISTS, and why it reads files as text rather than calling
 * anything. `logSubmissionTelemetry` sends ONE insert with every column at
 * once, wrapped in a best-effort try/catch that swallows failures so telemetry
 * can never affect a reading. Those two properties combine badly: a column in
 * the insert that does not exist in the database fails the WHOLE insert, and
 * the catch makes it silent. Telemetry does not degrade, it goes dark — no
 * error, no log line, no rows, and nothing user-facing to notice.
 *
 * That is exactly what would happen if `best_in_class_lens` (added 2026-09-01
 * for the merge) were deployed before its migration was applied. The failure is
 * invisible in staging too, because an empty telemetry table looks the same as
 * a quiet one.
 *
 * A schema test cannot be written without a database, so this pins the next
 * best thing: the insert's column list against the migrations on disk. It
 * catches the typo and the forgotten migration. It CANNOT catch a migration
 * that exists but was never applied to the live database — that remains a
 * deploy-order discipline, stated at the top of the migration file.
 */

const repo = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repo, 'src/lib/telemetry-log.ts'), 'utf8');
const migrationDir = path.join(repo, 'supabase/migrations');
const migrations = fs
  .readdirSync(migrationDir)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => fs.readFileSync(path.join(migrationDir, f), 'utf8'))
  .join('\n');

/** The object literal passed to `.insert({ ... })`, as written. */
function insertedColumns(): string[] {
  const start = source.indexOf('.insert({');
  expect(start, 'telemetry-log.ts no longer contains a `.insert({` call').toBeGreaterThan(-1);
  const body = source.slice(start, source.indexOf('});', start));
  // Keys at the top level of the literal: `  column_name: ...` or `  stages,`.
  return [...body.matchAll(/^\s{6}([a-z_]+)[,:]/gm)].map((m) => m[1]);
}

describe('submission_telemetry columns', () => {
  const columns = insertedColumns();

  it('inserts the columns this test knows how to check', () => {
    // A guard on the guard: if the regex above silently stopped matching, every
    // other assertion here would pass vacuously over an empty list.
    expect(columns.length).toBeGreaterThanOrEqual(12);
    expect(columns).toContain('run_id');
  });

  it('declares every inserted column in a migration', () => {
    const missing = columns.filter((c) => !migrations.includes(c));
    expect(missing, `columns inserted but never migrated: ${missing.join(', ')}`).toEqual([]);
  });

  it('records the best-in-class match, because null is a result and not an absence', () => {
    // The merge (2026-09-01) made this the load-bearing unknown: match rate
    // decides blended cost, how often the no-match disclosure fires, and
    // whether thirty-five voices is enough. An unlogged null cannot be
    // recovered later.
    expect(columns).toContain('best_in_class_lens');
    expect(migrations).toMatch(/add column if not exists best_in_class_lens/);
  });

  it('stores the lens id rather than a boolean', () => {
    // "Did it match" is derivable from "which one matched"; the reverse is not.
    // A skew towards two or three lenses would say the matcher is reaching for
    // the familiar rather than the right one, and a boolean cannot show that.
    expect(migrations).toMatch(/best_in_class_lens text/);
    expect(migrations).not.toMatch(/best_in_class_lens boolean/);
  });
});

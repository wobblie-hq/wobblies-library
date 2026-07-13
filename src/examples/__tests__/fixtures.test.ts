import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { triggerEventSchema, expectedOutcomeSchema } from '../fixture-schema';
import { ALL_PLATFORM_ACTIONS } from '../platform-capabilities';
import { findPublicSafetyErrors } from '../public-safety';

// ---------------------------------------------------------------------------
// Discover all wobblie directories
// ---------------------------------------------------------------------------

const WOBBLIES_DIR = join(__dirname, '../../../wobblies');
const wobblieIds = readdirSync(WOBBLIES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

// Draft wobblies added in Task 8 that don't have fixtures yet are excluded
// from the "every wobblie must have fixtures" requirement. Task 8.4 adds them.
const DRAFT_WOBBLIE_IDS = new Set([
  'feature-flag-cleanup',
  'github-issue-triager',
  'jira-bug-context-researcher',
  'jira-issue-duplicate-finder',
  'jira-issue-labeler',
  'jira-pr-link-reconciler',
  'license-compliance-checker',
  'main-branch-first-responder',
  'notion-docs-sync',
  'pr-helper',
  'release-notes-broadcaster',
  'secret-leak-watcher',
  'sentry-regression-triager',
  'stale-issue-closer',
  'vercel-deploy-failure-diagnoser',
]);

const nonDraftIds = wobblieIds.filter((id) => !DRAFT_WOBBLIE_IDS.has(id));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fixturesDir(id: string): string {
  return join(WOBBLIES_DIR, id, 'fixtures');
}

function readJsonFixture(id: string, filename: string): unknown {
  const filePath = join(fixturesDir(id), filename);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/** Verify that every regex string in the expected outcome compiles. */
function collectRegexStrings(expected: Record<string, unknown>): string[] {
  const regexes: string[] = [];
  const actions = expected.actions as Array<Record<string, unknown>> | undefined;
  if (!actions) return regexes;
  for (const action of actions) {
    if (typeof action.targetPattern === 'string') regexes.push(action.targetPattern);
    if (Array.isArray(action.contentMustMatch)) {
      for (const p of action.contentMustMatch) {
        if (typeof p === 'string') regexes.push(p);
      }
    }
    if (Array.isArray(action.contentMustNotMatch)) {
      for (const p of action.contentMustNotMatch) {
        if (typeof p === 'string') regexes.push(p);
      }
    }
  }
  return regexes;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Behavioral fixtures', () => {
  describe('every non-draft wobblie has fixtures', () => {
    test.each(nonDraftIds)('%s has fixtures/trigger.json', (id) => {
      const triggerPath = join(fixturesDir(id), 'trigger.json');
      expect(existsSync(triggerPath), `Missing fixtures/trigger.json for ${id}`).toBe(true);
    });

    test.each(nonDraftIds)('%s has fixtures/expected.json', (id) => {
      const expectedPath = join(fixturesDir(id), 'expected.json');
      expect(existsSync(expectedPath), `Missing fixtures/expected.json for ${id}`).toBe(true);
    });
  });

  describe('trigger.json files parse against schema', () => {
    for (const id of nonDraftIds) {
      const triggerPath = join(fixturesDir(id), 'trigger.json');
      if (!existsSync(triggerPath)) continue;

      test(`${id}/trigger.json`, () => {
        const data = readJsonFixture(id, 'trigger.json');
        const result = triggerEventSchema.safeParse(data);
        expect(result.success, `${id}/trigger.json schema error: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true);
      });
    }
  });

  describe('expected.json files parse against schema', () => {
    for (const id of nonDraftIds) {
      const expectedPath = join(fixturesDir(id), 'expected.json');
      if (!existsSync(expectedPath)) continue;

      test(`${id}/expected.json`, () => {
        const data = readJsonFixture(id, 'expected.json');
        const result = expectedOutcomeSchema.safeParse(data);
        expect(result.success, `${id}/expected.json schema error: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true);
      });
    }
  });

  describe('noop fixture files parse against schema when present', () => {
    for (const id of nonDraftIds) {
      const noopTriggerPath = join(fixturesDir(id), 'noop-trigger.json');
      const noopExpectedPath = join(fixturesDir(id), 'noop-expected.json');

      if (existsSync(noopTriggerPath)) {
        test(`${id}/noop-trigger.json`, () => {
          const data = readJsonFixture(id, 'noop-trigger.json');
          const result = triggerEventSchema.safeParse(data);
          expect(result.success, `${id}/noop-trigger.json schema error: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true);
        });
      }

      if (existsSync(noopExpectedPath)) {
        test(`${id}/noop-expected.json`, () => {
          const data = readJsonFixture(id, 'noop-expected.json');
          const result = expectedOutcomeSchema.safeParse(data);
          expect(result.success, `${id}/noop-expected.json schema error: ${JSON.stringify(result.success ? null : result.error.issues)}`).toBe(true);
        });
      }
    }
  });

  describe('expected action types exist in platform capability manifest', () => {
    for (const id of nonDraftIds) {
      for (const filename of ['expected.json', 'noop-expected.json']) {
        const filePath = join(fixturesDir(id), filename);
        if (!existsSync(filePath)) continue;

        test(`${id}/${filename} action types`, () => {
          const data = readJsonFixture(id, filename) as Record<string, unknown>;
          const actions = data.actions as Array<Record<string, unknown>> | undefined;
          if (!actions || actions.length === 0) return;

          for (const action of actions) {
            const actionType = action.type as string;
            expect(
              ALL_PLATFORM_ACTIONS.has(actionType),
              `${id}/${filename}: action type "${actionType}" not in platform capability manifest`
            ).toBe(true);
          }
        });
      }
    }
  });

  describe('regex patterns in expectations compile', () => {
    for (const id of nonDraftIds) {
      for (const filename of ['expected.json', 'noop-expected.json']) {
        const filePath = join(fixturesDir(id), filename);
        if (!existsSync(filePath)) continue;

        test(`${id}/${filename} regexes`, () => {
          const data = readJsonFixture(id, filename) as Record<string, unknown>;
          const regexes = collectRegexStrings(data);
          for (const pattern of regexes) {
            expect(() => new RegExp(pattern)).not.toThrow();
          }
        });
      }
    }
  });

  describe('trigger payloads pass public-safety scanning', () => {
    for (const id of nonDraftIds) {
      for (const filename of ['trigger.json', 'noop-trigger.json']) {
        const filePath = join(fixturesDir(id), filename);
        if (!existsSync(filePath)) continue;

        test(`${id}/${filename} is public-safe`, () => {
          const content = readFileSync(filePath, 'utf8');
          const errors = findPublicSafetyErrors({
            content,
            path: `wobblies/${id}/fixtures/${filename}`,
          });
          expect(errors, `${id}/${filename} has public-safety violations`).toHaveLength(0);
        });
      }
    }
  });
});

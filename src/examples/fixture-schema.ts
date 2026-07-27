/**
 * Fixture schema — zod schemas for per-wobblie behavioral fixtures.
 *
 * Each wobblie ships `fixtures/trigger.json` + `expected.json`
 * (optionally `noop-trigger.json` + `noop-expected.json`).
 *
 * The platform's replay harness (wobblie.ai wobblie-reliability Task 6.4)
 * consumes these same files. If the harness ships first, match its fixture
 * loader schema exactly and note any deviation in progress.md.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// trigger.json schema
// ---------------------------------------------------------------------------

/**
 * A sanitized trigger event. Uses synthetic data (acme-corp/demo-repo)
 * and contains no real org/user data.
 */
export const triggerEventSchema = z
  .object({
    type: z.string().min(1),
    action: z.string().min(1).optional(),
    source: z.string().min(1),
    payload: z.record(z.unknown()),
    metadata: z
      .object({
        deliveryId: z.string().min(1).optional(),
        timestamp: z.string().min(1).optional(),
      })
      .passthrough()
      .optional(),
  })
  .strict();

export type TriggerEvent = z.infer<typeof triggerEventSchema>;

// ---------------------------------------------------------------------------
// expected.json schema
// ---------------------------------------------------------------------------

/**
 * An expected action in the wobblie's response.
 */
export const expectedActionSchema = z
  .object({
    /** Action type — must exist in the platform capability manifest. */
    type: z.string().min(1),
    /**
     * Regex pattern the action target must match.
     * E.g. "^acme-corp/demo-repo#\\d+$" for a PR comment target.
     */
    targetPattern: z.string().min(1).optional(),
    /**
     * Regex patterns that MUST appear somewhere in the action content.
     * All patterns must match for the expectation to pass.
     */
    contentMustMatch: z.array(z.string().min(1)).optional(),
    /**
     * Regex patterns that must NOT appear in the action content.
     * Any match is a failure.
     */
    contentMustNotMatch: z.array(z.string().min(1)).optional(),
  })
  .strict();

export type ExpectedAction = z.infer<typeof expectedActionSchema>;

/**
 * The full expected outcome for a trigger.
 */
export const expectedOutcomeSchema = z
  .object({
    /** Expected actions the wobblie should produce. */
    actions: z.array(expectedActionSchema),
    /** Upper bound on number of actions (inclusive). */
    maxActions: z.number().int().nonnegative(),
    /**
     * Whether a no-op (zero actions) is acceptable for this trigger.
     * Set `true` for noop-expected.json files.
     */
    allowNoop: z.boolean(),
    /** Optional reason explaining why a no-op is expected (for noop-expected.json). */
    noopReason: z.string().min(1).optional(),
  })
  .strict();

export type ExpectedOutcome = z.infer<typeof expectedOutcomeSchema>;

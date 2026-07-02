# Task 5: Behavioral fixtures for all 35 wobblies (REQ-4)

## Context

Nothing in the library asserts what a wobblie should DO. This task adds
per-wobblie trigger/expectation fixtures per design **D4** — the contract
the platform's replay harness (wobblie.ai wobblie-reliability Task 6.4)
replays. Depends on Tasks 2–4 (rewrites define the expected behavior).
Before defining the format, check whether the platform harness already
exists (`wobblie.ai/apps/api/scripts/replay-activation.ts`); if it does,
its fixture loader is the consumer contract — match it exactly and note
any deviation in progress.md.

## Subtasks

- [ ] 5.1 Format + schema
  - `src/examples/fixture-schema.ts`: zod schemas for `trigger.json`
    (event `{ type, action?, source, payload, metadata }` — sanitized,
    no real org/user data, use `acme-corp/demo-repo`) and
    `expected.json` (design D4: `actions[]` with `type`,
    `targetPattern`, `contentMustMatch[]`, `contentMustNotMatch[]`;
    `maxActions`; `allowNoop`).
  - Document the format in `docs/fixtures-spec.md` (follow the tone and
    structure of the existing `docs/examples-spec.md`).
- [ ] 5.2 Fixtures for the 15 authored wobblies — writing expectations
      forces an audit; where an authored wobblie's contract is
      unassertable or references missing capabilities (Task 1.5 baseline
      findings), fix the WOBBLIE.md minimally and note it:
      docs-drift-maintainer, docs-stale-maintainer,
      github-activity-digest (include noop fixture pair),
      js-ts-dependency-upgrades, linear-bug-context-researcher,
      linear-issue-duplicate-finder, linear-issue-labeler,
      linear-pr-link-reconciler, ping, pr-check-repair,
      pr-merge-conflict-repair, pr-metadata, pr-review-triage,
      slack-alert-context-researcher, slack-meeting-followup-planner.
- [ ] 5.3 Fixtures for the 20 rewritten wobblies — every enforcer/analyzer
      gets a violating-PR trigger + expected comment constraints AND a
      compliant-PR noop pair; scheduled scanners get a signal-present
      trigger + expected issue/PR constraints AND a quiet noop pair.
- [ ] 5.4 `src/examples/__tests__/fixtures.test.ts`:
  - every `wobblies/*/` directory has `fixtures/trigger.json` +
    `expected.json` that parse against the schema
  - every expected action type exists in
    `platform-capabilities.ts` (pending allowed)
  - every regex in expectations compiles
  - trigger payloads pass the public-safety patterns
    (`findPublicSafetyErrors`)

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun run test && bun run typecheck
bun scripts/validate-examples.ts
ls wobblies/*/fixtures/trigger.json | wc -l   # 35
```

## Exit criteria

- 35/35 wobblies have schema-valid fixtures (noop pairs where meaningful);
  fixture spec documented; audit fixes to authored wobblies recorded in
  progress.md.

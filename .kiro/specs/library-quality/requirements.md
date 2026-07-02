# Requirements — library-quality

## REQ-1: Authoring lint

Machine-checked rules that reject stub-quality definitions.

**Exit criteria:**

- New lint module in `src/examples/` runs as part of
  `bun scripts/validate-examples.ts` and fails on:
  - known boilerplate routine/body strings (exact-match denylist seeded
    with the current stub text)
  - routines that don't mention any purpose-specific noun (specificity
    heuristic)
  - trigger incoherence: schedule+watch both set without an explicit
    `triggers-rationale` doc section; purpose vocabulary implying scheduled
    scanning (monitor/watch/weekly/daily/across recent runs) with
    watch-only or PR-scoped limits ("per PR") on schedule-only wobblies
  - capability infeasibility: instructions requiring data/actions absent
    from the platform capability manifest
- Lint has unit tests (fixtures for each rule, pass and fail cases).
- A machine-readable lint report can be emitted (JSON) for CI annotations.

## REQ-2: Platform capability manifest

A single source of truth in the library for what the platform can do.

**Exit criteria:**

- `src/examples/platform-capabilities.ts` lists available action types
  (github write actions, github/slack read actions, provider actions) and
  integration providers, with a version/date stamp and a documented update
  procedure referencing `wobblie.ai` `.kiro/specs/wobblie-reliability/`
  (Task 1 there adds the read actions this manifest should include once
  shipped).
- The capability lint consumes only this manifest (no hardcoded lists in
  rules).

## REQ-3: All 20 stubs rewritten to authored quality

**Exit criteria:**

- Each stub gets: purpose-specific routines (3–6), triggers matching its
  nature (schedule XOR watch unless justified), a tailored deny list,
  and a body with signal threshold, low-noise/no-op policy, output format
  contract, and limits that match the trigger type — following the pattern
  of `github-activity-digest` and `docs-drift-maintainer`.
- Every rewritten wobblie passes the REQ-1 lint and the platform watch-rule
  parser format ("when a <event> is <action>").
- No rewritten wobblie requires capabilities missing from the manifest; if
  a wobblie's concept is infeasible even with planned platform work
  (Task 1 of wobblie-reliability), it is either redesigned to be feasible
  or removed from the catalog with a CHANGELOG entry (decide per wobblie,
  record reasoning in progress.md).

## REQ-4: Behavioral fixtures per wobblie

**Exit criteria:**

- Every catalog wobblie ships `fixtures/` containing at least:
  - `trigger.json` — a representative sanitized trigger event
  - `expected.json` — expected action envelope: action type(s), target
    shape, and assertable content constraints (e.g. "exactly one
    slack.message", "text matches mrkdwn, ≤1 link per bullet", or
    "no actions (no-op) with reason")
  - where meaningful, a `noop-trigger.json` + expectation for the
    low-signal path
- A vitest suite validates fixture schema and that expectations reference
  only action types present in the capability manifest.
- Fixture format is documented in `docs/` and matches what the platform's
  replay harness (`wobblie.ai` wobblie-reliability Task 6) consumes.

## REQ-5: CI gating and catalog integrity

**Exit criteria:**

- `validate:examples` (with the new lints + fixture checks) and the vitest
  suite run in CI on every PR; catalog publish/release is blocked on pass.
- `wobblies.json` / `examples.json` are regenerated and committed after the
  rewrites; a CI check fails when generated artifacts are stale relative to
  `wobblies/`.
- Repo metadata fixed: README badges/links and package.json
  repository/bugs/homepage all point at `wobblies-hq/wobblies-library`,
  branch `main`.

## REQ-6: End-to-end validation against the platform

**Exit criteria:**

- A representative sample (≥1 per category: PR-watch enforcement, PR-watch
  analysis, scheduled scanner, digest, Linear, Slack) installed into a test
  repo runs on the wobblies platform with outcomes matching their
  `expected.json` (or justified no-op) — coordinated with wobblie.ai
  wobblie-reliability Task 8.
- Results table recorded in progress.md; any mismatch fixed in the
  definition (or filed against the platform spec) before closing.

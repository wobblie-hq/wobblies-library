# Task 1: Authoring lint + platform capability manifest (REQ-1, REQ-2)

## Context

Current validation (`bun scripts/validate-examples.ts` →
`src/examples/cli.ts` `runValidateCli`) checks catalog schema
(`schema.ts`) and public-safety regexes (`public-safety.ts`) only. Twenty
of 35 wobblies are boilerplate stubs that pass it. This task adds the lint
that defines "authored quality" so Tasks 2–4 have a machine-checkable
target. Read design decisions **D1** and **D2** in `design.md` first.

## Subtasks

- [ ] 1.1 `src/examples/platform-capabilities.ts` exactly per design D2:
      integrations, write/read/sandbox action lists, sandboxTools, version
      stamp, `pending` markers for capabilities the platform is still
      shipping (read actions, gh in sandbox — see
      wobblie.ai/.kiro/specs/wobblie-reliability tasks 1–2), and an update
      procedure in the file header comment.
- [ ] 1.2 `src/examples/authoring-lint.ts` with data-driven rules
      (`{ ruleId, severity, check }[]`), reusing the frontmatter parsing
      the pipeline already does (find where WOBBLIE.md is parsed —
      `catalog.ts` / `schema.ts` — and accept that parsed shape):
  - `boilerplate-routines` (error): any routine ∈ exact-match denylist
    seeded from the current stubs ("Analyze the pull request for relevant
    signals.", "Take appropriate action based on findings.", "Comment or
    create issues with clear, actionable feedback.")
  - `boilerplate-body` (error): body Policy/Limits ∈ denylist ("Act only
    on clear signals. Prefer concise, actionable feedback over verbose
    reports.", "Maximum 1 action per PR per activation." when trigger is
    schedule-only)
  - `routine-specificity` (warn for now): no routine shares a non-stopword
    token stem with `purpose`
  - `trigger-coherence` (error): `watch` AND `schedule` both set without a
    `## Trigger rationale` body section; purpose matches
    /monitor|watch|weekly|daily|across recent|periodically|scan/i but has
    watch-only triggers; body limit mentions "per PR" while schedule-only
  - `watch-rule-format` (error): every watch rule matches
    /^when an? [\w -]+ is [\w -]+$/ (platform parser constraint)
  - `capability-feasibility` (error; warn when the capability is
    `pending`): keyword map → required capability, checked against the
    manifest. Seed the map from the platform's capability lint
    (wobblie.ai wobblie-reliability task-4) — e.g. /ci runs?|workflow
    runs?|test (history|failures) across/i → `github.list_workflow_runs`;
    /security advisor/i → a `github.security_advisories` capability that
    is NOT in the manifest (this rule must flag security-advisory-watcher
    until the platform ships it or the wobblie is redesigned);
    /slack channel|thread/i → slack actions; /linear/i → linear.
- [ ] 1.3 Wire into `runValidateCli`: errors fail the run (exit non-zero);
      add `--report <path>` flag writing findings JSON
      `{ wobblieId, ruleId, severity, message }[]`.
- [ ] 1.4 Unit tests in `src/examples/__tests__/authoring-lint.test.ts`:
      one passing and one failing fixture per rule; use small inline
      WOBBLIE.md strings, not the real catalog.
- [ ] 1.5 Baseline run: `bun scripts/validate-examples.ts --report
      /tmp/lint-baseline.json` against the real catalog; paste the
      per-wobblie finding counts into progress.md. Expected: the 20 stubs
      fail; note any findings against the 15 authored ones (they feed
      Tasks 2–5). Do NOT fix wobblies in this task. To keep CI green until
      Tasks 2–4 land, gate lint enforcement behind a flag or allowlist of
      known-failing ids (`src/examples/lint-grandfather.ts`) that Tasks
      2–4 shrink to empty — document the choice.

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun run typecheck && bun run test
bun scripts/validate-examples.ts --report /tmp/lint-baseline.json; echo "exit=$?"
```

## Exit criteria

- All lint rules implemented, tested, and wired in; baseline findings
  recorded in progress.md; existing validation still passes (grandfathered
  ids excluded); typecheck + vitest green.

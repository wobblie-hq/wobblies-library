# Progress Log for spec: library-quality

# Corrections

- ❌ Assuming main passes its own validation → ✅ Pristine main fails
  `bun scripts/validate-examples.ts` with 29 `unknown_key` errors (the
  frontmatter schema rejected `integrations`/`config` keys that nearly
  every WOBBLIE.md uses). Fixed 2026-07-02 by allowing both keys in
  `src/examples/schema.ts` (platform parser accepts them). CI clearly
  never ran this — Task 6 must make it blocking.
- ❌ Assuming main's test suite is green → ✅ 10 pre-existing failures on
  pristine main (`src/__tests__/wobblie-install-pr.test.ts` 3,
  `src/wobblie-cli/__tests__/cli.test.ts` 7 — `templated-wobblie` fixture
  and `.agents/wobblies/` path expectations). Not caused by catalog
  changes; fix or quarantine in Task 6 before making tests blocking.
- ❌ example.yml `adaptations` free-form → ✅ Schema enforces: required
  adaptations must NOT declare `default`; optional ones MUST;
  `readiness: adapt-before-use` requires ≥1 required adaptation;
  `direct-copy` requires zero required adaptations.
- ❌ Integration enum covers the platform → ✅ Was
  github|linear|slack|sentry only; extended 2026-07-02 to add
  jira|notion|vercel in `schema.ts` + `types.ts` (platform supports all
  seven via PROVIDER_PREFIXES).

- ❌ Assuming all catalog wobblies are authored → ✅ 20 of 35 are stubs
  sharing identical routines/deny/limits and copy-pasted PR-watch +
  `schedule: '0 9 * * *'` triggers (full split in spec.md).
- ❌ Free-form watch rules → ✅ Platform parser only accepts
  "when a <event> is <action>" (`parseWatchTrigger` in wobblie.ai
  `@repo/core`); anything else silently never matches.
- ❌ Repo org is consistent → ✅ Three different orgs referenced:
  `wobblies-hq` (actual), `wobblie-hq` (README badges),
  `universe-backwards` (package.json, README links, branch `master`).

# Codebase Patterns

- Runtime is bun: `bun run test` (vitest), `bun run typecheck`,
  `bun scripts/validate-examples.ts`, `bun scripts/generate-examples.ts`.
- Validation pipeline: `scripts/validate-examples.ts` →
  `src/examples/cli.ts` `runValidateCli` → `catalog.ts` (load),
  `schema.ts` (zod), `public-safety.ts` (leak regexes,
  `findPublicSafetyErrors`), `validation.ts` (error helpers).
- Catalog artifacts: `wobblies.json`, `examples.json`; CI workflows:
  `generate-wobblies.yml`, `release.yml`.
- Gold-standard authored files to model rewrites on:
  `wobblies/github-activity-digest/WOBBLIE.md` (scheduled digest),
  `wobblies/docs-drift-maintainer/WOBBLIE.md` (event-driven PR author),
  `wobblies/pr-metadata/WOBBLIE.md` (PR-triggered).
- Platform-side companion spec: wobblie.ai
  `.kiro/specs/wobblie-reliability/` (read actions, sandbox tools,
  goal-aware outcomes, capability lint, replay harness). Fixture format
  here must match its replay harness (its Task 6.4).

---

(Reverse-chronological task entries below. For each completed task record:
what was implemented, files changed, decisions made, corrections
discovered, verification output summary.)

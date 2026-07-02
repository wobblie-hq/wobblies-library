# Tasks

Detailed self-contained briefs in `tasks/task-N.md`. Implement ONE top-level
task per run. Order: Task 1 first (the lint defines "done" for the
rewrites); Tasks 2–4 are independent of each other; Task 5 needs 2–4;
Task 6 needs 1–5; Task 7 runs last against a deployed platform.

- [ ] 1. Authoring lint + platform capability manifest (REQ-1, REQ-2) — `tasks/task-1.md`
  - [ ] 1.1 platform-capabilities.ts manifest
  - [ ] 1.2 authoring-lint.ts rules (boilerplate, specificity, trigger coherence, capability feasibility)
  - [ ] 1.3 Wire into runValidateCli with JSON report output
  - [ ] 1.4 Rule unit tests (pass/fail fixtures per rule)
  - [ ] 1.5 Baseline report: run against all 35, record findings in progress.md

- [ ] 2. Rewrite scheduled-scanner stubs (REQ-3) — `tasks/task-2.md`
  - [ ] 2.1 flaky-test-detector
  - [ ] 2.2 security-advisory-watcher
  - [ ] 2.3 stale-pr-closer
  - [ ] 2.4 test-coverage-gate
  - [ ] 2.5 type-coverage-monitor
  - [ ] 2.6 unused-dependency-remover
  - [ ] 2.7 release-drafter

- [ ] 3. Rewrite PR-enforcement stubs (REQ-3) — `tasks/task-3.md`
  - [ ] 3.1 branch-naming-enforcer
  - [ ] 3.2 commit-message-enforcer
  - [ ] 3.3 changelog-enforcer
  - [ ] 3.4 codeowner-validator
  - [ ] 3.5 pr-size-limiter
  - [ ] 3.6 env-var-documenter
  - [ ] 3.7 todo-tracker

- [ ] 4. Rewrite PR-analysis stubs (REQ-3) — `tasks/task-4.md`
  - [ ] 4.1 accessibility-checker
  - [ ] 4.2 api-breaking-change-detector
  - [ ] 4.3 build-size-monitor
  - [ ] 4.4 dockerfile-linter
  - [ ] 4.5 error-handling-reviewer
  - [ ] 4.6 migration-reviewer

- [ ] 5. Behavioral fixtures for all 35 wobblies (REQ-4) — `tasks/task-5.md`
  - [ ] 5.1 fixture-schema.ts + docs
  - [ ] 5.2 Fixtures for the 15 authored wobblies (audits them in passing)
  - [ ] 5.3 Fixtures for the 20 rewritten wobblies
  - [ ] 5.4 fixtures.test.ts suite

- [ ] 6. CI gating, catalog regeneration, metadata fixes (REQ-5) — `tasks/task-6.md`
  - [ ] 6.1 PR workflow: validate + test + typecheck
  - [ ] 6.2 Generated-artifact freshness gate
  - [ ] 6.3 Regenerate wobblies.json / examples.json
  - [ ] 6.4 Fix org/branch metadata drift (README, package.json)
  - [ ] 6.5 Promote specificity lint from warn to error

- [ ] 7. End-to-end validation against the platform (REQ-6) — `tasks/task-7.md`
  - [ ] 7.1 Install representative sample into a test repo
  - [ ] 7.2 Verify outcomes vs expected.json on the platform
  - [ ] 7.3 Record results; fix or file mismatches

- [ ] 8. Validate and promote the 15 new draft wobblies (REQ-3/4/6) — `tasks/task-8.md`
  - [ ] 8.1 Authoring lint over the 15 (no grandfathering)
  - [ ] 8.2 Platform trigger verification per event type
  - [ ] 8.3 Capability verification (jira/vercel/notion action coverage)
  - [ ] 8.4 Fixtures incl. noop pairs
  - [ ] 8.5 Promote passing wobblies draft → ready; regenerate catalog
  - [ ] 8.6 README example index updated

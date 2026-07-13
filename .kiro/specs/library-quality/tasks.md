# Tasks

Detailed self-contained briefs in `tasks/task-N.md`. Implement ONE top-level
task per run. Order: Task 1 first (the lint defines "done" for the
rewrites); Tasks 2–4 are independent of each other; Task 5 needs 2–4;
Task 6 needs 1–5; Task 7 runs last against a deployed platform.

- [X] 1. Authoring lint + platform capability manifest (REQ-1, REQ-2) — `tasks/task-1.md`
  - [X] 1.1 platform-capabilities.ts manifest
  - [X] 1.2 authoring-lint.ts rules (boilerplate, specificity, trigger coherence, capability feasibility)
  - [X] 1.3 Wire into runValidateCli with JSON report output
  - [X] 1.4 Rule unit tests (pass/fail fixtures per rule)
  - [X] 1.5 Baseline report: run against all 35, record findings in progress.md

- [X] 2. Rewrite scheduled-scanner stubs (REQ-3) — `tasks/task-2.md`
  - [X] 2.1 flaky-test-detector
  - [X] 2.2 security-advisory-watcher
  - [X] 2.3 stale-pr-closer
  - [X] 2.4 test-coverage-gate
  - [X] 2.5 type-coverage-monitor
  - [X] 2.6 unused-dependency-remover
  - [X] 2.7 release-drafter

- [X] 3. Rewrite PR-enforcement stubs (REQ-3) — `tasks/task-3.md`
  - [X] 3.1 branch-naming-enforcer
  - [X] 3.2 commit-message-enforcer
  - [X] 3.3 changelog-enforcer
  - [X] 3.4 codeowner-validator
  - [X] 3.5 pr-size-limiter
  - [X] 3.6 env-var-documenter
  - [X] 3.7 todo-tracker

- [X] 4. Rewrite PR-analysis stubs (REQ-3) — `tasks/task-4.md`
  - [X] 4.1 accessibility-checker
  - [X] 4.2 api-breaking-change-detector
  - [X] 4.3 build-size-monitor
  - [X] 4.4 dockerfile-linter
  - [X] 4.5 error-handling-reviewer
  - [X] 4.6 migration-reviewer

- [X] 5. Behavioral fixtures for all 35 wobblies (REQ-4) — `tasks/task-5.md`
  - [X] 5.1 fixture-schema.ts + docs
  - [X] 5.2 Fixtures for the 15 authored wobblies (audits them in passing)
  - [X] 5.3 Fixtures for the 20 rewritten wobblies
  - [X] 5.4 fixtures.test.ts suite

- [X] 6. CI gating, catalog regeneration, metadata fixes (REQ-5) — `tasks/task-6.md`
  - [X] 6.1 PR workflow: validate + test + typecheck
  - [X] 6.2 Generated-artifact freshness gate
  - [X] 6.3 Regenerate wobblies.json / examples.json
  - [X] 6.4 Fix org/branch metadata drift (README, package.json)
  - [X] 6.5 Promote specificity lint from warn to error

- [X] 7. End-to-end validation against the platform (REQ-6) — `tasks/task-7.md`
  - [X] 7.1 Install representative sample into a test repo
  - [X] 7.2 Verify outcomes vs expected.json on the platform
  - [X] 7.3 Record results; fix or file mismatches

- [ ] 8. Validate and promote the 15 new draft wobblies (REQ-3/4/6) — `tasks/task-8.md`
  - [ ] 8.1 Authoring lint over the 15 (no grandfathering)
  - [ ] 8.2 Platform trigger verification per event type
  - [ ] 8.3 Capability verification (jira/vercel/notion action coverage)
  - [ ] 8.4 Fixtures incl. noop pairs
  - [ ] 8.5 Promote passing wobblies draft → ready; regenerate catalog
  - [ ] 8.6 README example index updated

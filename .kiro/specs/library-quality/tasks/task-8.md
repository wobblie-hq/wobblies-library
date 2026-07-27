# Task 8: Validate and promote the 15 new wobblies (REQ-3, REQ-4, REQ-6)

## Context

Fifteen new wobblies were authored on 2026-07-02 with `status: draft` in
their `example.yml` (WOBBLIE.md + example.yml each, already
schema-valid; `examples.json` regenerated to 50 entries):

- New originals: main-branch-first-responder, sentry-regression-triager,
  github-issue-triager, vercel-deploy-failure-diagnoser,
  feature-flag-cleanup, stale-issue-closer, release-notes-broadcaster,
  secret-leak-watcher, license-compliance-checker
- Rewritten ports from wobblie.ai `.wobblies/`: pr-helper, notion-docs-sync
- Jira mirrors of the Linear set: jira-issue-labeler,
  jira-bug-context-researcher, jira-issue-duplicate-finder,
  jira-pr-link-reconciler

They were authored to the D3 skeleton but have NOT been through the
authoring lint (Task 1), have no fixtures (Task 5), and several depend on
platform capabilities that need verification. This task takes them from
draft to ready. Depends on Tasks 1 and 5 (lint + fixture format exist).

## Subtasks

- [ ] 8.1 Run the Task-1 authoring lint over the 15; fix findings
      (do not grandfather new wobblies).
- [ ] 8.2 Platform trigger verification — for each non-GitHub-PR trigger,
      confirm the platform's event map actually delivers it (check
      wobblie.ai `event-normalizer.ts` / `event-router.ts` and the
      integration webhook configs):
  - `when a workflow run is completed` (main-branch-first-responder)
  - `when an issue is opened` (github-issue-triager)
  - `when a release is published` (release-notes-broadcaster)
  - Sentry issue-created events (sentry-regression-triager)
  - Vercel deployment-failed events (vercel-deploy-failure-diagnoser)
  - Jira issue-created / comment-added events (jira-* four)
  - Notion page-updated events (notion-docs-sync)
  - Record support status per trigger in progress.md; where the platform
    lacks the event, file it against wobblie.ai wobblie-reliability and
    keep the wobblie draft.
- [ ] 8.3 Capability verification per wobblie against
      `platform-capabilities.ts` — flag anything needing actions that are
      neither shipped nor pending (e.g. jira read/comment actions:
      `apps/api/src/integrations/jira.ts` exists but verify which action
      types `executeJiraAction` supports; same for vercel and notion
      action coverage).
- [ ] 8.4 Write fixtures (per Task-5 format) for all 15, including noop
      pairs for the enforcers/watchers.
- [ ] 8.5 Promote each wobblie that passes 8.1–8.4 to `status: ready` in
      its example.yml; regenerate `wobblies.json`/`examples.json`; keep
      blocked ones draft with a `progress.md` note naming the blocker.
- [ ] 8.6 README example index: confirm the generator adds the 15 (or add
      rows manually if the table is hand-maintained).

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun scripts/validate-examples.ts
bun run test && bun run typecheck
bun run generate:examples && git diff --exit-code wobblies.json examples.json
```

## Exit criteria

- Every one of the 15 is either `ready` (lint-clean, fixtures, verified
  triggers/capabilities) or `draft` with a named platform blocker filed
  against wobblie.ai; catalog artifacts regenerated; suite green.

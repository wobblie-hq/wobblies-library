# Task 7: End-to-end validation against the platform (REQ-6)

## Context

Final gate: prove rewritten library wobblies produce their stated results
on the real wobblies platform. Run LAST, after Tasks 1–6 here AND after
the platform-side spec (wobblie.ai `.kiro/specs/wobblie-reliability/`,
especially Tasks 1–3 and 8) is deployed — the platform's read actions,
sandbox tools, and goal-aware outcome reporting are prerequisites for
meaningful results. Coordinate with wobblie-reliability Task 8 rather than
duplicating its digest soak.

## Subtasks

- [ ] 7.1 Test-repo setup
  - Use (or create) a dedicated test repository with the GitHub App
    installed and Slack/Linear integrations connected on a test team.
  - Install a representative sample via the catalog CLI or by committing
    `.wobblies/` dirs — one per category, minimum:
    `branch-naming-enforcer` (PR enforcement),
    `migration-reviewer` (PR analysis),
    `stale-pr-closer` (scheduled scanner),
    `github-activity-digest` (digest),
    `linear-issue-labeler` (Linear),
    `slack-alert-context-researcher` (Slack).
  - Verify the platform's capability lint (agent sync) reports zero
    warnings for all installed wobblies — this cross-checks the library
    manifest against the deployed platform.
- [ ] 7.2 Exercise each installed wobblie with its fixture scenario
  - Recreate each wobblie's `fixtures/trigger.json` scenario for real
    (open a PR from a badly named branch; open a PR with a risky
    migration; let a PR go stale or backdate via manual trigger; seed
    activity for the digest; create a Linear issue; post a test alert to
    the Slack channel).
  - For each, compare the platform's Activation Details against
    `expected.json`: action type, target, content constraints, and the
    noop cases (compliant PR → no comment).
- [ ] 7.3 Results + closeout
  - Record a results table in progress.md: wobblie, scenario, expected,
    observed, verdict (pass / content-mismatch / platform-gap / no-op
    error).
  - Definition problems → fix the WOBBLIE.md + fixtures here (with a
    regression note); platform problems → file them against
    wobblie-reliability in wobblie.ai (list them in progress.md with
    activation ids).
  - Re-run failed scenarios after fixes until 6/6 categories pass.
  - Summarize in progress.md what the library now guarantees and known
    limitations (LLM judgment variance, pending capabilities).

## Verification

Evidence-based: activation records (status, actions, per-action outcomes)
in the dashboard / via SQL on the platform DB, plus the actual artifacts
(PR comments, issues, Slack messages, Linear updates) matching
expectations. Screenshots or record IDs go in progress.md.

## Exit criteria

- 6/6 category representatives pass their fixture scenarios (including
  noop cases) on the deployed platform; zero capability warnings on sync;
  all mismatches fixed here or filed against the platform spec with ids.

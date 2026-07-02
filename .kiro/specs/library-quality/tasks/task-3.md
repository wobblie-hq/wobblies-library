# Task 3: Rewrite PR-enforcement stubs (REQ-3)

## Context

These 7 wobblies are genuinely PR-triggered policy enforcers, but their
stubs have generic routines and a redundant `schedule: '0 9 * * *'`.
Rewrite each per design **D3** (model: read
`wobblies/pr-metadata/WOBBLIE.md` and `wobblies/pr-review-triage/WOBBLIE.md`
for authored PR-triggered patterns first).

General rules for all 7:

- Triggers: keep `watch: when a pull request is opened / when a pull
  request is synchronized`; DROP the schedule.
- Routines: name the exact check performed, the evidence consulted, and
  the single action taken.
- Body: Overview / Check definition (the precise rule, with
  `{{adapt.*}}`-configurable policy) / Low-noise behavior (update the
  existing comment instead of stacking new ones; no-op when compliant;
  never repeat an unchanged finding on synchronize) / Output format
  (comment template) / Limits ("Maximum 1 comment per PR; edit in place on
  subsequent pushes").
- Deny: keep "Do not merge or approve pull requests", "Do not act on
  draft pull requests"; add wobblie-specific denies; drop irrelevant ones.
- Every enforcer must define its policy source: `{{adapt.*}}` value or a
  repo file convention (e.g. CONTRIBUTING.md section) — never an
  unstated house style.

## Subtasks

- [ ] 3.1 `branch-naming-enforcer` — pattern from
      `{{adapt.branch_pattern}}` (default `^(feat|fix|chore|docs|refactor|
      test)/[a-z0-9._-]+$`); one comment naming the expected pattern and
      the offending branch; no-op when matching or when the PR is from a
      fork/bot.
- [ ] 3.2 `commit-message-enforcer` — convention from
      `{{adapt.commit_convention}}` (default Conventional Commits); check
      commits in the PR; single comment listing non-conforming commits
      (max 10 shown); account for squash-merge repos
      (`{{adapt.merge_style}}`) where only the PR title matters.
- [ ] 3.3 `changelog-enforcer` — require a change to
      `{{adapt.changelog_path}}` (default CHANGELOG.md) when source paths
      matching `{{adapt.source_globs}}` change; respect a skip label
      (`{{adapt.skip_label}}`, default `no-changelog`); no-op for
      docs-only/test-only PRs.
- [ ] 3.4 `codeowner-validator` — verify CODEOWNERS syntax when the file
      changes, and flag PRs touching paths with no owning entry; comment
      with the unowned paths; no-op when fully covered.
- [ ] 3.5 `pr-size-limiter` — thresholds `{{adapt.max_files}}` /
      `{{adapt.max_lines}}` (defaults 30 / 800, excluding lockfiles and
      generated paths from `{{adapt.generated_globs}}`); one comment
      suggesting a split with a natural seam if evident; label
      `{{adapt.size_label}}` optional.
- [ ] 3.6 `env-var-documenter` — detect new env var reads in the diff
      (process.env.X, os.environ, etc.); require documentation in
      `{{adapt.env_docs_path}}` (default `.env.example`); comment listing
      undocumented vars; no-op when all documented.
- [ ] 3.7 `todo-tracker` — detect TODO/FIXME added in the diff; comment
      once listing them and offering issue creation; create issues only
      when `{{adapt.auto_create_issues}}` is true; link back to the PR;
      never act on pre-existing TODOs outside the diff.

For each: run the lint on the file, fix findings, remove the id from the
grandfather allowlist.

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun scripts/validate-examples.ts
bun run test && bun run typecheck
git diff --stat wobblies/   # only the 7 directories touched
```

## Exit criteria

- All 7 pass the authoring lint ungrandfathered; each defines policy
  source, low-noise behavior, and edit-in-place commenting.

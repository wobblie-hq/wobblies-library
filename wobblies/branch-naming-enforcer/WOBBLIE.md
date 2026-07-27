---
id: branch-naming-enforcer
purpose: Comments on pull requests whose branch names violate the configured naming pattern, helping teams enforce consistent branch conventions.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Extract the head branch name from the pull request and test it against the configured naming pattern (`{{adapt.branch_pattern}}`).
  - Skip pull requests from forks, bots, or branches matching `{{adapt.exempt_patterns}}`.
  - Comment on the pull request with the expected pattern and the offending branch name when the pattern does not match; no-op when the branch name is valid.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, branch names, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not act on pull requests from forks or bot accounts.
---

# Branch Naming Enforcer

## Overview

Fires on each PR open or push and checks whether the head branch name matches the team's naming convention. Leaves a single comment when the name is non-conforming; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate the head branch name of the pull request in the repository containing this wobblie.

## Check definition

Test the head branch name against the regex pattern configured in `{{adapt.branch_pattern}}` (default: `^(feat|fix|chore|docs|refactor|test)/[a-z0-9._-]+$`).

A branch name passes when the full name matches the pattern. Leading `refs/heads/` prefixes are stripped before matching.

Branches matching any entry in `{{adapt.exempt_patterns}}` (default: `^(main|master|develop|release/.+|hotfix/.+)$`) are always considered valid.

## Low-noise behavior

No-op silently when:

- The branch name matches the configured pattern.
- The pull request is from a fork or a bot account.
- The pull request is a draft.
- A wobblie-owned comment already exists with the same finding (no change since the last push).

If a wobblie-owned comment already exists on the pull request and the branch name is still non-conforming, update the comment in place rather than posting a new one.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "Branch name `<branch>` does not match the required pattern."
- Pattern line: "Expected pattern: `<pattern>`."
- Example line: "Example valid names: `feat/add-login`, `fix/header-crash`, `chore/update-deps`."
- Closing line: "Rename the branch or add a pattern exemption if this name is intentional."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Do not block or request changes; comment only.

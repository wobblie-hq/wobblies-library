---
id: commit-message-enforcer
purpose: Comments on pull requests whose commit messages violate the configured commit convention, helping teams enforce consistent commit message formatting.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Retrieve the list of commits in the pull request and test each commit message against the configured convention (`{{adapt.commit_convention}}`).
  - When `{{adapt.merge_style}}` is `squash`, check only the pull request title against the convention instead of individual commits.
  - Skip merge commits and commits authored by bots.
  - Comment on the pull request listing non-conforming commit messages (up to 10) with the expected format; no-op when all commits conform.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, commit messages, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not rewrite or amend commits.
---

# Commit Message Enforcer

## Overview

Fires on each PR open or push and checks whether the commit messages follow the team's commit convention. Leaves a single comment when any messages are non-conforming; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate all commits in the pull request in the repository containing this wobblie. When the repository uses squash merging (`{{adapt.merge_style}}` is `squash`), evaluate only the pull request title since individual commit messages are discarded at merge time.

## Check definition

Test each commit message against the convention configured in `{{adapt.commit_convention}}` (default: `conventional-commits`).

Supported conventions:

- `conventional-commits` — the message must start with a type prefix (e.g. `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, `style:`) followed by a space and a description. An optional scope in parentheses is allowed after the type.
- `ticket-prefix` — the message must start with a ticket identifier matching `{{adapt.ticket_pattern}}` (e.g. `PROJ-\d+`).

Merge commits (messages starting with `Merge `) and bot-authored commits are always considered valid.

## Low-noise behavior

No-op silently when:

- All commit messages (or the PR title in squash mode) conform to the convention.
- The pull request is a draft.
- A wobblie-owned comment already exists with the same findings (no new non-conforming commits since the last push).

If a wobblie-owned comment already exists on the pull request, update the comment in place rather than posting a new one. Remove resolved findings from the comment when commits are amended or force-pushed.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "The following commit messages do not match the `<convention>` convention:"
- List: one bullet per non-conforming commit (max 10 shown), each showing the short SHA and the offending message.
- If more than 10 non-conforming commits exist, append: "... and N more."
- Pattern line: "Expected format: `<format description>`."
- Closing line: "Amend the commit messages or update the convention setting if this format is intentional."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 10 non-conforming commits shown per comment.
- Do not block or request changes; comment only.

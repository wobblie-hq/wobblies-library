---
id: todo-tracker
purpose: Comments on pull requests that introduce new TODO or FIXME comments in the diff, helping teams track and resolve technical debt.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Scan the pull request diff for newly added lines containing TODO or FIXME comments.
  - Exclude pre-existing TODOs that appear only in context lines (unchanged lines surrounding the diff).
  - Comment on the pull request listing the new TODOs with file locations; no-op when no new TODOs are introduced.
  - When `{{adapt.auto_create_issues}}` is true, create one GitHub issue per TODO and include the issue link in the comment.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not act on pre-existing TODOs that are not newly added in the diff.
  - Do not create issues unless `{{adapt.auto_create_issues}}` is explicitly set to true.
---

# TODO Tracker

## Overview

Fires on each PR open or push and checks whether new TODO or FIXME comments have been added in the diff. Leaves a single comment listing the new items; edits that comment in place on later pushes. Optionally creates linked GitHub issues for each TODO. Comment-only — never blocks or merges.

## Scope

Evaluate only added lines in the pull request diff in the repository containing this wobblie. Ignore TODOs in deleted lines or unchanged context lines.

## Check definition

A line is flagged when it is a newly added line (prefixed with `+` in the diff) and contains a case-insensitive match for `TODO` or `FIXME`, optionally followed by a colon and description.

Detect patterns like:

- `// TODO: description`
- `# FIXME: description`
- `/* TODO description */`
- `-- TODO: description`

The check passes when no new TODO or FIXME comments are introduced in the diff.

## Low-noise behavior

No-op silently when:

- No new TODO or FIXME comments are added in the diff.
- The pull request is a draft.
- A wobblie-owned comment already exists with the same findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place rather than posting a new one. Remove resolved TODOs from the comment when they are removed in a subsequent push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "This PR introduces `<N>` new TODO/FIXME comment(s):"
- List: one bullet per TODO showing the file path, line number, and the TODO text.
- If `{{adapt.auto_create_issues}}` is true, each bullet also includes the linked issue number.
- Closing line: "Resolve these TODOs before merging or track them in the linked issues."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 25 TODOs shown per comment.
- Maximum 10 issues created per PR when auto-creation is enabled.
- Do not block or request changes; comment only.

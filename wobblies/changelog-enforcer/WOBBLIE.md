---
id: changelog-enforcer
purpose: Comments on pull requests that change application code without updating the changelog, helping teams maintain accurate release documentation.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Inspect the pull request diff to determine whether any files matching `{{adapt.source_globs}}` have changed.
  - Check whether `{{adapt.changelog_path}}` is included in the changed files.
  - Skip the check when the pull request carries the `{{adapt.skip_label}}` label or when the diff touches only documentation or test files.
  - Comment on the pull request when source files changed but the changelog was not updated; no-op when the changelog is present or the check is skipped.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, changelog files, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not create or modify labels.
---

# Changelog Enforcer

## Overview

Fires on each PR open or push and checks whether the changelog has been updated when application source code changes. Leaves a single comment when the changelog entry is missing; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate the changed files in the pull request in the repository containing this wobblie. Only enforce the changelog requirement when files matching `{{adapt.source_globs}}` (default: `src/**,lib/**,app/**`) are modified.

## Check definition

The check passes when any of the following are true:

- The pull request includes a change to `{{adapt.changelog_path}}` (default: `CHANGELOG.md`).
- The pull request carries the `{{adapt.skip_label}}` label (default: `no-changelog`).
- The pull request modifies only files outside `{{adapt.source_globs}}` (e.g. docs-only or test-only changes).

The check fails when source files changed but no changelog entry was added.

## Low-noise behavior

No-op silently when:

- The changelog is updated or the skip label is present.
- Only documentation or test files changed (no source glob matches).
- The pull request is a draft.
- A wobblie-owned comment already exists with the same finding (no relevant file changes since the last push).

If a wobblie-owned comment already exists on the pull request and the changelog is still missing, update the comment in place rather than posting a new one. Remove the comment content if the changelog is added in a subsequent push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "This PR modifies source files but does not include a changelog entry."
- Detail line: "Please update `<changelog_path>` or add the `<skip_label>` label if no entry is needed."
- Files line: "Source files changed: `<file1>`, `<file2>`, ... (up to 10 shown)."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 10 changed source files shown in the comment.
- Do not block or request changes; comment only.

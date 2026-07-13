---
id: codeowner-validator
purpose: Comments on pull requests that introduce paths without CODEOWNERS coverage or modify CODEOWNERS with syntax errors, helping teams maintain complete code ownership.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Parse the CODEOWNERS file from the pull request head branch and validate its syntax (valid patterns, existing team or user references).
  - Identify files and directories added or moved in the pull request diff that are not covered by any CODEOWNERS entry.
  - Comment on the pull request listing unowned paths and any CODEOWNERS syntax errors; no-op when all paths are covered and syntax is valid.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, CODEOWNERS files, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not validate ownership for deleted files.
---

# CODEOWNERS Validator

## Overview

Fires on each PR open or push and checks whether all new or moved paths have CODEOWNERS coverage and whether the CODEOWNERS file itself has valid syntax. Leaves a single comment when issues are found; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate the CODEOWNERS file (checked in `{{adapt.codeowners_path}}`, default: `.github/CODEOWNERS`) and the files changed in the pull request.

## Check definition

Two checks are performed:

1. **Syntax validation** — when the CODEOWNERS file is modified in the PR, validate that every line uses a valid file pattern and references at least one owner. Flag lines with invalid glob patterns, missing owners, or malformed entries.

2. **Coverage check** — for every file added or moved in the PR diff, verify that at least one CODEOWNERS pattern matches the path. Report paths with no matching ownership entry.

The check passes when the CODEOWNERS file has no syntax errors and all new paths have ownership coverage.

## Low-noise behavior

No-op silently when:

- All paths in the PR have CODEOWNERS coverage and the CODEOWNERS file has no syntax errors.
- The pull request does not add or move any files (modifications to existing files are covered by existing patterns).
- The pull request is a draft.
- A wobblie-owned comment already exists with the same findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place rather than posting a new one.

## Output format

Single comment (or in-place update) on the pull request:

- If syntax errors exist: "CODEOWNERS syntax issues:" followed by one bullet per error with line number and description.
- If unowned paths exist: "The following paths have no CODEOWNERS entry:" followed by one bullet per unowned path (up to 15 shown).
- Closing line: "Add ownership entries to CODEOWNERS for the listed paths."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 15 unowned paths shown per comment.
- Do not block or request changes; comment only.

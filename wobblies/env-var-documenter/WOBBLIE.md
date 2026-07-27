---
id: env-var-documenter
purpose: Comments on pull requests that introduce new environment variable references without documenting them in the project's environment documentation file.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Scan the pull request diff for newly added environment variable references (patterns like `process.env.VAR`, `os.environ["VAR"]`, `System.getenv("VAR")`, `ENV["VAR"]`).
  - Check whether each detected variable is documented in `{{adapt.env_docs_path}}`.
  - Comment on the pull request listing undocumented environment variables; no-op when all variables are documented or no new variables are introduced.
  - Update the existing wobblie-owned comment in place on subsequent pushes rather than posting a new one.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, environment files, or repository settings.
  - Do not act on draft pull requests.
  - Do not comment more than once per pull request (edit the existing comment in place on subsequent pushes).
  - Do not flag environment variables that already exist in the codebase before this PR.
---

# Environment Variable Documenter

## Overview

Fires on each PR open or push and checks whether newly referenced environment variables are documented. Leaves a single comment when undocumented variables are found; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate the pull request diff in the repository containing this wobblie. Only inspect lines added in the diff (not the full file contents) to detect new environment variable references.

## Check definition

Detect environment variable access patterns added in the diff:

- `process.env.VAR_NAME` (JavaScript/TypeScript)
- `os.environ["VAR_NAME"]` or `os.environ.get("VAR_NAME")` (Python)
- `System.getenv("VAR_NAME")` (Java)
- `ENV["VAR_NAME"]` or `ENV.fetch("VAR_NAME")` (Ruby)
- `env::var("VAR_NAME")` (Rust)

For each detected variable, check whether it appears in `{{adapt.env_docs_path}}` (default: `.env.example`). A variable is considered documented if its name appears on any line of the documentation file.

The check passes when all newly referenced variables are documented or when no new variables are introduced.

## Low-noise behavior

No-op silently when:

- No new environment variable references are introduced in the diff.
- All detected variables are already documented.
- The pull request is a draft.
- A wobblie-owned comment already exists with the same findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place rather than posting a new one. Remove resolved findings from the comment when variables are documented in a subsequent push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "The following environment variables are referenced in new code but not documented in `<env_docs_path>`:"
- List: one bullet per undocumented variable showing the variable name and the file where it was found.
- Closing line: "Add these variables to `<env_docs_path>` with a description of their purpose and any default values."
- Do not use tables, nested lists, or code fences.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 20 undocumented variables shown per comment.
- Do not block or request changes; comment only.

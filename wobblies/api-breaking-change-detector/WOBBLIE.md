---
id: api-breaking-change-detector
purpose: Detects breaking API changes in pull request diffs — removed endpoints, narrowed types, new required parameters, and changed response shapes — and comments with a classified table and migration hints.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Identify changed files matching API surface globs (`{{adapt.api_globs}}`) from the pull request diff; no-op when no API surface files are touched.
  - Classify each change as Breaking or Possibly-breaking by comparing the before and after states of endpoints, exported types, required parameters, and response shapes.
  - Comment on the pull request with a table of findings plus a migration hint per breaking change; edit the existing wobblie-owned comment in place on subsequent pushes.
  - Optionally apply the label `{{adapt.breaking_label}}` when at least one Breaking change is detected.
  - No-op silently when no breaking or possibly-breaking changes are found.
deny:
  - Do not merge or approve pull requests.
  - Do not modify source code, API definitions, or repository settings.
  - Do not act on draft pull requests.
  - Do not flag additive changes (new optional fields, new endpoints) as breaking.
  - Do not comment on files outside `{{adapt.api_globs}}`.
  - Do not flag changes in test files, mocks, or internal-only helpers.
  - Do not comment more than once per pull request (edit the existing comment in place).
---

# API Breaking Change Detector

## Overview

Fires on each PR open or push and checks whether changes to the API surface introduce breaking changes. Posts a single comment with a classification table and migration hints; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate only files matching `{{adapt.api_globs}}` (default: `**/*.{routes,controller,handler}.{ts,js}`, `**/api/**/*.{ts,js}`, `**/*.graphql`, `**/openapi.{yaml,yml,json}`) that appear in the pull request diff. Inspect only the API-facing surface: exported types, route definitions, handler signatures, GraphQL schemas, and OpenAPI specs.

## Signal threshold

Report only changes that remove or restrict existing public contract guarantees:

- **Removed/renamed endpoints** (Breaking): a route or operation previously available is removed or its path/method changes.
- **Narrowed types** (Breaking): an exported type, response field, or union variant is removed or its type is narrowed.
- **New required parameters** (Breaking): a previously optional or absent parameter becomes required for an existing endpoint.
- **Changed response shapes** (Possibly-breaking): a response field is renamed, moved, or its type changes in a way that could break clients.
- **Removed exported types** (Breaking): a type previously exported from the API surface is deleted.

Additive changes (new optional fields, new endpoints, widened union types) are never breaking and must not be reported.

## Low-noise behavior

No-op silently when:

- No files matching `{{adapt.api_globs}}` are changed in the diff.
- The pull request is a draft.
- All changes are additive (no removals, narrowings, or new requirements).
- A wobblie-owned comment already exists with identical findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place. Remove findings that no longer apply after a push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "Detected API breaking changes in this PR:"
- Table with columns: Severity | Location | Description | Migration hint
- Severity values: `Breaking` or `Possibly-breaking`
- If `{{adapt.breaking_label}}` is set and at least one Breaking change exists, apply that label.
- Closing line: "Consider versioning the affected endpoints or adding deprecation notices before removing the old contract."
- Maximum 10 findings per comment; if more exist, append: "... and N more."

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 10 findings shown per comment.
- Do not block, request changes, or merge.

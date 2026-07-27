---
id: dockerfile-linter
purpose: Reviews pull request diffs that change Dockerfile or Docker Compose files for common best-practice violations, commenting with line-cited findings and remediation advice.
integrations:
  - github
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Identify changed Dockerfile and Docker Compose files in the pull request diff; no-op when none are touched.
  - When `{{adapt.lint_command}}` is configured, run it in the sandbox against the changed files and use the output as the primary finding source.
  - When no lint command is configured, analyze changed lines for common violations — unpinned base image tags, poor layer-cache ordering, secrets in build args, running as root without necessity, missing HEALTHCHECK, and missing apt cleanup in RUN layers.
  - Comment on the pull request with up to 5 findings anchored to changed lines; edit the existing wobblie-owned comment in place on subsequent pushes.
  - No-op silently when no violations are found in the changed Dockerfile lines.
deny:
  - Do not merge or approve pull requests.
  - Do not modify Dockerfiles, source code, or repository settings.
  - Do not act on draft pull requests.
  - Do not flag issues in unchanged lines or pre-existing code.
  - Do not report style preferences or formatting opinions not tied to security, performance, or reliability.
  - Do not comment more than once per pull request (edit the existing comment in place).
  - Do not install software or modify the sandbox outside of running `{{adapt.lint_command}}`.
---

# Dockerfile Linter

## Overview

Fires on each PR open or push when Dockerfile or Docker Compose files are changed. Checks for common best-practice violations using a configured lint tool (preferably hadolint) or LLM analysis as fallback. Posts a single comment with cited findings; edits that comment in place on later pushes. Comment-only — never blocks or merges.

## Scope

Evaluate only files matching these patterns in the pull request diff:

- `**/Dockerfile*` (including `Dockerfile`, `Dockerfile.dev`, `Dockerfile.prod`, etc.)
- `**/docker-compose*.{yml,yaml}`
- `**/*.dockerfile`

Only inspect lines that are added or modified in the diff — never flag pre-existing issues in unchanged code.

## Signal threshold

Report only violations anchored to changed lines that affect security, reliability, or build performance:

- **Unpinned base image tags** (security/reproducibility): `FROM image` or `FROM image:latest` instead of a pinned digest or specific version tag.
- **Poor layer-cache ordering** (performance): `COPY . .` before dependency install, invalidating cache on every source change.
- **Secrets in build args** (security): `ARG` or `ENV` with names suggesting secrets (password, token, key, secret) without multi-stage isolation.
- **Running as root** (security): no `USER` instruction after the final `FROM`, or explicit `USER root` without justification.
- **Missing HEALTHCHECK** (reliability): production Dockerfiles without a HEALTHCHECK instruction.
- **Missing apt cleanup** (size): `apt-get install` in a RUN layer without `rm -rf /var/lib/apt/lists/*` in the same layer.

When `{{adapt.lint_command}}` (e.g. `hadolint --format json Dockerfile`) produces output, use its findings as the primary source. Add LLM-detected issues only for patterns the tool does not cover.

## Low-noise behavior

No-op silently when:

- No Dockerfile or Docker Compose files are changed in the diff.
- The pull request is a draft.
- No violations are found in the changed lines.
- A wobblie-owned comment already exists with identical findings.

If a wobblie-owned comment already exists on the pull request, update the comment in place. Remove findings that no longer apply after a push.

## Output format

Single comment (or in-place update) on the pull request:

- Opening line: "Found Dockerfile best-practice issues in changed files:"
- List: one bullet per finding (max 5), each showing file path, line number, violation description, and severity (security/performance/reliability/size).
- Format per finding: `**file:line** — description [severity]`
- If `{{adapt.lint_command}}` was used, note the tool name in the opening line.
- Closing line: "See [Dockerfile best practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) for guidance."
- Do not use tables, code fences, or nested lists.

## Limits

- Maximum 1 comment per pull request; edit in place on subsequent pushes.
- Maximum 5 findings shown per comment, prioritized by severity (security > reliability > performance > size).
- Do not block, request changes, or merge.

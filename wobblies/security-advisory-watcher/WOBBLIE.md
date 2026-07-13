---
id: security-advisory-watcher
purpose: Runs weekly dependency vulnerability audits via sandbox and opens tracking issues for high-severity vulnerable packages discovered in the dependency tree.
integrations:
  - github
routines:
  - Run the configured dependency audit command (`{{adapt.audit_command}}`, default `pnpm audit --json`) via sandbox and parse the structured JSON output.
  - Filter audit results to high-severity and critical-severity vulnerable packages, skipping dev-only dependencies unless `{{adapt.include_dev}}` is set to true.
  - Deduplicate against existing open vulnerability tracking issues by matching on package name and severity in the issue title.
  - Open one GitHub issue per newly discovered high-severity vulnerable package, including affected package name, severity, vulnerable version range, recommended upgrade, and the relevant audit output excerpt.
deny:
  - Do not open duplicate vulnerability issues when an open issue already exists for the same package and severity.
  - Do not automatically upgrade, patch, or modify dependency files.
  - Do not report low-severity or moderate-severity findings unless `{{adapt.include_low_severity}}` is explicitly set.
  - Do not act on false positives in packages suppressed via `{{adapt.ignore_advisories}}`.
  - Do not close or resolve vulnerability tracking issues automatically.
schedule: '0 6 * * 1'
---

# Dependency Vulnerability Watcher

## Overview

Runs a weekly scheduled dependency vulnerability audit using the sandbox, parses the output for high-severity and critical findings, and opens one tracking issue per newly detected vulnerable package. Does not modify code or dependency files.

## Scope

Audit the dependency tree of the repository containing this wobblie. Scope is the default branch only.

## Repository configuration

Use these repository-specific values:

- Audit command: `{{adapt.audit_command}}` (default: `pnpm audit --json`)
- Include dev dependencies: `{{adapt.include_dev}}` (default: `false`)
- Include low/moderate severity: `{{adapt.include_low_severity}}` (default: `false`)
- Suppressed package list: `{{adapt.ignore_advisories}}` (default: `[]`)

## Signal threshold

Include a vulnerability in issue tracking only when:

- Severity is `high` or `critical` (unless `{{adapt.include_low_severity}}` is set).
- The package is not in the `{{adapt.ignore_advisories}}` suppression list.
- The vulnerability affects the resolved version present in the lockfile.

Exclude:

- Dev-only dependencies when `{{adapt.include_dev}}` is false.
- Packages already suppressed or overridden with a non-vulnerable patched version in the lockfile.
- Findings where the audit tool explicitly marks the severity as `info` or `low`.

## Low-noise behavior

No-op silently when the audit command exits with no high-severity or critical findings.

Before opening a new issue, search existing open GitHub issues for a title containing the package name and the label `security-vulnerability`. If a matching open issue is found, no-op for that package.

No-op silently when the sandbox is unavailable or the audit command fails to produce parseable output.

## Output format

Open one GitHub issue per newly discovered high-severity vulnerable package with:

- Title: `[security] <package-name> has a <severity> vulnerability (affects <version>)`
- Label: `security-vulnerability`
- Body sections:
  - **Package**: name and affected version
  - **Severity**: critical or high
  - **Vulnerable range**: affected version range and fixed-in version
  - **Recommended fix**: upgrade command (e.g. `pnpm add <package>@<fixed-version>`)
  - **Evidence**: relevant excerpt from the audit JSON output (truncated to 20 lines)
- Do not use tables, nested lists, or code fences in the issue body prose.

## Limits

- Maximum 5 new issues opened per weekly run to avoid overwhelming the issue tracker.
- Do not open issues faster than 1 per 10 seconds to avoid GitHub rate-limit errors.

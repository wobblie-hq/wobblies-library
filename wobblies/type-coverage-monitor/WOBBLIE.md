---
id: type-coverage-monitor
purpose: Measures TypeScript strict-mode type coverage on a weekly schedule and opens a tracking issue when coverage falls below the configured minimum.
integrations:
  - github
routines:
  - Run the configured type coverage command (`{{adapt.type_coverage_command}}`, default `pnpm dlx type-coverage --strict --detail`) via sandbox to measure the percentage of strongly-typed expressions.
  - Compare the measured type coverage percentage against the configured minimum (`{{adapt.min_pct}}`) and record the result in wobblie memory alongside the run date.
  - Track the week-over-week trend in type coverage using stored results from previous runs.
  - Open or update a single tracking issue when type coverage falls below `{{adapt.min_pct}}`; include the current percentage, the trend direction, and the top files with the most `any`-typed expressions; close the issue when coverage recovers above the minimum.
deny:
  - Do not modify TypeScript source code or configuration files.
  - Do not open more than one tracking issue at a time; update the existing one if coverage remains below the minimum.
  - Do not comment on individual pull requests.
  - Do not close the tracking issue until coverage is confirmed above `{{adapt.min_pct}}` on two consecutive weekly runs.
schedule: '0 7 * * 1'
---

# Type Coverage Monitor

## Overview

Runs weekly, measures TypeScript strict-mode type coverage via sandbox, tracks the trend over time, and opens one tracking issue when coverage drops below the configured minimum. Never modifies code or comments on pull requests.

## Scope

Measure type coverage for the entire repository containing this wobblie, scanning all TypeScript source files except those excluded by `{{adapt.exclude_paths}}`.

## Repository configuration

Use these repository-specific values:

- Type coverage command: `{{adapt.type_coverage_command}}` (default: `pnpm dlx type-coverage --strict --detail`)
- Minimum type coverage percentage: `{{adapt.min_pct}}` (default: `90`)
- Paths to exclude from scanning: `{{adapt.exclude_paths}}` (default: `["node_modules", "dist", "build"]`)

## Signal threshold

Open or update the tracking issue only when:

- The measured type coverage percentage is below `{{adapt.min_pct}}` on the current run.

No-op (or close the tracking issue) when:

- Coverage is at or above `{{adapt.min_pct}}` on two consecutive weekly runs.

## Low-noise behavior

No-op silently when type coverage is at or above `{{adapt.min_pct}}`.

If a wobblie-owned tracking issue is already open, update it with the current measurement rather than opening a new one.

Close the tracking issue when coverage has recovered to or above `{{adapt.min_pct}}` on two consecutive runs, to prevent false recoveries from a single passing measurement.

No-op silently when the sandbox is unavailable or the type coverage command fails to produce parseable output; retain the previous measurement in memory.

## Output format

Single tracking issue (open or update) when coverage is below minimum:

- Title: `[type-coverage] TypeScript type coverage below {{adapt.min_pct}}% (current: X.X%)`
- Label: `type-coverage`
- Body sections:
  - **Current coverage**: X.X% (run date)
  - **Trend**: direction and delta from previous week (e.g. "down 0.8pp from last week")
  - **Top files with `any`**: up to 5 files with the highest count of `any`-typed expressions and their counts
  - **Minimum configured**: `{{adapt.min_pct}}`%
- Do not use tables, nested lists, or code fences.

## Limits

- One tracking issue at a time; update in place.
- Maximum 5 files listed in the tracking issue body.
- Store at most 4 weeks of historical measurements in wobblie memory.

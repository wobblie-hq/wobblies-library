---
id: feature-flag-cleanup
purpose: Retire feature flags that are fully rolled out or dead, one small evidence-backed removal PR at a time.
integrations:
  - github
routines:
  - Scan the repository for feature flag definitions and usages matching the configured flag pattern.
  - Identify flags that are stale — permanently enabled in all configurations, referenced nowhere, or unchanged past the age threshold.
  - Select the single highest-confidence stale flag.
  - Open one pull request removing that flag and its dead branches, with evidence for why it is safe.
deny:
  - Do not remove more than one flag per pull request.
  - Do not remove a flag whose value differs between environments or configurations.
  - Do not change runtime behavior; removals must be behavior-preserving given the flag's stuck value.
  - Do not touch flags matching the keep-list.
  - Do not open a new PR while a previous flag-cleanup PR is still open.
schedule: '0 8 * * 1'
---

# Feature Flag Cleanup

## Repository configuration

- Flag pattern: `{{adapt.flag_pattern}}` (regex or helper name identifying flag reads, e.g. `isEnabled\(|flags\.`)
- Flag config paths: `{{adapt.flag_config_paths}}` (where flag values/definitions live)
- Keep-list: `{{adapt.keep_list}}` (comma-separated flag names never to touch)
- Age threshold: `{{adapt.min_age_days}}` days without modification (default 60)

## Staleness criteria

A flag is a removal candidate only when at least one holds, verified from repository evidence:

- enabled (or disabled) identically in every configuration, with no runtime override mechanism in evidence
- defined but referenced nowhere outside its definition
- gates code whose both branches are now identical

And in all cases: last modified longer ago than the age threshold, and not on the keep-list.

## Removal method

Remove the flag definition, inline the surviving branch, delete the dead branch, and remove now-unused imports. Run the repository's test suite in the sandbox; abandon the PR (no-op) if tests fail after removal.

## Output format

One pull request:

- title: `chore: remove stale feature flag <name>`
- body: the staleness evidence (stuck value with config citations, or zero-reference proof), the age, and the test run result
- diff limited to the flag's definition, usages, and dead code

## Limits

- Maximum 1 flag removed per run.
- Maximum 10 files changed per PR; skip flags requiring broader changes.

## No-op when

- no flag meets every staleness criterion with high confidence
- a previous flag-cleanup PR is still open
- the test suite fails after removal

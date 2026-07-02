---
id: secret-leak-watcher
purpose: Catch credentials entering the codebase at review time, before they reach the default branch.
integrations:
  - github
  - slack
watch:
  - when a pull request is opened
  - when a pull request is synchronized
routines:
  - Scan lines added in the pull request diff for credential patterns — API keys, tokens, private keys, connection strings with embedded passwords.
  - Discard matches that are clearly placeholders, examples, test fixtures, or documented templates.
  - Comment on the pull request naming the file and line of each probable leak, with the secret value masked.
  - Alert the configured Slack channel when a probable leak has high confidence.
deny:
  - Do not quote or reproduce the full secret value anywhere; always mask to the first four characters.
  - Do not modify files, revert commits, or close the pull request.
  - Do not flag placeholder values, documented examples, or obvious test doubles.
  - Do not act on lines removed by the diff.
  - Do not repeat an equivalent warning for an unchanged finding.
---

# Secret Leak Watcher

## Repository configuration

- Alert channel: `{{adapt.alert_channel}}` (Slack channel for high-confidence alerts; empty disables Slack alerts)
- Allowed paths: `{{adapt.allowed_paths}}` (globs where secret-like strings are expected, e.g. `**/fixtures/**`; default empty)

## Detection policy

Flag added lines matching credential shapes: provider-prefixed keys (AWS `AKIA`, GitHub `ghp_`/`ghs_`, Stripe `sk_live_`, Slack `xox`), private key blocks, bearer tokens, and `password`/`secret`/`token` assignments to high-entropy literals of 12+ characters.

Suppress matches that are placeholders (`YOUR_`, `REPLACE_`, `example`, `<...>`, `${...}`), inside allowed paths, or in `.env.example`-style template files.

Confidence:

- high: provider-prefixed key shape or private key block
- moderate: high-entropy assignment without a recognizable prefix

## Output format

One PR comment, edited in place on subsequent pushes:

- one bullet per finding: `file:line — <pattern type> — value starts with 'abcd…'` and confidence
- a fixed remediation footer: rotate the credential, remove it from the diff, and use the team's secret store

High-confidence findings additionally send one Slack `mrkdwn` message with the PR link and file (never the value).

## Limits

- Maximum 10 findings listed; state the overflow count beyond that.
- Maximum 1 PR comment (edited in place) and 1 Slack alert per push.

## No-op when

- the diff adds no lines matching a credential shape
- every match is a suppressed placeholder or allowed-path fixture
- findings are unchanged since the last scan of this PR

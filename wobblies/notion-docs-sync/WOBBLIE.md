---
id: notion-docs-sync
purpose: Keep repository docs and their Notion counterparts telling the same story, syncing drift in the right direction.
integrations:
  - notion
  - github
watch:
  - A Notion page in the configured docs database is updated.
  - when a pull request is opened
routines:
  - Determine whether the triggering change creates drift between a Notion page and its mapped repository document.
  - Decide sync direction by source of truth — repository wins for code-derived docs, Notion wins for product and process docs.
  - Open one pull request applying Notion-side changes to the mapped repository files, showing the change as a normal reviewable diff.
  - Comment on the Notion page with a link to the repository change when the repository side moved first.
deny:
  - Do not delete or archive Notion pages or repository files.
  - Do not overwrite conflicting edits; when both sides changed, surface the conflict instead of picking a winner.
  - Do not sync pages or paths outside the configured mapping.
  - Do not open more than one sync pull request per Notion page per day.
  - Do not modify code, tests, or configuration; documentation files only.
---

# Notion Docs Sync

## Configuration

- Notion database: `{{adapt.notion_database}}` (the database containing synced docs pages)
- Repo sync path: `{{adapt.sync_path}}` (e.g. `docs/`)

Pages map to files by a `repo path` property on the Notion page when present, else by matching slugified title within the sync path. Pages and files without a confident mapping are ignored.

## Direction policy

- Repository is source of truth for anything derived from code: API references, configuration tables, CLI usage.
- Notion is source of truth for product and process docs authored there.
- Both changed since last sync → no automatic write; comment on the Notion page describing the conflict and linking both versions.

## Sync behavior

Notion → repo: one pull request per page, converting page content to the repository's Markdown conventions, preserving front-matter the file already has. Repo → Notion: one short Notion comment linking the merged change and summarizing what moved — never edit the page body silently.

## Output format

Pull request title: `docs: sync <page title> from Notion`. Body: the Notion page link, what changed in one paragraph, and the last-synced marker. Notion comments: two sentences maximum with the GitHub link.

## Limits

- Maximum 1 sync pull request per Notion page per day.
- Maximum 3 pull requests per run.

## No-op when

- the change creates no drift within the configured mapping
- the mapping for the changed page or file is ambiguous
- a sync pull request for this page is already open

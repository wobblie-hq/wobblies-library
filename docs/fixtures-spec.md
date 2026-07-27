# Behavioral fixtures spec

This document defines the per-wobblie behavioral fixture format used by the wobblies-library catalog and consumed by the platform's replay harness (wobblie.ai wobblie-reliability Task 6.4).

## Purpose

Fixtures assert what a wobblie should DO given a specific trigger event. They provide:

- A contract between the library (definitions) and the platform (execution).
- Regression detection when a wobblie definition or platform behavior changes.
- A machine-readable test surface for CI and the platform replay harness.

## File layout

Each wobblie package includes a `fixtures/` directory:

```text
wobblies/<id>/
  WOBBLIE.md
  example.yml
  fixtures/
    trigger.json
    expected.json
    noop-trigger.json      # optional
    noop-expected.json     # optional
```

Every wobblie must have at least `trigger.json` + `expected.json`. Where meaningful, a `noop-trigger.json` + `noop-expected.json` pair asserts the low-signal/no-op path.

## `trigger.json`

A sanitized trigger event. Uses synthetic data (`acme-corp/demo-repo`) and contains no real org/user data.

```jsonc
{
  "type": "pull_request",          // event type
  "action": "opened",             // optional event action
  "source": "github",             // integration source
  "payload": {                    // sanitized event payload
    "repository": "acme-corp/demo-repo",
    "number": 42,
    "title": "Add new feature",
    "head_branch": "feat/new-feature",
    "base_branch": "main",
    "diff_files": ["src/app.ts", "README.md"]
    // ... fields relevant to the wobblie's behavior
  },
  "metadata": {                   // optional delivery metadata
    "deliveryId": "test-delivery-001",
    "timestamp": "2026-01-15T10:00:00Z"
  }
}
```

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | yes | Event type (e.g. `pull_request`, `schedule`, `issue`, `review`) |
| `action` | string | no | Event action (e.g. `opened`, `synchronized`, `submitted`) |
| `source` | string | yes | Integration source (e.g. `github`, `slack`, `linear`, `schedule`) |
| `payload` | object | yes | Sanitized event data relevant to the wobblie |
| `metadata` | object | no | Delivery metadata (deliveryId, timestamp) |

### Sanitization rules

- Use `acme-corp/demo-repo` as the repository name.
- Use synthetic usernames like `alice`, `bob`, `carol`.
- Never include real tokens, URLs to private resources, or PII.
- All fixture content is subject to the same public-safety scanning as other catalog content.

## `expected.json`

The expected outcome when the wobblie processes the trigger.

```jsonc
{
  "actions": [
    {
      "type": "comment",
      "targetPattern": "^acme-corp/demo-repo#\\d+$",
      "contentMustMatch": ["branch name", "convention"],
      "contentMustNotMatch": ["```"]
    }
  ],
  "maxActions": 1,
  "allowNoop": false
}
```

### Schema

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `actions` | array | yes | Expected action specifications |
| `maxActions` | integer | yes | Upper bound on total actions (inclusive) |
| `allowNoop` | boolean | yes | Whether zero actions is acceptable |
| `noopReason` | string | no | Why a no-op is expected (for noop-expected.json) |

### Action fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | string | yes | Action type from the platform capability manifest |
| `targetPattern` | string | no | Regex the action target must match |
| `contentMustMatch` | string[] | no | Regex patterns that must all appear in content |
| `contentMustNotMatch` | string[] | no | Regex patterns that must not appear in content |

### Action types

Action types must exist in the platform capability manifest (`src/examples/platform-capabilities.ts`). Common types:

- `comment` — GitHub PR/issue comment
- `create_issue` — GitHub issue creation
- `create_pr` — GitHub PR creation
- `label` — GitHub label application
- `slack.message` — Slack message
- `run_command` — Sandbox command execution

### No-op fixtures

`noop-trigger.json` + `noop-expected.json` test the low-signal path:

```jsonc
// noop-expected.json
{
  "actions": [],
  "maxActions": 0,
  "allowNoop": true,
  "noopReason": "PR branch name matches the required naming convention"
}
```

## Validation

The library validates fixtures via `src/examples/__tests__/fixtures.test.ts`:

1. Every `wobblies/*/` directory has `fixtures/trigger.json` + `expected.json`.
2. All fixture files parse against the zod schemas in `src/examples/fixture-schema.ts`.
3. Every expected action type exists in the platform capability manifest.
4. Every regex in `targetPattern`, `contentMustMatch`, `contentMustNotMatch` compiles.
5. Trigger payloads pass public-safety scanning.

Run locally:

```bash
bun run test src/examples/__tests__/fixtures.test.ts
```

## Platform replay harness integration

The platform's replay harness (`wobblie.ai/apps/api/scripts/replay-activation.ts`, wobblie-reliability Task 6.4) consumes these fixture files directly. Field names and schema are coordinated between the library and the harness. If the harness defines additional fields, they should be added here as optional fields to maintain compatibility.

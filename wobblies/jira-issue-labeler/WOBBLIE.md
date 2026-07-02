---
id: jira-issue-labeler
purpose: Keep recently changed Jira issues labeled according to the project's current label and component conventions.
integrations:
  - jira
routines:
  - Survey recently created or updated issues inside the configured Jira project scope.
  - Load the project's labels and components, including descriptions and existing usage context.
  - Determine clearly supported missing labels or components from live metadata and issue content.
  - Add unambiguous missing labels or post one compact repair proposal when the evidence conflicts.
deny:
  - Do not apply labels or components that are clearly retired or superseded by convention.
  - Do not remove or replace existing labels or components.
  - Do not change issue status, priority, assignee, sprint, epic link, estimate, due date, or description.
  - Do not guess between two plausible labels in the same label family.
  - Do not repeat the same repair proposal for an unchanged conflict.
schedule: '0 */4 * * *'
---

# Jira Issue Label Hygiene Helper

## Label discovery

At the start of each activation, load the labels and components in use for the configured project. Jira labels carry no descriptions, so infer meaning from existing usage: which issue types, components, and summaries each label appears with. Components have descriptions — use them.

Treat live project usage as the source of truth. If usage is too sparse or contradictory to choose confidently, no-op or post a repair proposal instead of mutating.

## Scope

Default scope:

- issues created or updated in the last 4 hours
- open (not Done/Closed) issues only
- the projects configured for this repository or workspace

Do not scan other projects unless the wobblie file is intentionally updated to do so.

## Decision policy

Add a missing label or component when:

- live usage makes its meaning clear
- exactly one option in that family is supported by issue evidence
- applying it does not conflict with existing labels or components

Post a repair proposal instead of mutating when:

- multiple options in one family could apply
- existing labels conflict with observed conventions
- the summary and description do not provide enough context

## Repair proposal format

One concise issue comment:

```md
Label repair needed

Recommended: <labels/components>
Reason: <short rationale>
Blocked because: <specific uncertainty or conflict>
```

## Limits

- Max issues inspected per run: 100 recently changed issues
- Max issues mutated per run: 30
- Max repair proposal comments per run: 10
- Max labels or components added per issue per run: 5

## Idempotency

Never add duplicates. Re-running with unchanged issue data must produce no additional writes. Do not repeat a repair proposal while the issue's labels, summary, and description are unchanged.

## No-op when

- project label and component usage cannot be read
- usage provides too little signal for confident labeling
- no recently changed in-scope issues need labels
- the correct label cannot be selected with high confidence

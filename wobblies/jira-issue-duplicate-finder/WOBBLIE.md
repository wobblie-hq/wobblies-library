---
id: jira-issue-duplicate-finder
purpose: Reduce duplicate Jira issue triage by suggesting likely matches without changing issue state.
integrations:
  - github
  - jira
watch:
  - when a Jira issue is created
routines:
  - Skip the new issue when it is already resolved, closed, or otherwise inactive.
  - Search likely duplicate or related Jira issues, checking the same project before broader mapped repository context.
  - Search linked GitHub work for corroborating pull requests, issues, branches, or commits.
  - Comment on the triggering Jira issue with up to five candidate matches, confidence, and evidence when useful candidates exist.
deny:
  - Do not close, resolve, link, relabel, reassign, or reprioritize Jira issues.
  - Do not edit, close, label, assign, or comment on GitHub issues or pull requests.
  - Do not claim that an issue is definitely duplicate unless the evidence is conclusive.
  - Do not post more than five candidate duplicate or related items.
  - Do not repeat an equivalent duplicate-finder comment for unchanged issue content and candidates.
---

# Jira Issue Duplicate Finder

## Search method

Match on concrete shared evidence, strongest first:

1. identical or near-identical error messages, stack traces, or feature names
2. the same repository files, endpoints, or components named in both issues
3. linked GitHub work (PRs, branches, commits) pointing at the same change

Shared generic vocabulary is never sufficient. Search the triggering issue's own project first, then related projects mapped to the same repository.

## Output format

One Jira comment listing candidates:

- each candidate: issue key, one-line evidence, confidence (likely duplicate / possibly related)
- order by confidence
- close with one sentence inviting the assignee to link or close as duplicate if confirmed — the wobblie never does this itself

## Limits

- Maximum 1 comment per triggering issue.
- Maximum 5 candidates.

## No-op when

- the new issue lacks enough content to search meaningfully
- no candidate has concrete shared evidence
- the issue is already resolved, closed, or marked duplicate
- an equivalent comment already exists for unchanged content

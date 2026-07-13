---
id: jira-pr-link-reconciler
purpose: Keep Jira issue discussions connected to likely GitHub code work by suggesting candidate links for human confirmation.
integrations:
  - github
  - jira
watch:
  - when a Jira issue is created
  - when a Jira issue comment is added
routines:
  - Decide whether the triggering issue or comment mentions active code work that may live in GitHub.
  - Search likely related GitHub pull requests, branches, and commits using the issue key, explicit URLs, summary terms, and branch names.
  - Post a Jira comment with candidate links or a confirmation ask when confidence is useful but automatic linking would be unsafe.
deny:
  - Do not edit Jira issue links, status, labels, assignee, priority, sprint, epic link, estimate, due date, summary, or description.
  - Do not edit GitHub pull request titles, bodies, labels, assignees, reviewers, branches, commits, issues, or comments.
  - Do not infer a repository when the project-to-repository mapping is missing or ambiguous.
  - Do not post candidate links when issue identity or candidate confidence is ambiguous.
  - Do not require a custom branch naming convention to find candidates.
  - Do not repeat an equivalent candidate-link comment for unchanged evidence.
---

# Jira PR Link Reconciler

## Candidate search

Search the mapped repository for, strongest first:

1. the Jira issue key (e.g. `PROJ-123`) in PR titles, bodies, branch names, or commit messages
2. explicit GitHub URLs quoted in the issue or comment
3. summary terms matching PR titles or branch names, only when distinctive

The issue key match is near-conclusive; term matches need at least two independent signals.

## Output format

One Jira comment:

- each candidate: PR or branch link, one-line evidence, confidence
- maximum 3 candidates, strongest first
- one closing sentence asking the assignee to confirm and link (the wobblie never creates the link itself)

## Limits

- Maximum 1 comment per triggering issue or comment event.
- Maximum 3 candidates.

## No-op when

- the issue or comment does not reference active code work
- the project has no confident repository mapping
- no candidate meets the evidence bar
- an equivalent comment already exists for unchanged evidence

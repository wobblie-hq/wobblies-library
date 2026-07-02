---
id: vercel-deploy-failure-diagnoser
purpose: Turn a failed Vercel deployment into a specific, probable cause posted where the author will see it.
integrations:
  - vercel
  - github
watch:
  - A Vercel deployment fails for a monitored project.
routines:
  - Read the failed deployment's build log and identify the first genuine error, not downstream noise.
  - Classify the failure as build error, missing environment variable, dependency problem, or platform limit.
  - Locate the pull request or commit that produced the deployment.
  - Post one comment on that pull request with the classified cause, the key log lines, and a concrete suggested fix.
deny:
  - Do not redeploy, cancel, promote, or roll back deployments.
  - Do not modify environment variables or project settings.
  - Do not comment when the deployment was cancelled rather than failed.
  - Do not paste more than fifteen log lines.
  - Do not repeat an equivalent diagnosis for the same failing cause on the same pull request.
---

# Vercel Deploy Failure Diagnoser

## Scope

Act on deployments with state `ERROR` for projects linked to this repository. Preview and production deployments both count; the comment notes which.

## Diagnosis method

Find the first error in the build log — the earliest line that made the build unrecoverable — and classify:

- build error: type error, lint failure, framework build exception (name the file and line when present)
- missing environment variable: undefined env reference, auth failure against a service needing credentials
- dependency problem: install failure, version conflict, lockfile mismatch
- platform limit: bundle/function size, build timeout, quota

Suggest the smallest fix consistent with the evidence (e.g. "add `DATABASE_URL` to the Preview environment", "pin `x` to the version in the lockfile"). If the log supports no confident classification, say so and post the key excerpt without guessing.

## Output format

One PR comment:

- first line: deployment target (preview/production) and `failed`
- classification and probable cause in one sentence
- up to 15 relevant log lines in a code block
- suggested fix as a single imperative sentence
- link to the Vercel deployment

On subsequent failed deployments of the same PR with the same cause, edit the existing comment instead of posting a new one.

## Limits

- Maximum 1 comment per pull request, edited in place.
- Maximum 15 log lines quoted.

## No-op when

- the deployment succeeded, was cancelled, or was superseded
- no pull request or commit can be identified for the deployment
- an equivalent diagnosis is already posted and the cause is unchanged

# Task 4: Rewrite PR-analysis stubs (REQ-3)

## Context

These 6 wobblies analyze PR content for a specific quality dimension. Same
stub problems as Task 3 (generic routines + redundant schedule). Rewrite
per design **D3**; model files: `wobblies/pr-review-triage/WOBBLIE.md`,
`wobblies/docs-drift-maintainer/WOBBLIE.md`. Analysis wobblies differ from
enforcers: findings are judgment calls, so the Signal threshold section
must be strict about confidence ("comment only on findings you can cite
to a specific changed line; at most N findings; skip style nits").

General rules: watch-only triggers (drop schedule); max 1 comment per PR,
edited in place on synchronize; explicit no-op when the diff doesn't touch
the wobblie's domain; deny lists tailored; sandbox `run_command` allowed
where a real tool beats LLM judgment (state the tool and its
`{{adapt.*}}` override).

## Subtasks

- [ ] 4.1 `accessibility-checker` — scope to changed UI files
      (`{{adapt.ui_globs}}`, default common frontend extensions); check
      changed markup for concrete a11y issues (missing alt, unlabeled
      inputs, click-only handlers, contrast-suspect inline styles,
      heading-order breaks); cite WCAG criterion per finding; max 5
      findings.
- [ ] 4.2 `api-breaking-change-detector` — scope to API surface
      (`{{adapt.api_globs}}`: route handlers, exported types, OpenAPI
      specs, GraphQL schemas); classify removed/renamed endpoints,
      narrowed types, new required params, changed response shapes;
      comment with a Breaking/Possibly-breaking table + migration hint;
      optional label `{{adapt.breaking_label}}`.
- [ ] 4.3 `build-size-monitor` — trigger on dependency-manifest or
      bundler-config changes; estimate impact (new dep size, duplicated
      dep trees) from lockfile evidence, or run
      `{{adapt.size_command}}` in the sandbox when configured; comment
      only when estimated impact > `{{adapt.threshold_kb}}` (default 50).
- [ ] 4.4 `dockerfile-linter` — trigger only when Dockerfile/compose
      files change; check pinned base tags, layer-cache ordering, secrets
      in build args, root user, missing HEALTHCHECK, apt cleanup; cite
      the line; max 5 findings; prefer hadolint via sandbox
      (`{{adapt.lint_command}}`) with LLM fallback.
- [ ] 4.5 `error-handling-reviewer` — scope to changed code paths that
      add I/O, network, or async calls; flag swallowed exceptions, bare
      catches, missing error propagation, unhandled promise rejections;
      only findings anchored to changed lines; max 3 findings, highest
      severity first.
- [ ] 4.6 `migration-reviewer` — trigger when files under
      `{{adapt.migration_globs}}` change; check reversibility, lock-risk
      operations (long table rewrites, non-concurrent index creation),
      destructive changes without backfill, mixed schema+data migrations;
      comment with severity per finding; never modify the migration.

For each: run the lint, fix findings, remove the id from the grandfather
allowlist. After this task the allowlist must be EMPTY — delete the
grandfather mechanism if Tasks 2–3 are done, or note what remains.

## Verification

```bash
cd /Users/drfarr/code/wobblies-library
bun scripts/validate-examples.ts   # zero errors, zero grandfathered ids
bun run test && bun run typecheck
git diff --stat wobblies/
```

## Exit criteria

- All 6 pass ungrandfathered; grandfather list empty (or documented
  residue); every wobblie states scope globs, confidence bar, finding cap.

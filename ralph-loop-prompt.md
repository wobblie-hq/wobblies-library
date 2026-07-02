# Ralph Agent Instructions

## ⛔ CRITICAL CONSTRAINT — READ THIS FIRST

You must implement exactly ONE top-level task per invocation. This is non-negotiable.

- ONE top-level task means: a single root-level item (e.g., `1.`, `2.`, `3.`) and all of its subtasks (e.g., `2.1`, `2.2`, `2.3`).
- After completing that one top-level task and its subtasks, you MUST STOP implementing. Do not continue to the next top-level task. Instead, proceed to Phase 5 (Verify Exit Criteria) and Phase 6 (Update Tracking) for the task you just completed.
- Do not implement, touch, or mark any other top-level task — even if it seems small, related, or easy.
- If you catch yourself thinking "I can also knock out task N while I'm here" — STOP implementing. That is exactly the behavior this rule prohibits. Move on to verification and tracking for your one task.
- Violating this constraint invalidates the entire run.

## Phase 1: Load Context

Read the following files to understand the project. Skip any that don't exist.

1. `.kiro/steering/product.md` — what the product is
2. `.kiro/steering/structure.md` — project structure conventions
3. `.kiro/steering/tech.md` — tech stack and tooling
4. `.kiro/specs/SPECS_NAME/requirements.md` — requirements and exit criteria
5. `.kiro/specs/SPECS_NAME/design.md` — architecture and design decisions
6. `.kiro/specs/SPECS_NAME/tasks.md` — the task list to implement
7. `.kiro/specs/SPECS_NAME/progress.md` — **read the top sections (Corrections and Codebase Patterns) FIRST and internalize them before doing anything else**, then review past progress entries

## Tool Awareness

After loading context, take stock of what tools are available to you in this environment (e.g., MCP servers, CLI utilities, linters, formatters, test runners, build tools). Use your judgment: if a tool would genuinely help with the current task, use it. If not, don't force it.

## Phase 2: Pick ONE Task

Capture the task start time by running:

```bash
date '+%Y-%m-%d %H:%M:%S'
date +%s
```

1. Find the lowest-numbered **top-level** task in `tasks.md` that is NOT marked with `[X]`.
2. Read the requirement(s) and exit criteria referenced by that task in `requirements.md`
3. Read the relevant design details in `design.md`
4. Do NOT pick more than one top-level task.

## Phase 3: Understand Before Implementing

Before writing any code:

1. Read the existing source files that are relevant to the task
2. Understand the current patterns, naming conventions, and structure already in use
3. **Re-read the Corrections section** at the top of `progress.md` — apply every relevant correction proactively
4. Re-read the Codebase Patterns section — follow any patterns relevant to this task

## Phase 4: Implement

1. Implement the task and all its subtasks in their specified order
2. Follow the project's existing conventions and patterns
3. After implementation, run typecheck and tests as applicable
4. If a command fails or a test breaks:
   a. Fix the issue
   b. **Immediately ask: "Could a future iteration hit this same problem?"** If yes, add it to the Corrections section RIGHT NOW.
   c. If you cannot resolve after 5 attempts, log as unresolved blocker, mark task `[F]`, move to Phase 6.
5. **STOP CHECK:** You have finished your one top-level task. Go to Phase 5.

## Phase 5: Verify Exit Criteria

1. Re-read the exit criteria from `requirements.md` and confirm each is satisfied.
2. Re-read the design constraints from `design.md` and confirm conformance.
3. If anything is missing, go back and address it.

## Phase 6: Update Tracking

1. Mark ONLY the single task you just completed with `[X]` in `tasks.md`. Use surgical edit.
2. Append a progress entry to `progress.md` (see format below)
3. If you discovered a reusable codebase pattern, add it to the Codebase Patterns section
4. Final sweep: add any errors not yet in Corrections
5. Capture end time and compute elapsed:

```bash
date '+%Y-%m-%d %H:%M:%S'
date +%s
echo $(( END_EPOCH - START_EPOCH ))
```

Append to `specs_time.md`:

```
| [Task ID] | [Start time] | [End time] | [Elapsed time] |
```

## Progress Entry Format

```
## [Date] - [Task ID]: [Brief description]
- What was implemented
- Files changed
- Tools used
- Patterns discovered
- Corrections added
---
```

## Corrections

Maintain a `# Corrections` section at the VERY TOP of `progress.md`. Format:

```
- ❌ `wrong thing` → ✅ `right thing` (reason)
- ❌ UNRESOLVED: [description]
```

## Codebase Patterns

Maintain a `# Codebase Patterns` section below Corrections in `progress.md`. Only record patterns actually encountered during implementation.

## Stop Condition

After completing your one task, check if ALL tasks in `tasks.md` are marked `[X]`.

If all complete, generate `.kiro/specs/SPECS_NAME/summary.html` (self-contained dashboard) and reply with:

```
<promise>COMPLETE</promise>
```

If tasks remain, end normally.

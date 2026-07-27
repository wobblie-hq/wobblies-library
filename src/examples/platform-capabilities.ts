/**
 * Platform Capability Manifest — wobblies-library
 *
 * Single source of truth for what the wobblies platform can do.
 * Used by the capability-feasibility lint rule in authoring-lint.ts.
 *
 * UPDATE PROCEDURE
 * ----------------
 * When the platform ships a new capability (action type, integration, or sandbox tool):
 *  1. Add it to the relevant list below.
 *  2. Remove the `pendingSince` annotation from the capability if it had one.
 *  3. Bump `version` to today's UTC date (YYYY-MM-DD).
 *  4. Cross-reference the companion spec in wobblies.ai at
 *     `.kiro/specs/wobblie-reliability/` — specifically Task 1 (read actions)
 *     and Task 2 (sandbox tools) which add the `pending` capabilities below.
 *  5. Open a PR referencing the platform release that shipped the capability.
 *
 * DUPLICATION NOTE
 * ----------------
 * The capability→keyword map in authoring-lint.ts mirrors the platform's own
 * capability lint (wobblie-reliability Task 4). Keep both lists textually
 * identical until a shared package exists. Note the duplication in both files.
 */

export const PLATFORM_CAPABILITIES = {
  version: "2026-07-05",

  /**
   * Integration providers the platform can connect to.
   * A wobblie may only reference integrations present in this list.
   */
  integrations: [
    "github",
    "slack",
    "linear",
    "notion",
    "jira",
    "sentry",
    "vercel",
  ] as const,

  actions: {
    /**
     * Write actions the platform can perform on behalf of a wobblie.
     */
    write: [
      "comment",
      "create_pr",
      "create_issue",
      "update_issue",
      "label",
      "request_review",
      "slack.message",
      "slack.reaction",
      "linear.create_issue",
      "linear.update_issue",
      "linear.comment",
      "jira.create_issue",
      "jira.update_issue",
      "jira.comment",
      "notion.create_page",
      "notion.update_page",
      "vercel.cancel_deployment",
    ] as const,

    /**
     * Read actions the platform can perform.
     * All three shipped on 2026-07-27 (pending since 2026-07-05 under platform
     * Task 1, wobblie-reliability), so the capability lint no longer warns.
     */
    read: [
      "github.list_prs",
      "github.list_workflow_runs",
      "slack.read_channel",
    ] as const,

    /**
     * Sandbox execution (shell commands via run_command).
     */
    sandbox: [
      "run_command",
    ] as const,
  },

  /**
   * Tools available inside the sandbox.
   * NOTE: `gh` is pending platform Task 2 (wobblie-reliability). It is listed
   * here so wobblies can be authored against it; capability lint emits `warn`
   * until the platform ships it.
   */
  sandboxTools: [
    "node",
    "pnpm",
    "git",
    "gh",   // pendingSince: "2026-07-05"
    "jq",
    "curl",
  ] as const,

  /**
   * Capabilities that are declared above but not yet shipped by the platform.
   * The capability-feasibility lint rule emits `warn` (not `error`) for these
   * so the library is not blocked on platform sequencing.
   */
  pendingCapabilities: new Set([
    // github.list_prs, github.list_workflow_runs and slack.read_channel shipped
    // on 2026-07-27 — all three are now in wobblie.ai's
    // PLATFORM_AVAILABLE_ACTIONS (packages/core/src/capability-lint.ts) and
    // backed by tools in apps/api/src/lib/tools/registry.ts.
    "gh",
  ]),

  /**
   * Capabilities that are NOT in any list above.
   * Referenced here for documentation only — wobblies requiring these will
   * receive a capability-feasibility `error` until the platform ships them.
   * Example: github.security_advisories (security-advisory-watcher needs this).
   */
  notYetPlanned: [
    "github.security_advisories",
  ] as const,
} as const;

export type PlatformIntegration = typeof PLATFORM_CAPABILITIES.integrations[number];
export type PlatformWriteAction = typeof PLATFORM_CAPABILITIES.actions.write[number];
export type PlatformReadAction = typeof PLATFORM_CAPABILITIES.actions.read[number];
export type PlatformSandboxAction = typeof PLATFORM_CAPABILITIES.actions.sandbox[number];
export type PlatformSandboxTool = typeof PLATFORM_CAPABILITIES.sandboxTools[number];

/** All action strings the platform currently supports (including pending). */
export const ALL_PLATFORM_ACTIONS: ReadonlySet<string> = new Set([
  ...PLATFORM_CAPABILITIES.actions.write,
  ...PLATFORM_CAPABILITIES.actions.read,
  ...PLATFORM_CAPABILITIES.actions.sandbox,
]);

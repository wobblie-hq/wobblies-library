/**
 * Authoring lint — machine-checked rules that reject stub-quality definitions.
 *
 * Design: data-driven `{ ruleId, severity, check }[]` so adding a rule never
 * touches the runner. Consumed by runValidateCli (cli.ts).
 *
 * DUPLICATION NOTE
 * ----------------
 * The capability→keyword map below mirrors the platform's own capability lint
 * (wobblie-reliability Task 4). Keep both lists textually identical until a
 * shared package exists.
 */

import { PLATFORM_CAPABILITIES } from './platform-capabilities';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type LintSeverity = 'error' | 'warn';

export interface LintFinding {
  wobblieId: string;
  ruleId: string;
  severity: LintSeverity;
  message: string;
  path?: string | undefined;
}

/** The parsed form of a WOBBLIE.md that lint rules receive. */
export interface ParsedWobblie {
  id: string;
  path: string; // e.g. "wobblies/branch-naming-enforcer/WOBBLIE.md"
  frontmatter: {
    id: string;
    purpose: string;
    watch?: string[] | undefined;
    routines: string[];
    deny?: string[] | undefined;
    schedule?: string | undefined;
  };
  body: string; // everything after the closing ---
}

// ---------------------------------------------------------------------------
// Boilerplate denylists (exact-match; seeded from current stub text)
// ---------------------------------------------------------------------------

/** Routine strings that appear verbatim in every stub. */
const BOILERPLATE_ROUTINES = new Set([
  'Analyze the pull request for relevant signals.',
  'Take appropriate action based on findings.',
  'Comment or create issues with clear, actionable feedback.',
]);

/** Body policy/limits strings that appear verbatim in every stub. */
const BOILERPLATE_BODY_PHRASES = [
  'Act only on clear signals. Prefer concise, actionable feedback over verbose reports.',
  'Maximum 1 action per PR per activation.',
];

// ---------------------------------------------------------------------------
// Stopwords for the specificity heuristic
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with',
  'that', 'this', 'it', 'is', 'are', 'was', 'be', 'been', 'being', 'has',
  'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'can', 'not', 'no', 'nor', 'but', 'so', 'yet', 'both',
  'any', 'all', 'each', 'every', 'more', 'most', 'other', 'such', 'only',
  'own', 'same', 'than', 'too', 'very', 'just', 'at', 'by', 'from', 'up',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which',
  'who', 'whom', 'its', 'their', 'our', 'your', 'my', 'his', 'her', 'we',
  'they', 'he', 'she', 'you', 'i', 'me', 'him', 'us', 'them',
]);

/** Tokenise a string into lower-case, non-stopword stems (simple prefix stem). */
function contentTokens(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const out = new Set<string>();
  for (const word of words) {
    if (!STOPWORDS.has(word) && word.length > 2) {
      // naive stem: take first 5 chars so "validates"/"validate" match, etc.
      out.add(word.slice(0, 5));
    }
  }
  return out;
}

function setsOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const v of a) {
    if (b.has(v)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Watch-rule format pattern (platform parser constraint)
// ---------------------------------------------------------------------------

/** Platform parseWatchTrigger only matches "when a(n) <event> is <action>" */
const WATCH_RULE_FORMAT = /^when an? [\w -]+ is [\w -]+$/i;

// ---------------------------------------------------------------------------
// Capability→keyword map
// DUPLICATION NOTE: keep in sync with wobblie-reliability Task 4 capability lint.
// ---------------------------------------------------------------------------

interface CapabilityKeyword {
  pattern: RegExp;
  /** The capability identifier this maps to (checked against PLATFORM_CAPABILITIES). */
  capability: string;
}

const CAPABILITY_KEYWORDS: CapabilityKeyword[] = [
  // GitHub read capabilities (pending)
  {
    pattern: /ci runs?|workflow runs?|test(?:\s+(?:history|failures))?\s+across/i,
    capability: 'github.list_workflow_runs',
  },
  {
    pattern: /list(?:ing)?\s+(?:open\s+)?(?:pull\s+requests?|prs?)\s+across|across\s+(?:all\s+)?(?:open\s+)?(?:prs?|pull\s+requests?)/i,
    capability: 'github.list_prs',
  },
  // GitHub capabilities not yet planned
  {
    pattern: /security\s+advisor(?:ies|y)/i,
    capability: 'github.security_advisories',
  },
  // Slack read (pending)
  {
    pattern: /slack\s+(?:channel|thread|message\s+histor)/i,
    capability: 'slack.read_channel',
  },
  // Write capabilities — already shipped, just verify integration declared
  {
    pattern: /\blinear\b/i,
    capability: 'linear.create_issue',
  },
  {
    pattern: /\bjira\b/i,
    capability: 'jira.create_issue',
  },
  {
    pattern: /\bnotion\b/i,
    capability: 'notion.create_page',
  },
  {
    pattern: /\bvercel\b/i,
    capability: 'vercel.cancel_deployment',
  },
  {
    pattern: /\bsentry\b/i,
    capability: 'comment', // sentry integration uses comment/issue actions
  },
];

function isKnownCapability(cap: string): boolean {
  const allActions = [
    ...PLATFORM_CAPABILITIES.actions.write,
    ...PLATFORM_CAPABILITIES.actions.read,
    ...PLATFORM_CAPABILITIES.actions.sandbox,
    ...PLATFORM_CAPABILITIES.sandboxTools,
  ];
  return allActions.includes(cap as never);
}

function isPendingCapability(cap: string): boolean {
  return PLATFORM_CAPABILITIES.pendingCapabilities.has(cap);
}

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

interface LintRule {
  ruleId: string;
  severity: LintSeverity;
  check(parsed: ParsedWobblie): string[];
}

const LINT_RULES: LintRule[] = [
  // -------------------------------------------------------------------------
  // boilerplate-routines: exact-match denylist on routine strings
  // -------------------------------------------------------------------------
  {
    ruleId: 'boilerplate-routines',
    severity: 'error',
    check(parsed) {
      const findings: string[] = [];
      for (const routine of parsed.frontmatter.routines) {
        if (BOILERPLATE_ROUTINES.has(routine.trim())) {
          findings.push(
            `Routine is boilerplate stub text: "${routine.trim()}". Replace with a purpose-specific routine.`
          );
        }
      }
      return findings;
    },
  },

  // -------------------------------------------------------------------------
  // boilerplate-body: exact-match denylist on body policy/limits text
  // -------------------------------------------------------------------------
  {
    ruleId: 'boilerplate-body',
    severity: 'error',
    check(parsed) {
      const findings: string[] = [];
      for (const phrase of BOILERPLATE_BODY_PHRASES) {
        if (parsed.body.includes(phrase)) {
          // Only flag schedule-only wobblie for "Maximum 1 action per PR" since it makes
          // no sense there; flag the policy phrase unconditionally as boilerplate.
          if (
            phrase === 'Maximum 1 action per PR per activation.' &&
            parsed.frontmatter.watch
          ) {
            // On a watch wobblie, the phrase might be intentional — still flag
            // if the boilerplate body policy phrase is also present.
          }
          findings.push(
            `Body contains boilerplate stub text: "${phrase}". Replace with purpose-specific policy.`
          );
        }
      }
      return findings;
    },
  },

  // -------------------------------------------------------------------------
  // routine-specificity (error): no routine shares a non-stopword stem with purpose
  // -------------------------------------------------------------------------
  {
    ruleId: 'routine-specificity',
    severity: 'error',
    check(parsed) {
      const purposeTokens = contentTokens(parsed.frontmatter.purpose);
      if (purposeTokens.size === 0) return [];

      const findings: string[] = [];
      for (const routine of parsed.frontmatter.routines) {
        const routineTokens = contentTokens(routine);
        if (!setsOverlap(purposeTokens, routineTokens)) {
          findings.push(
            `Routine "${routine.trim().slice(0, 80)}" shares no meaningful tokens with purpose "${parsed.frontmatter.purpose.slice(0, 80)}". Make routines specific to this wobblie's domain.`
          );
        }
      }
      return findings;
    },
  },

  // -------------------------------------------------------------------------
  // trigger-coherence (error): various trigger/purpose mismatches
  // -------------------------------------------------------------------------
  {
    ruleId: 'trigger-coherence',
    severity: 'error',
    check(parsed) {
      const findings: string[] = [];
      const hasWatch = parsed.frontmatter.watch && parsed.frontmatter.watch.length > 0;
      const hasSchedule = Boolean(parsed.frontmatter.schedule);

      // Both watch AND schedule set → require ## Trigger rationale section
      if (hasWatch && hasSchedule) {
        const hasTriggerRationale = /^##\s+trigger\s+rationale/im.test(parsed.body);
        if (!hasTriggerRationale) {
          findings.push(
            'Both watch and schedule are set. Add a "## Trigger rationale" body section to justify the dual-trigger design.'
          );
        }
      }

      // Purpose implies scheduled scanning but only watch triggers are set
      const scheduledPurposePattern = /monitor|watch\s+for|weekly|daily|across\s+recent|periodically|scan\s+(?:all|across)/i;
      if (scheduledPurposePattern.test(parsed.frontmatter.purpose) && hasWatch && !hasSchedule) {
        findings.push(
          `Purpose "${parsed.frontmatter.purpose.slice(0, 100)}" implies scheduled scanning (monitor/watch/weekly/daily/across recent/periodically), but only watch triggers are set. Add a schedule or change the purpose wording.`
        );
      }

      // Body mentions "per PR" limits but schedule-only trigger
      if (hasSchedule && !hasWatch) {
        const perPrPattern = /per\s+pr\b|per\s+pull\s+request\b/i;
        if (perPrPattern.test(parsed.body)) {
          findings.push(
            'Body mentions "per PR" limits but this wobblie has schedule-only triggers. Remove the per-PR limit or add a watch trigger.'
          );
        }
      }

      return findings;
    },
  },

  // -------------------------------------------------------------------------
  // watch-rule-format (error): each watch rule must match platform parser pattern
  // -------------------------------------------------------------------------
  {
    ruleId: 'watch-rule-format',
    severity: 'error',
    check(parsed) {
      if (!parsed.frontmatter.watch) return [];

      const findings: string[] = [];
      for (const rule of parsed.frontmatter.watch) {
        if (!WATCH_RULE_FORMAT.test(rule.trim())) {
          findings.push(
            `Watch rule "${rule.trim()}" does not match the platform format "when a(n) <event> is <action>". Non-conforming rules silently never fire.`
          );
        }
      }
      return findings;
    },
  },

  // -------------------------------------------------------------------------
  // capability-feasibility (error; warn when pending):
  // keyword map → required capability, checked against manifest
  // -------------------------------------------------------------------------
  {
    ruleId: 'capability-feasibility',
    severity: 'error', // overridden per-capability for pending ones
    check(parsed) {
      // Combine all text to search in
      const searchText = [
        parsed.frontmatter.purpose,
        ...parsed.frontmatter.routines,
        ...(parsed.frontmatter.deny ?? []),
        parsed.body,
      ].join('\n');

      const findings: string[] = [];
      const flagged = new Set<string>();

      for (const { pattern, capability } of CAPABILITY_KEYWORDS) {
        if (flagged.has(capability)) continue;
        if (!pattern.test(searchText)) continue;

        const known = isKnownCapability(capability);
        const pending = isPendingCapability(capability);

        if (!known && !pending) {
          // Completely absent from manifest
          flagged.add(capability);
          findings.push(
            `[error] Wobblie appears to require "${capability}" which is not in the platform capability manifest. Redesign to avoid this capability or wait for the platform to ship it.`
          );
        } else if (pending) {
          flagged.add(capability);
          findings.push(
            `[warn] Wobblie appears to require "${capability}" which is pending platform delivery (wobblie-reliability Task 1/2). Will work once platform ships it.`
          );
        }
        // If known and not pending: silently OK
      }

      return findings;
    },
  },
];

// ---------------------------------------------------------------------------
// Public runner
// ---------------------------------------------------------------------------

/**
 * Run all lint rules against a single parsed wobblie.
 * Returns an array of findings (may be empty).
 */
export function lintWobblie(parsed: ParsedWobblie): LintFinding[] {
  const findings: LintFinding[] = [];

  for (const rule of LINT_RULES) {
    const messages = rule.check(parsed);
    for (const message of messages) {
      // For capability-feasibility, the severity is embedded in the message
      // prefix ([error] / [warn]) because the rule needs per-finding severity.
      let severity: LintSeverity = rule.severity;
      let cleanMessage = message;

      if (rule.ruleId === 'capability-feasibility') {
        if (message.startsWith('[warn]')) {
          severity = 'warn';
          cleanMessage = message.slice('[warn] '.length);
        } else if (message.startsWith('[error]')) {
          severity = 'error';
          cleanMessage = message.slice('[error] '.length);
        }
      }

      findings.push({
        wobblieId: parsed.id,
        ruleId: rule.ruleId,
        severity,
        message: cleanMessage,
        path: parsed.path,
      });
    }
  }

  return findings;
}

/**
 * Run lint against all wobblies in the catalog.
 */
export function lintAllWobblies(wobblies: ParsedWobblie[]): LintFinding[] {
  return wobblies.flatMap((w) => lintWobblie(w));
}

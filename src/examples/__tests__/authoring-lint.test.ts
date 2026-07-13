import { describe, expect, test } from 'vitest';
import { lintWobblie, type ParsedWobblie } from '../authoring-lint';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWobblie(overrides: Partial<ParsedWobblie> & { id?: string }): ParsedWobblie {
  return {
    id: overrides.id ?? 'test-wobblie',
    path: `wobblies/${overrides.id ?? 'test-wobblie'}/WOBBLIE.md`,
    frontmatter: {
      id: overrides.id ?? 'test-wobblie',
      purpose: 'Validates branch names follow team conventions.',
      watch: ['when a pull request is opened'],
      routines: ['Check the branch name against the configured pattern.'],
      deny: ['Do not modify source code directly.'],
      schedule: undefined,
      ...overrides.frontmatter,
    },
    body: overrides.body ?? '## Overview\nThis wobblie validates branch names.\n\n## Signal threshold\nAct only when the branch name violates the configured pattern.\n\n## Low-noise behavior\nNo-op when the branch name matches the configured pattern.\n\n## Output format\nPost one comment with the naming convention guide link.\n\n## Limits\nMaximum 1 comment per PR per activation.',
  };
}

function findingsFor(ruleId: string, wobblie: ParsedWobblie) {
  return lintWobblie(wobblie).filter((f) => f.ruleId === ruleId);
}

// ---------------------------------------------------------------------------
// boilerplate-routines
// ---------------------------------------------------------------------------

describe('boilerplate-routines rule', () => {
  test('passes when routines are purpose-specific', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names.',
        watch: ['when a pull request is opened'],
        routines: ['Check the branch name against the configured pattern.'],
        deny: [],
      },
    });
    const findings = findingsFor('boilerplate-routines', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('fails on each boilerplate routine string', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates something.',
        watch: ['when a pull request is opened'],
        routines: [
          'Analyze the pull request for relevant signals.',
          'Take appropriate action based on findings.',
          'Comment or create issues with clear, actionable feedback.',
        ],
        deny: [],
      },
    });
    const findings = findingsFor('boilerplate-routines', wobblie);
    expect(findings).toHaveLength(3);
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
  });

  test('fails on a single boilerplate routine among good ones', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names.',
        watch: ['when a pull request is opened'],
        routines: [
          'Check the branch name against the configured regex.',
          'Take appropriate action based on findings.',
        ],
        deny: [],
      },
    });
    const findings = findingsFor('boilerplate-routines', wobblie);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('Take appropriate action');
  });
});

// ---------------------------------------------------------------------------
// boilerplate-body
// ---------------------------------------------------------------------------

describe('boilerplate-body rule', () => {
  test('passes when body is purpose-specific', () => {
    const wobblie = makeWobblie({ body: '## Signal threshold\nOnly act when the branch name fails the regex.' });
    const findings = findingsFor('boilerplate-body', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('fails when body contains boilerplate policy phrase', () => {
    const wobblie = makeWobblie({
      body: '## Policy\n\nAct only on clear signals. Prefer concise, actionable feedback over verbose reports.\n\n## Limits\nMaximum 1 action per PR per activation.',
    });
    const findings = findingsFor('boilerplate-body', wobblie);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.severity === 'error')).toBe(true);
  });

  test('fails when body contains boilerplate limits phrase', () => {
    const wobblie = makeWobblie({
      body: '## Limits\n\nMaximum 1 action per PR per activation.\n',
    });
    const findings = findingsFor('boilerplate-body', wobblie);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('Maximum 1 action per PR');
  });
});

// ---------------------------------------------------------------------------
// routine-specificity
// ---------------------------------------------------------------------------

describe('routine-specificity rule', () => {
  test('passes when every routine shares a stem with purpose', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names follow team conventions.',
        watch: ['when a pull request is opened'],
        routines: [
          'Check the branch name against the configured pattern.',
          'Comment with naming convention guidance when validation fails.',
        ],
        deny: [],
      },
    });
    const findings = findingsFor('routine-specificity', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('warns when a routine shares no meaningful tokens with purpose', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names follow team conventions.',
        watch: ['when a pull request is opened'],
        routines: [
          // Completely unrelated to branch naming
          'Inspect the deployment region settings.',
        ],
        deny: [],
      },
    });
    const findings = findingsFor('routine-specificity', wobblie);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// trigger-coherence
// ---------------------------------------------------------------------------

describe('trigger-coherence rule', () => {
  test('passes when both watch+schedule present with trigger rationale section', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Post a daily digest of branch activity.',
        watch: ['when a pull request is opened'],
        schedule: '0 9 * * 1-5',
        routines: ['Collect branch events.'],
        deny: [],
      },
      body: '## Trigger rationale\nBoth triggers are needed because...\n\n## Signal threshold\nOnly act on meaningful events.',
    });
    const findings = findingsFor('trigger-coherence', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('fails when both watch+schedule present without trigger rationale', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates something on PRs.',
        watch: ['when a pull request is opened'],
        schedule: '0 9 * * *',
        routines: ['Check something.'],
        deny: [],
      },
      body: '## Signal threshold\nOnly act on meaningful events.',
    });
    const findings = findingsFor('trigger-coherence', wobblie);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('Trigger rationale');
  });

  test('fails when purpose implies scheduled scanning but only watch triggers', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Monitor and scan across recent pull requests weekly.',
        watch: ['when a pull request is opened'],
        schedule: undefined,
        routines: ['Scan recent PRs.'],
        deny: [],
      },
    });
    const findings = findingsFor('trigger-coherence', wobblie);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('scheduled scanning');
  });

  test('fails when schedule-only wobblie body mentions per PR limits', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Runs a daily scan.',
        watch: undefined,
        schedule: '0 9 * * *',
        routines: ['Scan all open PRs.'],
        deny: [],
      },
      body: '## Limits\n\nMaximum 2 comments per PR per run.',
    });
    const findings = findingsFor('trigger-coherence', wobblie);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.message).toContain('per PR');
  });

  test('passes when schedule-only wobblie body has no per-PR limit', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Runs a daily scan.',
        watch: undefined,
        schedule: '0 9 * * *',
        routines: ['Scan all open PRs.'],
        deny: [],
      },
      body: '## Limits\n\nMaximum 10 comments per run.',
    });
    const findings = findingsFor('trigger-coherence', wobblie);
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// watch-rule-format
// ---------------------------------------------------------------------------

describe('watch-rule-format rule', () => {
  test('passes for valid watch rule format', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names.',
        watch: [
          'when a pull request is opened',
          'when a pull request is synchronized',
        ],
        routines: ['Check the branch name.'],
        deny: [],
      },
    });
    const findings = findingsFor('watch-rule-format', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('fails for free-form watch rule not matching platform format', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names.',
        watch: [
          'on pull_request',  // GitHub Actions syntax — wrong
          'PR opened',        // Free-form — wrong
        ],
        routines: ['Check the branch name.'],
        deny: [],
      },
    });
    const findings = findingsFor('watch-rule-format', wobblie);
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.severity === 'error')).toBe(true);
  });

  test('passes when no watch rules are set (schedule-only)', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Runs a daily digest.',
        watch: undefined,
        schedule: '0 9 * * *',
        routines: ['Post the digest.'],
        deny: [],
      },
    });
    const findings = findingsFor('watch-rule-format', wobblie);
    expect(findings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// capability-feasibility
// ---------------------------------------------------------------------------

describe('capability-feasibility rule', () => {
  test('passes for a wobblie using only known capabilities', () => {
    // Uses only comment (write) action, github integration — fully supported
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'test-wobblie',
        purpose: 'Validates branch names and comments with guidance.',
        watch: ['when a pull request is opened'],
        routines: ['Check the branch name and post a comment with guidance.'],
        deny: ['Do not approve or merge pull requests.'],
      },
    });
    const findings = findingsFor('capability-feasibility', wobblie);
    expect(findings).toHaveLength(0);
  });

  test('errors when wobblie requires a capability not in the manifest', () => {
    // security_advisories is in notYetPlanned, not in any action list
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'security-advisory-watcher',
        purpose: 'Monitor GitHub security advisories for new CVEs.',
        watch: ['when a pull request is opened'],
        routines: ['Check for new security advisories affecting dependencies.'],
        deny: [],
      },
    });
    const findings = findingsFor('capability-feasibility', wobblie);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.severity === 'error')).toBe(true);
    expect(findings.some((f) => f.message.includes('github.security_advisories'))).toBe(true);
  });

  test('warns for a wobblie requiring pending capabilities (workflow runs)', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'flaky-test-detector',
        purpose: 'Detect flaky tests by analyzing CI workflow runs across recent history.',
        watch: undefined,
        schedule: '0 9 * * 1-5',
        routines: [
          'Fetch CI workflow runs for the past 14 days and identify flaky tests.',
        ],
        deny: [],
      },
      body: '## Signal threshold\nFlag tests that fail in >20% of runs.\n\n## Low-noise behavior\nNo-op when no tests meet the threshold.\n\n## Output format\nPost a Slack message listing flaky tests.\n\n## Limits\nMaximum 1 message per scheduled run.',
    });
    const findings = findingsFor('capability-feasibility', wobblie);
    expect(findings.length).toBeGreaterThanOrEqual(1);
    expect(findings.some((f) => f.severity === 'warn')).toBe(true);
    expect(findings.some((f) => f.message.includes('github.list_workflow_runs'))).toBe(true);
  });

  test('passes for linear integration (known capability)', () => {
    const wobblie = makeWobblie({
      frontmatter: {
        id: 'linear-bug-context-researcher',
        purpose: 'Research Linear issues and add context from codebase.',
        watch: ['when a pull request is opened'],
        routines: ['Look up the related Linear issue and add context.'],
        deny: [],
      },
    });
    const findings = findingsFor('capability-feasibility', wobblie);
    // Linear is a known capability — should warn at most, not error
    const errors = findings.filter((f) => f.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Integration test: stub wobblie fails multiple rules
// ---------------------------------------------------------------------------

describe('stub wobblie integration', () => {
  test('a typical stub fails boilerplate-routines and boilerplate-body', () => {
    const stub = makeWobblie({
      id: 'branch-naming-enforcer',
      frontmatter: {
        id: 'branch-naming-enforcer',
        purpose: 'Validates branch names follow team conventions and comments with guidance when they do not.',
        watch: ['when a pull request is opened', 'when a pull request is synchronized'],
        schedule: '0 9 * * *',
        routines: [
          'Analyze the pull request for relevant signals.',
          'Take appropriate action based on findings.',
          'Comment or create issues with clear, actionable feedback.',
        ],
        deny: ['Do not merge or approve pull requests.'],
      },
      body: '## Overview\n\nValidates branch names.\n\n## Policy\n\nAct only on clear signals. Prefer concise, actionable feedback over verbose reports.\n\n## Limits\n\nMaximum 1 action per PR per activation.',
    });

    const findings = lintWobblie(stub);
    const ruleIds = new Set(findings.map((f) => f.ruleId));
    expect(ruleIds.has('boilerplate-routines')).toBe(true);
    expect(ruleIds.has('boilerplate-body')).toBe(true);
    // trigger-coherence: both watch+schedule without rationale
    expect(ruleIds.has('trigger-coherence')).toBe(true);
    // All boilerplate findings are errors
    expect(
      findings
        .filter((f) => f.ruleId === 'boilerplate-routines' || f.ruleId === 'boilerplate-body')
        .every((f) => f.severity === 'error')
    ).toBe(true);
  });
});

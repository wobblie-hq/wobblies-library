/**
 * One-time script to generate initial behavioral fixtures for all 35 ready wobblies.
 * Run with: bun scripts/create-fixtures.ts
 * Delete after use.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WOBBLIES_DIR = join(import.meta.dir, '..', 'wobblies');

function writeJSON(path: string, data: unknown) {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

// ---------------------------------------------------------------------------
// Shared trigger templates
// ---------------------------------------------------------------------------

const prOpenedTrigger = (extras: Record<string, unknown> = {}) => ({
  type: 'pull_request',
  action: 'opened',
  source: 'github',
  payload: {
    repository: 'acme-corp/demo-repo',
    number: 42,
    title: 'Add new feature',
    head_branch: 'feat/new-feature',
    base_branch: 'main',
    author: 'alice',
    draft: false,
    diff_files: ['src/app.ts', 'README.md'],
    additions: 120,
    deletions: 30,
    ...extras,
  },
  metadata: {
    deliveryId: 'test-delivery-001',
    timestamp: '2026-01-15T10:00:00Z',
  },
});

const prCompliantTrigger = (extras: Record<string, unknown> = {}) => ({
  type: 'pull_request',
  action: 'opened',
  source: 'github',
  payload: {
    repository: 'acme-corp/demo-repo',
    number: 43,
    title: 'Fix typo in docs',
    head_branch: 'fix/docs-typo',
    base_branch: 'main',
    author: 'bob',
    draft: false,
    diff_files: ['README.md'],
    additions: 1,
    deletions: 1,
    ...extras,
  },
  metadata: {
    deliveryId: 'test-delivery-002',
    timestamp: '2026-01-15T11:00:00Z',
  },
});

const scheduleTrigger = (extras: Record<string, unknown> = {}) => ({
  type: 'schedule',
  source: 'schedule',
  payload: {
    repository: 'acme-corp/demo-repo',
    ...extras,
  },
  metadata: {
    deliveryId: 'test-schedule-001',
    timestamp: '2026-01-15T08:00:00Z',
  },
});

// ---------------------------------------------------------------------------
// Fixture definitions
// ---------------------------------------------------------------------------

interface FixtureDef {
  trigger: unknown;
  expected: unknown;
  noopTrigger?: unknown;
  noopExpected?: unknown;
}

const fixtures: Record<string, FixtureDef> = {
  // =========================================================================
  // 15 AUTHORED WOBBLIES
  // =========================================================================

  'docs-drift-maintainer': {
    trigger: scheduleTrigger({
      recent_merges: [
        {
          number: 100,
          title: 'Refactor auth middleware',
          merged_at: '2026-01-14T16:00:00Z',
          files: ['src/auth/middleware.ts', 'src/auth/session.ts'],
        },
      ],
      docs_files: ['docs/auth.md'],
    }),
    expected: {
      actions: [
        {
          type: 'create_pr',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['doc', 'auth'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ recent_merges: [] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No repository changes since previous activation',
    },
  },

  'docs-stale-maintainer': {
    trigger: scheduleTrigger({
      stale_candidates: [
        {
          path: 'docs/deployment.md',
          last_modified: '2025-06-01T10:00:00Z',
          stale_claims: ['References deprecated API v1 endpoint'],
        },
      ],
    }),
    expected: {
      actions: [
        {
          type: 'create_pr',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['doc', 'stale'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ stale_candidates: [] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No stale documentation claims can be verified against source evidence',
    },
  },

  'github-activity-digest': {
    trigger: scheduleTrigger({
      activity: [
        {
          type: 'pr_merged',
          number: 88,
          title: 'Fix critical auth bypass',
          author: 'alice',
          merged_at: '2026-01-15T14:00:00Z',
        },
        {
          type: 'ci_failure',
          workflow: 'tests',
          branch: 'main',
          run_id: 12345,
        },
        {
          type: 'pr_opened',
          number: 89,
          title: 'Add rate limiting',
          author: 'bob',
        },
      ],
    }),
    expected: {
      actions: [
        {
          type: 'slack.message',
          contentMustMatch: ['digest', 'activity'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ activity: [] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No repository activity since previous scheduled run',
    },
  },

  'js-ts-dependency-upgrades': {
    trigger: scheduleTrigger({
      outdated_packages: [
        {
          name: 'express',
          current: '4.18.0',
          latest: '4.19.2',
          type: 'runtime',
        },
        {
          name: 'typescript',
          current: '5.3.0',
          latest: '5.4.5',
          type: 'dev',
        },
      ],
      package_manager: 'pnpm',
      lockfile: 'pnpm-lock.yaml',
    }),
    expected: {
      actions: [
        {
          type: 'create_pr',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['dependency', 'upgrade'],
        },
      ],
      maxActions: 2,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ outdated_packages: [], package_manager: 'pnpm', lockfile: 'pnpm-lock.yaml' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No patch or minor upgrades are available',
    },
  },

  'linear-bug-context-researcher': {
    trigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-1234',
        title: 'Login fails with SSO after session timeout',
        description: 'Users report 500 error when re-authenticating via SSO after 30min idle.',
        labels: ['bug'],
        team: 'backend',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-001',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'linear.comment',
          contentMustMatch: ['SSO', 'session'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-1235',
        title: 'Update team page colors',
        description: 'Change background to match new brand guidelines.',
        labels: ['enhancement'],
        team: 'design',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-002',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Issue is not clearly a bug or regression',
    },
  },

  'linear-issue-duplicate-finder': {
    trigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-2001',
        title: 'API rate limiting returns 429 too aggressively',
        description: 'Clients hitting 429 after only 10 requests per minute. Expected threshold is 100.',
        labels: ['bug'],
        team: 'platform',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-003',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'linear.comment',
          contentMustMatch: ['duplicate', 'similar'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-2002',
        title: 'x',
        description: '',
        labels: [],
        team: 'platform',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-004',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Issue title and body too thin to support meaningful duplicate search',
    },
  },

  'linear-issue-labeler': {
    trigger: scheduleTrigger({
      unlabeled_issues: [
        {
          issue_id: 'LIN-3001',
          title: 'Database migration fails on PostgreSQL 15',
          description: 'Migration 20260101 fails with column type mismatch on PG15.',
          current_labels: [],
        },
      ],
      available_labels: ['bug', 'enhancement', 'database', 'migration', 'infrastructure'],
    }),
    expected: {
      actions: [
        {
          type: 'label',
          contentMustMatch: ['database|migration|bug'],
        },
      ],
      maxActions: 5,
      allowNoop: false,
    },
  },

  'linear-pr-link-reconciler': {
    trigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-4001',
        title: 'Implement new caching layer',
        description: 'Working on this in PR #42 on the demo-repo. Need to link it.',
        team: 'backend',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-005',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'linear.comment',
          contentMustMatch: ['PR', 'link'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'issue',
      action: 'created',
      source: 'linear',
      payload: {
        issue_id: 'LIN-4002',
        title: 'Update team wiki',
        description: 'Need to update the onboarding docs for new hires.',
        team: 'people',
        repository: 'acme-corp/demo-repo',
      },
      metadata: {
        deliveryId: 'test-linear-006',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Trigger does not mention active code work or pull request',
    },
  },

  ping: {
    trigger: scheduleTrigger(),
    expected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Ping is a diagnostic heartbeat that logs only — no external actions',
    },
  },

  'pr-check-repair': {
    trigger: {
      type: 'check_run',
      action: 'completed',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        pull_request: { number: 42, head_branch: 'feat/new-feature', draft: false },
        check_run: {
          name: 'lint',
          conclusion: 'failure',
          output: { title: 'ESLint errors', summary: '3 errors found in src/app.ts' },
        },
      },
      metadata: {
        deliveryId: 'test-check-001',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['fix', 'lint'],
        },
      ],
      maxActions: 2,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'check_run',
      action: 'completed',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        pull_request: { number: 42, head_branch: 'feat/new-feature', draft: false },
        check_run: {
          name: 'tests',
          conclusion: 'success',
          output: { title: 'All tests passed', summary: '142 tests passed' },
        },
      },
      metadata: {
        deliveryId: 'test-check-002',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Check run succeeded — no repair needed',
    },
  },

  'pr-merge-conflict-repair': {
    trigger: {
      type: 'push',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        ref: 'refs/heads/main',
        conflicting_prs: [
          { number: 44, head_branch: 'feat/auth-refactor', author: 'alice', conflict_files: ['src/auth.ts'] },
        ],
      },
      metadata: {
        deliveryId: 'test-push-001',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['conflict', 'merge'],
        },
      ],
      maxActions: 3,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'push',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        ref: 'refs/heads/main',
        conflicting_prs: [],
      },
      metadata: {
        deliveryId: 'test-push-002',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No non-draft PRs are conflicting after the push',
    },
  },

  'pr-metadata': {
    trigger: prOpenedTrigger({
      title: 'new feature',
      body: '',
      linked_issues: [],
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['metadata'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
  },

  'pr-review-triage': {
    trigger: {
      type: 'pull_request_review',
      action: 'submitted',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        pull_request: {
          number: 42,
          draft: false,
          state: 'open',
          author: 'alice',
        },
        review: {
          author: 'linter-bot',
          state: 'commented',
          body: 'Found 3 style issues in src/app.ts',
          is_bot: true,
        },
      },
      metadata: {
        deliveryId: 'test-review-001',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['triage'],
        },
      ],
      maxActions: 5,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'pull_request_review',
      action: 'submitted',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        pull_request: {
          number: 42,
          draft: true,
          state: 'open',
          author: 'alice',
        },
        review: {
          author: 'bob',
          state: 'approved',
          body: 'LGTM',
          is_bot: false,
        },
      },
      metadata: {
        deliveryId: 'test-review-002',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'PR is draft — pr-review-triage skips draft PRs',
    },
  },

  'slack-alert-context-researcher': {
    trigger: {
      type: 'message',
      source: 'slack',
      payload: {
        channel: 'C0123ALERTS',
        sender: 'datadog-bot',
        is_bot: true,
        text: 'ALERT: High error rate detected in production API. 500 errors spiked to 15% in the last 5 minutes. Service: auth-service.',
        thread_ts: '1705312800.000100',
      },
      metadata: {
        deliveryId: 'test-slack-001',
        timestamp: '2026-01-15T10:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'slack.message',
          contentMustMatch: ['context', 'auth'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'message',
      source: 'slack',
      payload: {
        channel: 'C0123ALERTS',
        sender: 'alice',
        is_bot: false,
        text: 'Hey team, quick question about the deploy process.',
        thread_ts: '1705312900.000200',
      },
      metadata: {
        deliveryId: 'test-slack-002',
        timestamp: '2026-01-15T11:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Sender is not a Slack app or bot',
    },
  },

  'slack-meeting-followup-planner': {
    trigger: {
      type: 'message',
      source: 'slack',
      payload: {
        channel: 'C0123TEAM',
        sender: 'alice',
        is_bot: false,
        text: 'Meeting notes from sprint planning:\n- Alice: finish auth refactor by Wednesday\n- Bob: investigate flaky test in CI\n- Carol: draft RFC for new caching layer\n- Action: create Linear issues for each item',
        thread_ts: '1705313000.000300',
      },
      metadata: {
        deliveryId: 'test-slack-003',
        timestamp: '2026-01-15T14:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'slack.message',
          contentMustMatch: ['follow-up|action'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'message',
      source: 'slack',
      payload: {
        channel: 'C0123TEAM',
        sender: 'bob',
        is_bot: false,
        text: 'Happy Friday everyone!',
        thread_ts: '1705313100.000400',
      },
      metadata: {
        deliveryId: 'test-slack-004',
        timestamp: '2026-01-15T15:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Message is social-only with no meeting notes or action items',
    },
  },

  // =========================================================================
  // 20 REWRITTEN WOBBLIES
  // =========================================================================

  'accessibility-checker': {
    trigger: prOpenedTrigger({
      diff_files: ['src/components/Button.tsx', 'src/pages/Login.tsx'],
      diff_content: '<img src="logo.png">\n<input type="text">\n<div onClick={handleClick}>',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['accessibility', 'alt|label|aria'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ diff_files: ['docs/README.md'], diff_content: '# Updated docs' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No UI files changed in the PR',
    },
  },

  'api-breaking-change-detector': {
    trigger: prOpenedTrigger({
      diff_files: ['src/api/users.ts', 'src/api/types.ts'],
      diff_content: '-export function getUser(id: string): User\n+export function getUser(id: string, options: Options): User',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['breaking', 'API|parameter'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ diff_files: ['src/api/internal.ts'], diff_content: '+// internal comment' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No breaking API changes detected in the diff',
    },
  },

  'branch-naming-enforcer': {
    trigger: prOpenedTrigger({ head_branch: 'my-random-branch' }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['branch', 'naming|convention|pattern'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ head_branch: 'feat/add-login' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Branch name matches the required naming convention',
    },
  },

  'build-size-monitor': {
    trigger: prOpenedTrigger({
      diff_files: ['package.json', 'pnpm-lock.yaml'],
      diff_content: '+    "lodash": "^4.17.21"\n+    "moment": "^2.30.0"',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['size|bundle|impact'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ diff_files: ['src/utils.ts'], diff_content: '+const x = 1;' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No dependency manifest or bundler config changes in the PR',
    },
  },

  'changelog-enforcer': {
    trigger: prOpenedTrigger({
      diff_files: ['src/auth/login.ts', 'src/auth/session.ts'],
      diff_content: '+export function loginWithSSO() { ... }',
      labels: [],
      changelog_updated: false,
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['changelog|CHANGELOG'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_files: ['src/auth/login.ts', 'CHANGELOG.md'],
      changelog_updated: true,
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'CHANGELOG.md is updated in this PR',
    },
  },

  'codeowner-validator': {
    trigger: prOpenedTrigger({
      diff_files: ['src/new-module/index.ts', '.github/CODEOWNERS'],
      codeowners_content: '/src/auth/ @team-auth\n/src/api/ @team-api',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['CODEOWNERS|codeowner|ownership|coverage'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_files: ['src/auth/login.ts'],
      codeowners_content: '/src/auth/ @team-auth\n* @team-default',
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'All changed paths are covered by CODEOWNERS rules',
    },
  },

  'commit-message-enforcer': {
    trigger: prOpenedTrigger({
      title: 'fixed stuff',
      commits: [
        { message: 'fixed stuff', sha: 'abc1234' },
        { message: 'more fixes', sha: 'def5678' },
      ],
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['commit|conventional'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      title: 'fix(auth): resolve session timeout issue',
      commits: [{ message: 'fix(auth): resolve session timeout issue', sha: 'abc1234' }],
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'All commit messages follow the configured convention',
    },
  },

  'dockerfile-linter': {
    trigger: prOpenedTrigger({
      diff_files: ['Dockerfile', 'docker-compose.yml'],
      diff_content: 'FROM node:latest\nRUN apt-get install -y curl\nCOPY . .\nRUN npm install',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['Dockerfile|Docker|container', 'tag|pin|layer|cache'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ diff_files: ['src/app.ts'] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No Dockerfile or Docker Compose changes in the PR',
    },
  },

  'env-var-documenter': {
    trigger: prOpenedTrigger({
      diff_files: ['src/config.ts'],
      diff_content: "+const dbHost = process.env.DATABASE_HOST;\n+const apiKey = process.env.NEW_API_KEY;",
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['env|environment|variable', 'document|.env'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_files: ['src/utils.ts'],
      diff_content: '+const x = 1;',
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No new environment variable access patterns detected in the diff',
    },
  },

  'error-handling-reviewer': {
    trigger: prOpenedTrigger({
      diff_files: ['src/api/handler.ts'],
      diff_content: '+try {\n+  await fetchData();\n+} catch (e) {\n+  // ignore\n+}',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['error|exception|catch'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_files: ['src/api/handler.ts'],
      diff_content: '+try {\n+  await fetchData();\n+} catch (e) {\n+  logger.error("Failed to fetch", e);\n+  throw new AppError("Fetch failed", { cause: e });\n+}',
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'All error handling follows project conventions with proper logging and propagation',
    },
  },

  'flaky-test-detector': {
    trigger: scheduleTrigger({
      workflow_runs: [
        {
          test: 'src/__tests__/auth.test.ts > login > should handle timeout',
          results: [
            { sha: 'aaa', pass: true },
            { sha: 'bbb', pass: false },
            { sha: 'ccc', pass: true },
            { sha: 'ddd', pass: false },
          ],
          branch: 'main',
        },
      ],
    }),
    expected: {
      actions: [
        {
          type: 'create_issue',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['flaky', 'test'],
        },
      ],
      maxActions: 5,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ workflow_runs: [] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No tests crossed the flakiness threshold in the analysis window',
    },
  },

  'migration-reviewer': {
    trigger: prOpenedTrigger({
      diff_files: ['migrations/20260115_add_users_table.sql'],
      diff_content: 'ALTER TABLE users DROP COLUMN email;\nALTER TABLE users ADD COLUMN email_address VARCHAR(255);',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['migration', 'destructive|reversib|lock|DDL'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_files: ['src/models/user.ts'],
      diff_content: '+interface User { id: string; }',
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No migration files changed in the PR',
    },
  },

  'pr-size-limiter': {
    trigger: prOpenedTrigger({
      additions: 1200,
      deletions: 400,
      diff_files: Array.from({ length: 45 }, (_, i) => `src/module${i}.ts`),
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['size|large|lines|files'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({ additions: 20, deletions: 5, diff_files: ['src/app.ts'] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'PR is within configured size thresholds',
    },
  },

  'release-drafter': {
    trigger: {
      type: 'pull_request',
      action: 'closed',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        number: 50,
        title: 'feat: add user authentication',
        merged: true,
        merged_at: '2026-01-15T16:00:00Z',
        base_branch: 'main',
        labels: ['feature'],
        author: 'alice',
      },
      metadata: {
        deliveryId: 'test-merge-001',
        timestamp: '2026-01-15T16:00:00Z',
      },
    },
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['release|draft|changelog'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: {
      type: 'pull_request',
      action: 'closed',
      source: 'github',
      payload: {
        repository: 'acme-corp/demo-repo',
        number: 51,
        title: 'chore: update CI config',
        merged: false,
        base_branch: 'main',
        labels: [],
        author: 'bob',
      },
      metadata: {
        deliveryId: 'test-merge-002',
        timestamp: '2026-01-15T17:00:00Z',
      },
    },
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'PR was closed without merging',
    },
  },

  'security-advisory-watcher': {
    trigger: scheduleTrigger({
      audit_results: {
        vulnerabilities: [
          {
            package: 'express',
            severity: 'high',
            advisory_id: 'GHSA-1234-5678-9abc',
            title: 'Prototype pollution in express',
            patched_versions: '>=4.19.3',
          },
        ],
      },
    }),
    expected: {
      actions: [
        {
          type: 'create_issue',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['vulnerab|security|advisory', 'express'],
        },
      ],
      maxActions: 3,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ audit_results: { vulnerabilities: [] } }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No high or critical vulnerabilities found in dependency audit',
    },
  },

  'stale-pr-closer': {
    trigger: scheduleTrigger({
      stale_prs: [
        {
          number: 30,
          title: 'WIP: experimental feature',
          author: 'carol',
          last_activity: '2025-11-01T10:00:00Z',
          days_inactive: 75,
        },
      ],
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['stale|inactive|close'],
        },
      ],
      maxActions: 5,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ stale_prs: [] }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No PRs exceed the staleness threshold',
    },
  },

  'test-coverage-gate': {
    trigger: prOpenedTrigger({
      coverage: {
        base: { lines: 85.2, branches: 78.1 },
        head: { lines: 82.0, branches: 75.5 },
        delta: { lines: -3.2, branches: -2.6 },
      },
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['coverage', 'decrease|drop|below'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      coverage: {
        base: { lines: 85.2, branches: 78.1 },
        head: { lines: 86.0, branches: 79.0 },
        delta: { lines: 0.8, branches: 0.9 },
      },
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Test coverage did not decrease compared to base branch',
    },
  },

  'todo-tracker': {
    trigger: prOpenedTrigger({
      diff_content: '+// TODO: implement proper validation\n+// FIXME: race condition in auth flow',
    }),
    expected: {
      actions: [
        {
          type: 'comment',
          targetPattern: '^acme-corp/demo-repo#\\d+$',
          contentMustMatch: ['TODO|FIXME'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: prCompliantTrigger({
      diff_content: '+const result = validate(input);',
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No new TODO or FIXME comments in the diff',
    },
  },

  'type-coverage-monitor': {
    trigger: scheduleTrigger({
      type_coverage: {
        total_symbols: 1200,
        typed_symbols: 900,
        coverage_pct: 75.0,
        untyped_hotspots: [
          { file: 'src/utils/legacy.ts', untyped_count: 45 },
          { file: 'src/api/handlers.ts', untyped_count: 23 },
        ],
      },
    }),
    expected: {
      actions: [
        {
          type: 'create_issue',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['type', 'coverage|untyped'],
        },
      ],
      maxActions: 3,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({
      type_coverage: {
        total_symbols: 1200,
        typed_symbols: 1180,
        coverage_pct: 98.3,
        untyped_hotspots: [],
      },
    }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'Type coverage is above the configured threshold with no actionable hotspots',
    },
  },

  'unused-dependency-remover': {
    trigger: scheduleTrigger({
      unused_dependencies: [
        { name: 'moment', type: 'runtime', last_import: null },
        { name: 'chalk', type: 'runtime', last_import: null },
      ],
      package_manager: 'pnpm',
    }),
    expected: {
      actions: [
        {
          type: 'create_pr',
          targetPattern: '^acme-corp/demo-repo$',
          contentMustMatch: ['unused', 'depend|remov'],
        },
      ],
      maxActions: 1,
      allowNoop: false,
    },
    noopTrigger: scheduleTrigger({ unused_dependencies: [], package_manager: 'pnpm' }),
    noopExpected: {
      actions: [],
      maxActions: 0,
      allowNoop: true,
      noopReason: 'No unused dependencies detected in the project',
    },
  },
};

// ---------------------------------------------------------------------------
// Write fixtures
// ---------------------------------------------------------------------------

let written = 0;
for (const [id, def] of Object.entries(fixtures)) {
  const fixturesDir = join(WOBBLIES_DIR, id, 'fixtures');
  ensureDir(fixturesDir);

  writeJSON(join(fixturesDir, 'trigger.json'), def.trigger);
  writeJSON(join(fixturesDir, 'expected.json'), def.expected);
  written += 2;

  if (def.noopTrigger) {
    writeJSON(join(fixturesDir, 'noop-trigger.json'), def.noopTrigger);
    written++;
  }
  if (def.noopExpected) {
    writeJSON(join(fixturesDir, 'noop-expected.json'), def.noopExpected);
    written++;
  }
}

console.log(`Written ${written} fixture files for ${Object.keys(fixtures).length} wobblies.`);

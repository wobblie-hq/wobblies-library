import { writeFile } from 'node:fs/promises';
import { validateCatalogFile, writeGeneratedCatalog } from './catalog';
import { lintAllWobblies, type LintFinding, type ParsedWobblie } from './authoring-lint';
import { parseWobblieMarkdown } from './schema';
import type { ValidationError } from './types';

export async function runGenerateCli(repoRoot: string): Promise<void> {
  const result = await writeGeneratedCatalog(repoRoot);
  if (!result.ok) {
    exitWithErrors(result.errors);
    return;
  }

  process.stdout.write(`Generated examples.json with ${result.value.examples.length.toString()} examples.\n`);
}

export async function runValidateCli(repoRoot: string, argv: string[] = []): Promise<void> {
  // Parse --report <path> flag
  const reportFlagIndex = argv.indexOf('--report');
  const reportPath = reportFlagIndex >= 0 ? argv[reportFlagIndex + 1] : undefined;

  const result = await validateCatalogFile(repoRoot);
  if (!result.ok) {
    exitWithErrors(result.errors);
    return;
  }

  // Run authoring lint over all wobblies
  const parsedWobblies: ParsedWobblie[] = [];
  for (const example of result.value.examples) {
    const wobblieContent = example.wobblie.content;
    const wobbliePath = `wobblies/${example.id}/WOBBLIE.md`;
    const parsed = parseWobblieMarkdown({ content: wobblieContent, path: wobbliePath });
    if (parsed.ok) {
      parsedWobblies.push({
        id: example.id,
        path: wobbliePath,
        frontmatter: parsed.value.frontmatter,
        body: parsed.value.body,
      });
    }
    // If parse fails it was already caught by validateCatalogFile above
  }

  const allFindings = lintAllWobblies(parsedWobblies);

  // Emit JSON report if requested
  if (reportPath) {
    const reportData: LintFinding[] = allFindings;
    await writeFile(reportPath, JSON.stringify(reportData, null, 2) + '\n', 'utf8');
    process.stdout.write(`Lint report written to ${reportPath} (${allFindings.length.toString()} findings).\n`);
  }

  // Print findings and fail if any errors
  const errors = allFindings.filter((f) => f.severity === 'error');
  const warns = allFindings.filter((f) => f.severity === 'warn');

  if (warns.length > 0) {
    for (const finding of warns) {
      process.stderr.write(`[warn] ${finding.wobblieId} (${finding.ruleId}): ${finding.message}\n`);
    }
  }

  if (errors.length > 0) {
    for (const finding of errors) {
      process.stderr.write(`[error] ${finding.wobblieId} (${finding.ruleId}): ${finding.message}\n`);
    }
    process.stderr.write(
      `\nAuthoring lint failed: ${errors.length.toString()} error(s).\n`
    );
    process.exit(1);
  }

  process.stdout.write(
    `examples.json is valid with ${result.value.examples.length.toString()} examples. Authoring lint: ${errors.length.toString()} errors, ${warns.length.toString()} warns.\n`
  );
}

function exitWithErrors(errors: readonly ValidationError[]): never {
  process.stderr.write(`${JSON.stringify(errors, null, 2)}\n`);
  process.exit(1);
}

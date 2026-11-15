// Headless brand review of a campaign folder.
// Run it from the client repo's root folder:
//   node <path-to-studio-kit>/scripts/review.mjs <campaign-folder>
// Writes review/findings.json and exits 1 if any finding is high severity.
// If review/findings.json already holds findings for the same folder, they go into
// the prompt so the new review reports only problems that are new or still not fixed.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The schema ships with the kit; findings are written to the client repo (the current folder).
const SCHEMA_PATH = fileURLToPath(new URL("../review/findings.schema.json", import.meta.url));

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node <path-to-studio-kit>/scripts/review.mjs <campaign-folder>  (run from the client repo)");
  process.exit(2);
}
// Same spelling every time, so "campaigns\test-bad\" and "campaigns/test-bad/" match.
const folder = arg.replace(/\\/g, "/").replace(/\/+$/, "");

for (const required of ["brand/voice.md", ".claude/rules/emails.md"]) {
  if (!existsSync(required)) {
    console.error(`Missing ${required}. Run this from the client repo's root folder.`);
    process.exit(2);
  }
}

const schema = readFileSync(SCHEMA_PATH, "utf8");
let prompt = `Review every email in ${folder} against brand/voice.md and .claude/rules/emails.md. Report only real problems.`;

// Earlier findings for the same folder, if any.
let previous = null;
if (existsSync("review/findings.json")) {
  try {
    const saved = JSON.parse(readFileSync("review/findings.json", "utf8"));
    if (saved.folder === folder && Array.isArray(saved.findings)) previous = saved.findings;
  } catch {
    // Unreadable file: treat it as a first review.
  }
}
if (previous) {
  prompt +=
    "\n\nThese are findings from the last review. Report only problems that are new or still not fixed. Don't repeat ones that have been fixed.\n\n" +
    JSON.stringify(previous, null, 2);
  console.log(`Including ${previous.length} findings from the last review of ${folder}.`);
}

const run = spawnSync(
  "claude",
  ["-p", prompt, "--output-format", "json", "--json-schema", schema, "--allowedTools", "Read,Glob,Grep"],
  { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
);

if (run.error || run.status !== 0) {
  console.error("Claude Code did not finish:", run.error?.message || run.stderr || `exit ${run.status}`);
  process.exit(2);
}

// The output may be one JSON object, or a list whose last item is the result.
let output = JSON.parse(run.stdout);
if (Array.isArray(output)) output = output[output.length - 1];

const result = output.structured_output;
if (!result || !Array.isArray(result.findings)) {
  console.error("No structured_output in Claude Code's reply.");
  process.exit(2);
}

mkdirSync("review", { recursive: true });
// Save the folder too, so the next review knows these findings belong to it.
writeFileSync("review/findings.json", JSON.stringify({ folder, findings: result.findings }, null, 2) + "\n");

const count = (s) => result.findings.filter((f) => f.severity === s).length;
const high = count("high");
console.log(
  `${folder}: ${result.findings.length} findings (${high} high, ${count("medium")} medium, ${count("low")} low). Saved to review/findings.json.`
);

process.exit(high > 0 ? 1 : 0);

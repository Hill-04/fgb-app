#!/usr/bin/env node
/**
 * PM-06.C guardrail: scan src/ for design-token anti-patterns and fail if any found.
 *
 * Run: npm run lint:tokens
 *
 * Bans (use FGB tokens instead):
 *   - Tailwind utilities: bg/text/border-{orange,slate,gray,emerald,amber,violet,fuchsia}-*
 *   - Hex literais: #FF6B00 / #E66000 / #8B5CF6 (use var(--fgb-yellow-500|700|navy-500))
 *   - Patterns CTA legados: rounded-* com bg-[var(--amarelo)] (use .fgb-btn-primary)
 *
 * See docs/DESIGN-AUDIT-2026-05.md sections 2.1, 2.2, 7.1.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const SRC = join(PROJECT_ROOT, "src");

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", "build", ".turbo", ".git"]);
const EXTENSIONS = new Set([".tsx", ".ts", ".jsx", ".js"]);
const SKIP_FILES = new Set([
  // Token definition (intentional source-of-truth, exempt)
  "app/globals.css",
]);

const RULES = [
  {
    name: "tailwind-banned-colors",
    pattern: /\b(orange|slate|gray|emerald|amber|violet|fuchsia)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
    message: "Use FGB tokens (fgb-yellow / fgb-ink / fgb-green / fgb-navy). PM-06.C.",
  },
  {
    name: "hex-anti-fgb",
    pattern: /#(?:FF6B00|E66000|E65500|8B5CF6|7C3AED|A78BFA|CC1016|F5C200)\b/i,
    message: "Use var(--fgb-yellow-500|700) / var(--fgb-navy-500) / var(--fgb-red-500). PM-06.C.",
  },
  {
    name: "cta-legacy",
    // CTA shape: amarelo base + amarelo-dark/yellow-700 hover (not chip, not icon-bg, not alpha)
    pattern: /bg-\[var\(--amarelo\)\][^"'`]*hover:bg-\[var\(--(?:orange-dark|fgb-yellow-700)\)\]|hover:bg-\[var\(--(?:orange-dark|fgb-yellow-700)\)\][^"'`]*bg-\[var\(--amarelo\)\]/,
    message: "Use .fgb-btn-primary (clip-path) instead of legacy amarelo+hover CTA. PM-06.C.",
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) {
      yield full;
    }
  }
}

let violations = 0;
const byRule = Object.fromEntries(RULES.map((r) => [r.name, 0]));

for (const file of walk(SRC)) {
  const rel = relative(SRC, file).replace(/\\/g, "/");
  if (SKIP_FILES.has(rel)) continue;
  const text = readFileSync(file, "utf-8");
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const rule of RULES) {
      const m = line.match(rule.pattern);
      if (m) {
        violations++;
        byRule[rule.name]++;
        console.log(`${rel}:${i + 1}  [${rule.name}]  ${m[0]}`);
        console.log(`    ${rule.message}`);
      }
    }
  }
}

console.log();
console.log("=".repeat(60));
if (violations === 0) {
  console.log("OK: no design-token anti-patterns found.");
  process.exit(0);
}
console.log(`FAIL: ${violations} violation(s) across rules:`);
for (const [name, count] of Object.entries(byRule)) {
  if (count > 0) console.log(`  ${name.padEnd(28)} ${count}`);
}
process.exit(1);

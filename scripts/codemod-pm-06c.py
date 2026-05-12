"""
PM-06.C: Codemod global de cores e CTAs anti-padrão → tokens FGB.

Wave 1 (este script):
  - Tailwind utilities: orange/slate/emerald/amber/violet/fuchsia → fgb-yellow/ink/green/yellow/navy/navy
  - Hex em Tailwind arbitrary class: [#FF6B00] → [var(--fgb-yellow-500)]
  - Hex em strings JS/CSS livres: #FF6B00 → #E5AB00 (valor real do token)

Não toca: globals.css (Wave 3 manual), node_modules, .next, dist, build, .turbo.
Run: python scripts/codemod-pm-06c.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC = PROJECT_ROOT / "src"

EXTENSIONS = {".tsx", ".ts", ".jsx", ".js", ".css"}
SKIP_DIRS = {"node_modules", ".next", "dist", "build", ".turbo", ".git"}
SKIP_RELATIVE = {
    "app/globals.css",
}

SHADES = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"]
SHADE_ALT = "|".join(SHADES)

TW_COLOR_MAP = {
    "orange":  "fgb-yellow",
    "slate":   "fgb-ink",
    "emerald": "fgb-green",
    "amber":   "fgb-yellow",
    "violet":  "fgb-navy",
    "fuchsia": "fgb-navy",
}

TW_PATTERNS = {
    color: (re.compile(rf"\b{color}-({SHADE_ALT})\b"), target)
    for color, target in TW_COLOR_MAP.items()
}

HEX_TO_VAR = {
    "FF6B00": "fgb-yellow-500",
    "E66000": "fgb-yellow-700",
    "E65500": "fgb-yellow-700",
    "8B5CF6": "fgb-navy-500",
    "7C3AED": "fgb-navy-600",
    "A78BFA": "fgb-navy-300",
    "CC1016": "fgb-red-500",
    "F5C200": "fgb-yellow-500",
}

HEX_TO_HEX = {
    "FF6B00": "E5AB00",
    "E66000": "896600",
    "E65500": "896600",
    "8B5CF6": "3D6BA0",
    "7C3AED": "2A4F7F",
    "A78BFA": "85ACDB",
    "CC1016": "D72020",
    "F5C200": "E5AB00",
}

BRACKETED_HEX = re.compile(r"\[#([A-Fa-f0-9]{6})\]")
STANDALONE_HEX = re.compile(r"(?<!\[)#([A-Fa-f0-9]{6})\b")


def transform(text: str) -> tuple[str, dict[str, int]]:
    counts: dict[str, int] = {}

    def bump(key: str) -> None:
        counts[key] = counts.get(key, 0) + 1

    for color, (pattern, target) in TW_PATTERNS.items():
        def repl(m: re.Match[str], _color=color, _target=target) -> str:
            bump(_color)
            return f"{_target}-{m.group(1)}"
        text = pattern.sub(repl, text)

    def bracket_repl(m: re.Match[str]) -> str:
        hex_up = m.group(1).upper()
        if hex_up in HEX_TO_VAR:
            bump(f"[#{hex_up}]")
            return f"[var(--{HEX_TO_VAR[hex_up]})]"
        return m.group(0)

    text = BRACKETED_HEX.sub(bracket_repl, text)

    def standalone_repl(m: re.Match[str]) -> str:
        hex_up = m.group(1).upper()
        if hex_up in HEX_TO_HEX:
            bump(f"#{hex_up}")
            return f"#{HEX_TO_HEX[hex_up]}"
        return m.group(0)

    text = STANDALONE_HEX.sub(standalone_repl, text)

    return text, counts


def main() -> int:
    files_changed = 0
    total_replacements = 0
    grand_counts: dict[str, int] = {}

    for path in SRC.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.suffix not in EXTENSIONS:
            continue
        rel = path.relative_to(SRC).as_posix()
        if rel in SKIP_RELATIVE:
            continue

        try:
            original = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as exc:
            print(f"SKIP {rel}: {exc}", file=sys.stderr)
            continue

        new_text, counts = transform(original)
        file_total = sum(counts.values())
        if file_total > 0 and new_text != original:
            path.write_text(new_text, encoding="utf-8")
            files_changed += 1
            total_replacements += file_total
            detail = ", ".join(f"{k}={v}" for k, v in sorted(counts.items()))
            print(f"{rel} ({file_total}): {detail}")
            for k, v in counts.items():
                grand_counts[k] = grand_counts.get(k, 0) + v

    print()
    print("=" * 70)
    print(f"TOTAL: {total_replacements} replacements in {files_changed} files")
    print("=" * 70)
    for k in sorted(grand_counts):
        print(f"  {k:20s} {grand_counts[k]}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

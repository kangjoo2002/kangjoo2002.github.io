from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", ROOT / "case.html"]
LINK_PATTERN = re.compile(r'''(?:href|src)=["']([^"']+)["']''')
CASE_LINK_PATTERN = re.compile(r"case\.html\?case=([a-z0-9\-]+)")
CASE_SLUG_PATTERN = re.compile(r'slug:\s*"([^"]+)"')
ANALYTICS_SCRIPT_PATTERN = re.compile(r'<script\s+defer\s+src=["\']\./analytics\.js["\']')


def main() -> int:
    errors: list[str] = []

    for html_file in HTML_FILES:
        if not html_file.exists():
            errors.append(f"missing html file: {html_file.relative_to(ROOT)}")
            continue

        content = html_file.read_text(encoding="utf-8")

        if not ANALYTICS_SCRIPT_PATTERN.search(content):
            errors.append(
                f"{html_file.relative_to(ROOT)} is missing deferred analytics.js script include"
            )

        for raw_link in LINK_PATTERN.findall(content):
            if raw_link.startswith(("http://", "https://", "mailto:", "tel:", "#")):
                continue

            clean_link = raw_link.split("#", 1)[0].split("?", 1)[0]

            if not clean_link:
                continue

            resolved = (html_file.parent / clean_link).resolve()

            if not resolved.exists():
                errors.append(
                    f"{html_file.relative_to(ROOT)} references missing local asset: {raw_link}"
                )

    case_data_path = ROOT / "case-data.js"

    if not case_data_path.exists():
        errors.append("missing case-data.js")
    else:
        case_data = case_data_path.read_text(encoding="utf-8")
        case_slugs = CASE_SLUG_PATTERN.findall(case_data)
        duplicated = sorted({slug for slug in case_slugs if case_slugs.count(slug) > 1})

        if duplicated:
            errors.append(f"duplicated case slug(s): {', '.join(duplicated)}")

        referenced_slugs = CASE_LINK_PATTERN.findall((ROOT / "index.html").read_text(encoding="utf-8"))
        missing_slugs = sorted(set(referenced_slugs) - set(case_slugs))

        if missing_slugs:
            errors.append(f"missing case-data slug(s): {', '.join(missing_slugs)}")

    if errors:
        for error in errors:
            print(f"[FAIL] {error}")
        return 1

    print("[OK] Static page validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

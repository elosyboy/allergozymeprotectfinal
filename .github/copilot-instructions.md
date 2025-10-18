Purpose
-------
Help AI coding agents become productive quickly in this repository: a minimal static marketing/site project with a single HTML entrypoint and one image asset.

Quick facts
-----------
- Top-level files of interest: `index.html` (single-page entry; currently empty) and `logo.png` (brand asset).
- There is no build system, package.json, or tests present in the repository.

Big picture (what to know before editing)
----------------------------------------
- This is a single-page static site. All changes should be safe to make directly to `index.html` (or by adding new small assets like CSS/JS files at the repo root).
- Keep the site self-contained — avoid adding heavy toolchains or introducing node modules unless explicitly requested.

Project-specific patterns & examples
-----------------------------------
- Prefer semantic, accessible HTML. Example patterns to follow when editing `index.html`:
  - include a `<meta charset="utf-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1">` in the `<head>`
  - reference the brand image as `<img src="logo.png" alt="AllergoZyme Protect logo">` (keep the `alt` text meaningful)
- If adding styles, prefer a single `styles.css` file in the repo root and link it from `index.html` rather than embedding large style blocks inline.

Developer workflows (how to preview, test, and validate changes)
-----------------------------------------------------------------
- Quick preview (open file in default browser):

  macOS/zsh:

  ```bash
  open index.html
  ```

- Local HTTP server (useful when working with relative paths or service workers):

  ```bash
  python3 -m http.server 8000
  # then open http://localhost:8000 in a browser
  ```

- There are no automated tests or linters configured; validate by manual browser testing and, if desired, run an external HTML validator locally.

Integration points & constraints
--------------------------------
- No external services, APIs, or CI integrations detected.
- Avoid adding credentials or external secrets. If an integration is required, add configuration files and document them in the repository root.

When an AI agent should ask for clarification
-------------------------------------------
- Before adding new build tooling (npm, webpack, etc.) — ask the repo owner.
- If a task requires dynamic behavior (APIs, form handling, server-side logic) — confirm intended hosting or backend choices.

Pull request and change guidance
-------------------------------
- Make focused, minimal PRs that modify only the files needed (usually `index.html` and any new small assets).
- Include a short description and a screenshot/GIF for UI changes. If the change is visual, note viewport sizes checked (mobile and desktop).

Files to inspect when working on UI/UX changes
--------------------------------------------
- `index.html` — primary entrypoint. Start here for structure and content.
- `logo.png` — brand asset; check size/format before replacing.

If anything in this file is ambiguous or you'd like expanded examples (typical hero layout, meta tags, sample footer), ask and I will iterate.

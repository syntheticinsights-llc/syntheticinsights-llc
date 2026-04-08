# Repository Guidelines

## Project Structure & Module Organization
This repository is a static website for Synthetic Insights and Smartodo marketing pages. Root-level pages such as `index.html`, `privacy.html`, `delete_account.html`, `smartodo_reset.html`, and `smartodo_signup_confirm.html` share global styles from `styles.css`. Brand assets live in `smartodo_assets/`. The `store_promotion/` workspace is a separate static tool for generating App Store and Google Play screenshots, with UI entry at `store_promotion/index.html`, reusable device components in `store_promotion/components/`, rendering and export logic in `store_promotion/scripts/`, and styles in `store_promotion/styles/`.

## Build, Test, and Development Commands
There is no package manager or build step in this repo. Use a local static server for preview:

- `python3 -m http.server 8000` — serve the repository root for general page review.
- `open http://localhost:8000/` — open the landing site in a browser.
- `./open_store_promotion.command` — launch the screenshot workspace with an available local port and open `/store_promotion/` in Chrome.

## Coding Style & Naming Conventions
Follow the existing style: 2-space indentation in HTML, CSS, and vanilla JavaScript. Prefer semantic HTML, direct DOM code, and fail-fast logic over defensive wrappers. Keep CSS class naming consistent with the current patterns, including modifier and element forms such as `feature-item--text-only` and `feature-copy__lead`. Use lowercase file names; page-like files in the root may use snake_case when needed, for example `smartodo_signup_confirm.html`.

## Testing Guidelines
This repo currently relies on manual verification, not an automated test framework. Before opening a PR, preview every changed page in a browser, check both desktop and mobile widths, verify asset paths, and confirm outbound links such as App Store, Google Play, mail, and policy pages. For `store_promotion/`, verify both iOS and Android preview/export flows after any script or layout change.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:` and `refactor:`. Keep commit subjects short, imperative, and scoped to one change. PRs should include: changed pages or directories, a concise user-visible summary, linked issue if applicable, and screenshots for any visual update. If `store_promotion/` changes, include exported sample output or preview screenshots for both platforms.

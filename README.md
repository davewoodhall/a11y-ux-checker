# A11Y & UX Checker

WordPress plugin (**plugin folder**: `adn-a11y-ux-checker`; main file: `adn-a11y-checker.php`) that runs **accessibility and user experience audits** in the browser. Checks are implemented in JavaScript (jQuery) and run against the current page DOM; results are primarily visible in the browser **developer console**.

## Requirements

- WordPress with the admin bar visible.
- A **site administrator** account (`manage_options`, or filter `a11y_ux_checker_user_can_run_audit`).
- jQuery (provided by WordPress).

## Usage

1. Log in with a **site administrator** account.
2. On the front-end or wp-admin, make sure the WordPress admin bar is visible.
3. Click **“A11y & UX audit”** in the admin bar.
4. Open your browser console (**F12** → *Console*) to review the grouped reports.

To test **closing modals via keyboard**: open a modal on the page, then run the audit. A dedicated console group sends a synthetic **Escape** key event (open modals may close).

## Code architecture

| Component | Purpose |
|--------|------|
| `adn-a11y-checker.php` | Entry point: constants, autoloader, `Plugin` and `Plugin_Updater`. |
| `autoload.php` | Minimal autoloader for the `AdnA11yChecker` namespace. |
| `includes/class-plugin.php` | Singleton: text domain `a11y_ux_checker`, administrator-only access, admin bar node, script enqueue. |
| `includes/class-plugin-updater.php` | Updates via **Plugin Update Checker** (same library as `wp-core`), **GitHub** repository. |
| `includes/plugin-update-checker.php` | PUC bootstrap (`ADN\PluginUpdateChecker\v5`). |
| `includes/plugin-update-checker/` | PUC sources (v5p0). |
| `assets/js/i18n-runtime.js` | Small helper for localized strings formatting (`a11yUxSprintf`). |
| `assets/js/admin-bar-audit.js` | On click: runs the four audits on `body`, then an async **Escape test** on visible modals. |
| `assets/js/structure-audit.js` | jQuery plugin `a11yStructureAudit`. |
| `assets/js/contrast.js` | jQuery plugin `a11yContrastReport`. |
| `assets/js/forms.js` | jQuery plugin `a11yFormsReport`. |
| `assets/js/ux-audit.js` | jQuery plugin `uxAudit`. |

## Features

### WordPress integration (PHP)

- **“A11y & UX audit”** link in the admin bar (`#wpadminbar`, node id: `adn-a11y-audit`).
- Scripts are only loaded for **administrators** (front-end and wp-admin).
- Text domain **`a11y_ux_checker`** for translations.

### Updates from GitHub (like wp-core)

The plugin embeds **Plugin Update Checker** (PUC, `ADN\PluginUpdateChecker` namespace, aligned with `wp-core`). As long as a repository URL is configured, WordPress can show updates when you publish GitHub **releases** (or tags).

1. **Plugin header**: the `GitHub URI` field points at the repository, e.g. `https://github.com/ORG/adn-a11y-ux-checker` (already present in `adn-a11y-checker.php`).
2. **Optional override** in `wp-config.php`: `define( 'ADN_A11Y_CHECKER_GITHUB_REPO', 'https://github.com/ORG/REPO' );`
3. **Disable** GitHub updates: `define( 'ADN_A11Y_CHECKER_GITHUB_REPO', '' );` (empty string).

For a **private repository**, configure GitHub authentication via the `adn_a11y_checker_update_checker_ready` hook and the PUC API (`setAuthentication`), rather than storing secrets in the plugin repository.

The WordPress plugin slug is the **plugin folder name** (`adn-a11y-ux-checker`). GitHub release ZIPs must unpack into a compatible directory name (see PUC docs / release structure).

**Hook**: `adn_a11y_checker_update_checker_ready` receives the PUC instance for advanced usage (`setBranch`, `setAuthentication`, etc.).
**Filters**: `adn_a11y_checker_github_repository_url` (repository URL); `a11y_ux_checker_user_can_run_audit` (boolean — who can see the admin bar link and load audit scripts).

### Structure audit (`a11yStructureAudit`)

- **Document**: `<html lang>` presence, non-empty `<title>`, `meta name="viewport"` (informational signal).
- **Landmarks**: exactly one `<main>`; warnings for missing `<nav>`, `<header>`, `<footer>`; multiple headers/footers; accessible name for `<nav>`.
- **Headings**: missing `<h1>`, multiple `<h1>`, empty headings, skipped levels (e.g. H2 → H4).
- **Sections**: section without an accessible name, empty section.
- **Lists**: lists without `<li>`.
- **ARIA**: `aria-labelledby`, `aria-describedby`, `aria-controls` referencing missing IDs; empty/redundant `aria-label`; empty/redundant roles.
- **Interactive**: inline handlers (`onclick`, etc.); non-semantic clickable elements.
- **Links**: multiple links to the same URL (excluding nav/anchors).
- **Content patterns**: direct text in generic blocks; linked containers/cards (heuristics).
- **IDs**: duplicate IDs.
- **Focus**: positive `tabindex`; focusable elements inside `aria-hidden="true"` containers.
- **Accessible names**: native controls missing an accessible name.
- **Images**: `<img>` missing `alt`.
- **SVG**: potentially informative SVG without an accessible name (`title`, `aria-label`, `aria-labelledby`, or hidden with `aria-hidden` / `role="presentation"`).
- **Tables**: missing `<th>`; large tables without `<caption>` (info).
- **Skip links**: “skip” style anchors pointing to missing or present targets (info/warning).
- **Dialogs**: `role="dialog"` / `alertdialog` missing accessible name; missing `aria-modal` (info).
- **Keyboard**: `[inert]` subtree still containing visible focusable controls (heuristic).

Available jQuery options (all enabled by default unless specified) include: `checkDocumentLang`, `checkDocumentTitle`, `checkMetaViewport`, `checkImages`, `checkSvg`, `checkTables`, `checkSkipLinks`, `checkDialogSemantics`, etc.

### Modal × Escape test (`admin-bar-audit.js`)

After the synchronous audits, it looks for **visible modals** (`role=\"dialog\"`, `role=\"alertdialog\"`, `aria-modal=\"true\"`, common classes `.modal.show` / `.is-active` / `.is-open`). For each candidate it focuses an internal control, dispatches synthetic **Escape** keyboard events, and checks visibility after a short delay. Messages are **localized** based on the site language (default `en_CA`, with `fr_CA` support). **Warning**: open modals may close.

### Contrast audit (`a11yContrastReport`)

- Computes **contrast ratio** between text and background (configurable levels: **A**, **AA**, **AAA**).
- Takes **font size** and **font weight** into account (large vs normal text).
- Flags edge cases: transparency, icon-only controls, focus visibility risks, etc.
- Supports ignoring selectors (`ignore`, `ignoreDescendants`).

### Forms audit (`a11yFormsReport`)

- **Runtime tracking** (optional): focus, submit, attribute mutation observer for some signals.
- **Form-level**: too many `required` fields, submit button ambiguity, unclear multi-step flows, missing loading state.
- **Fields**: missing `id` / `name`, missing `<label>`, hidden label, placeholder used as the only label, type/name mismatch, missing `autocomplete`, required/ARIA indicator mismatches, broken `aria-describedby`, invisible-but-focusable fields.
- **Groups**: radios/checkboxes without `fieldset` / `legend`.
- **Keyboard navigation**: `tabindex` > 0.
- **Help text**: `.help`, `.error`, etc. without an `id` for linking.
- **Dynamic errors**: `aria-invalid="true"` without an `[aria-live]` region or `[role="alert"]` within the form (heuristic).

### UX audit (`uxAudit`)

- **Clickability**: clickable elements without proper semantics or roles.
- **Nesting**: nested interactives (click conflict risk).
- **Navigation**: top-level density and depth.
- **CTAs**: density per section, interactive overload, repeated CTA labels.
- **Targets**: minimum click target size (configurable).
- **UI patterns**: elements styled as buttons without being real controls.
- **Density**: sections/articles with high link density (pattern signal).
- **Viewport**: too many interactive elements in the initial viewport.
- **Hierarchy**: CTA-heavy sections without headings.
- **New tab links**: `target="_blank"` missing `rel` with `noopener`.
- **Link text**: ambiguous/generic link labels (EN/FR, pattern signal).

## Output

Each module logs to the console using `console.group`. Labels and group titles are **localized** based on the site language (default `en_CA`, with `fr_CA` support). The modal group uses the title **“Modal × Escape (keyboard test)”** in English.

## Development

- **Version**: see `ADN_A11Y_CHECKER_VERSION` in `adn-a11y-checker.php`.
- Translations directory: `languages/` (relative to the plugin).

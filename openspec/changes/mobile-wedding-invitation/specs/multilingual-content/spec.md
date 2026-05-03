## ADDED Requirements

### Requirement: Three-locale content model

The site SHALL support exactly three locales — `ko` (Korean, default), `en` (English), `de` (German) — with all user-visible strings sourced from a single content store keyed by locale.

#### Scenario: Locale-keyed lookup
- **WHEN** a page renders a string `greeting.title`
- **THEN** the value is read from `src/content/i18n/<locale>.json` for the active locale

#### Scenario: Missing translation
- **WHEN** a key exists in `ko.json` but is missing in `en.json` or `de.json`
- **THEN** the build SHALL fail with an error naming the missing key and locale

### Requirement: Locale routing

The site SHALL serve `ko` content at the root path (`/`), `en` at `/en/`, and `de` at `/de/`. Each non-default locale URL SHALL be a separate prerendered HTML page, not a client-side swap.

#### Scenario: Direct URL load
- **WHEN** a guest opens `/de/`
- **THEN** the response is fully prerendered German HTML, the `<html lang>` attribute is `de`, and no client-side language switch is required for first paint

#### Scenario: hreflang
- **WHEN** any page is rendered
- **THEN** the `<head>` includes `<link rel="alternate" hreflang="ko|en|de|x-default" href="...">` for every locale

### Requirement: Locale toggle UI

The site SHALL render a persistent locale toggle (e.g., `KO / EN / DE`) in the page header that links to the equivalent page in the chosen locale.

#### Scenario: Toggle from Korean cover to English
- **WHEN** a guest on `/` taps the `EN` toggle
- **THEN** the browser navigates to `/en/` and the scroll position resets to the top of the English page

#### Scenario: Active locale indicator
- **WHEN** the toggle renders on `/de/`
- **THEN** the `DE` option is visually marked as active and is not a clickable link

### Requirement: Locale-aware formatting

The site SHALL format dates, times, and numbers using `Intl.DateTimeFormat` / `Intl.NumberFormat` with the active locale.

#### Scenario: Date formatting
- **WHEN** the wedding date is displayed in `ko`
- **THEN** it renders as `2026년 ◯월 ◯일 (◯요일)`; in `en` as e.g. `Saturday, ◯ ◯ 2026`; in `de` as e.g. `Samstag, ◯. ◯ 2026`

### Requirement: Font coverage for all three locales

The site SHALL load fonts that cover Hangul (ko), Latin extended (en/de including ä ö ü ß), and SHALL subset/preload only the glyphs needed for the active locale's first paint.

#### Scenario: First paint preload
- **WHEN** the browser requests `/de/`
- **THEN** only the Latin subset fonts are preloaded; Hangul subsets are not requested for that page

## ADDED Requirements

### Requirement: RSVP submission via Google Form

The site SHALL provide an RSVP entry point that links to (or embeds) a configured Google Form, with locale-appropriate label and prefilled language field.

#### Scenario: Tap RSVP button on Korean page
- **WHEN** the guest taps "참석 의사 보내기" on `/`
- **THEN** the configured Google Form opens in a new tab/window with the `lang=ko` URL parameter prefilled

#### Scenario: Form URL configurable
- **WHEN** the maintainer changes the form URL in `src/config/forms.json`
- **THEN** the next build picks up the new URL without code changes

### Requirement: Guestbook submission via Google Form

The site SHALL provide a separate guestbook entry point that links to a Google Form with fields for name, message, and locale.

#### Scenario: Open guestbook form
- **WHEN** the guest taps "방명록 남기기"
- **THEN** the configured Google Form opens with `lang` prefilled to the active locale

### Requirement: Guestbook display from published Sheet

The site SHALL fetch the latest entries from a published Google Sheet via its `gviz/tq?tqx=out:json` endpoint on the client, and SHALL render the most recent N (default 20) approved entries as a scrollable list.

#### Scenario: Approved entries only
- **WHEN** the sheet contains rows with `approved` column equal to `Y`
- **THEN** only those rows are rendered, sorted by timestamp descending, capped at N

#### Scenario: Fetch failure fallback
- **WHEN** the fetch fails (network error, 4xx, parse error)
- **THEN** the section shows a localized "방명록을 불러올 수 없어요. 잠시 후 다시 시도해주세요." message with a manual "다시 불러오기" button, and still shows the "방명록 남기기" link

#### Scenario: Caching
- **WHEN** entries were fetched within the last 5 minutes during the same browser session
- **THEN** the cached payload from `sessionStorage` is used; otherwise a fresh fetch is issued

### Requirement: Configurable endpoints

Form URLs and Sheet identifiers SHALL be stored in version-controlled config (`src/config/forms.json`), with no secrets required (public published Sheet).

#### Scenario: Public-safe configuration
- **WHEN** the repository is public
- **THEN** `forms.json` contains only public Google Form / published Sheet URLs and may be safely committed

### Requirement: Display name and locale per entry

Each rendered guestbook entry SHALL show the guest's name, message, locale flag (🇰🇷 / 🇬🇧 / 🇩🇪), and a relative timestamp localized to the active locale.

#### Scenario: Korean viewer reading German entry
- **WHEN** the active locale is `ko` and the entry's locale is `de`
- **THEN** the entry renders with the German flag, the message verbatim, and the timestamp formatted in Korean (e.g., "3시간 전")

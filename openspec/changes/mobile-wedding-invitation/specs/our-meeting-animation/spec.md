## ADDED Requirements

### Requirement: Journey content model

The site SHALL store the couple's meeting and travel events in `src/content/journey.json` as an ordered array of events, each with `id`, `lat`, `lon`, ISO `date`, `kind` (`letter` | `visit` | `trip` | `wedding`), and localized `title` and `body` (`{ko, en, de}`).

#### Scenario: Build validation
- **WHEN** any event is missing a required field or any localized field is missing for ko/en/de
- **THEN** the build SHALL fail with an error naming the offending event id and field

### Requirement: World map rendering

The site SHALL render a stylized world map using `d3-geo` with a natural-earth projection and the `world-atlas` 110m topojson, drawn as inline SVG with custom land/ocean fills consistent with the invitation theme.

#### Scenario: Map first paint
- **WHEN** the meeting section enters the viewport
- **THEN** the SVG map renders with all event markers placed at their `(lat, lon)` and connection lines drawn between consecutive events in time order

### Requirement: Timeline animation

The site SHALL animate the journey such that events reveal in chronological order, with a connecting curve drawn from the previous event's marker to the current event's marker, and the active event's localized title and body displayed in a side panel.

#### Scenario: Scroll-driven progression
- **WHEN** the guest scrolls through the meeting section
- **THEN** the active event index advances based on scroll progress, updating the highlighted marker, drawing the connection curve, and swapping the side-panel text

#### Scenario: Manual navigation on mobile
- **WHEN** the guest taps a marker, swipes left/right on the map, or taps prev/next controls
- **THEN** the active event jumps to the corresponding entry and the animation snaps to that state

### Requirement: Localized text in animation

The site SHALL display each event's `title` and `body` in the active locale, switching content automatically when the locale changes.

#### Scenario: German guest viewing the map
- **WHEN** the guest is on `/de/` and the active event is a Berlin trip
- **THEN** the side panel renders the German `title` and `body` for that event

### Requirement: Reduced-motion fallback

The site SHALL respect `prefers-reduced-motion: reduce` by replacing scroll/curve animations with a static map showing all markers and a vertical text list of all events.

#### Scenario: User has reduced-motion enabled
- **WHEN** the section enters the viewport with `prefers-reduced-motion: reduce`
- **THEN** no kinetic animation runs; instead all markers are visible at once and a scrollable list of events is shown

### Requirement: Lazy load to protect LCP

The animation island SHALL hydrate only when its container is at least 50% within the viewport, and the topojson + d3 modules SHALL load no earlier than that point.

#### Scenario: Initial page load
- **WHEN** the cover section is the only thing visible at first paint
- **THEN** no journey-related JavaScript or topojson asset has been requested yet

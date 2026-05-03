## ADDED Requirements

### Requirement: 메인 커버

The site SHALL render a full-viewport mobile cover at the top of the page that displays the bride's and groom's names, the wedding date, and the venue, with at least one hero photograph.

#### Scenario: First load on mobile
- **WHEN** a guest opens the site on a mobile device
- **THEN** the cover fills the viewport, the names and date are visible without scrolling, and the hero image is loaded as the LCP element

#### Scenario: Locale switch
- **WHEN** the active locale changes between ko / en / de
- **THEN** the names render with locale-appropriate ordering (e.g., `신랑 ❤ 신부` in ko, `Bride & Groom` in en/de) and the date format follows the locale

### Requirement: 인사말 (Greeting)

The site SHALL provide a greeting section containing a free-form invitation message and the names of both sets of parents.

#### Scenario: Greeting renders
- **WHEN** the guest scrolls past the cover
- **THEN** the greeting paragraph and parent names appear, all sourced from the i18n content store

### Requirement: 식순 (Ceremony schedule)

The site SHALL display an ordered ceremony schedule with time and title for each item.

#### Scenario: Schedule list
- **WHEN** the schedule section is in view
- **THEN** items render in order with time on the left and title on the right, each title localized

### Requirement: 사진 갤러리 with lightbox

The site SHALL render a photo gallery whose images are responsive (`srcset` with WebP/AVIF) and openable in a fullscreen lightbox with swipe navigation.

#### Scenario: Tap a thumbnail
- **WHEN** a guest taps a gallery thumbnail
- **THEN** the lightbox opens at that image, and left/right swipe moves between images

#### Scenario: Image format negotiation
- **WHEN** the browser supports AVIF
- **THEN** the AVIF source is loaded; otherwise WebP, then JPEG fallback

### Requirement: 오시는 길 (Directions)

The site SHALL embed an interactive Kakao Map centered on the venue, and SHALL provide deep-link buttons for "카카오맵 길찾기", "네이버지도 길찾기", and "TMAP 길찾기".

#### Scenario: Map renders
- **WHEN** the directions section is in view
- **THEN** the Kakao Map embed loads with a marker at the venue coordinates and the venue name as a label

#### Scenario: Deep link
- **WHEN** the guest taps "카카오맵 길찾기"
- **THEN** the platform opens kakaomap:// (mobile) or https://map.kakao.com/ (desktop) with the venue as destination

### Requirement: 계좌번호 복사 (Bank account copy)

The site SHALL show the bride's and groom's family account information (bank name, account number, holder) and SHALL provide a copy-to-clipboard button per account.

#### Scenario: Copy succeeds
- **WHEN** a guest taps the copy button next to an account
- **THEN** the full account number is written to the clipboard, and a transient toast confirms the copy in the active locale

#### Scenario: Clipboard API unavailable
- **WHEN** `navigator.clipboard` is not available
- **THEN** the button falls back to `document.execCommand('copy')` against a hidden input, or shows the number with a "수동 복사" hint

### Requirement: 공유 (Share)

The site SHALL provide a "share" action that uses the Kakao JavaScript SDK to send a `feed` template message, and SHALL fall back to `navigator.share` or copy-link when the SDK is unavailable.

#### Scenario: Kakao share on mobile
- **WHEN** a guest taps the Kakao share button
- **THEN** the Kakao share sheet opens with title, description, hero image, and the canonical site URL prefilled in the active locale

#### Scenario: Fallback share
- **WHEN** the Kakao SDK fails to load (e.g., outside Korea)
- **THEN** the share button calls `navigator.share` or copies the URL and shows a toast

### Requirement: Mobile-first responsive layout

The site SHALL be designed for portrait mobile viewports (≥ 360px wide) as primary, with breakpoints that gracefully scale to tablet and desktop.

#### Scenario: Small viewport
- **WHEN** rendered at 360 × 640
- **THEN** no horizontal scrollbar appears, all interactive elements have ≥ 44 × 44 px tap targets, and text is legible without zoom

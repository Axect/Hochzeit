## ADDED Requirements

### Requirement: Code format

The system SHALL issue per-guest secret codes that are 12 characters drawn uniformly at random from the alphabet `[a-hjk-mnp-z2-9]` (lowercase letters and digits, excluding visually ambiguous `i`, `l`, `o`, `0`, `1`).

#### Scenario: Code generator output
- **WHEN** the code generator script is run with N=10
- **THEN** it emits 10 codes each matching the regex `^[a-hjk-mnp-z2-9]{12}$` with no duplicates

### Requirement: Encrypted-at-rest letter store

The system SHALL never ship plaintext letter bodies in any client-visible asset. Letters SHALL be encrypted at build time and the build artifact SHALL contain only `{ idHash → { iv, ciphertext, tag } }` mappings.

#### Scenario: Source inspection
- **WHEN** an attacker downloads every published asset from the site (HTML, JS, JSON, images)
- **THEN** no plaintext letter body, recipient name, or guest code appears in any file

#### Scenario: Build pipeline
- **WHEN** `data/letters.private.json` exists and `npm run build:letters` is invoked
- **THEN** the script writes `src/content/letters.encrypted.json` containing only encrypted blobs and indices, and `data/letters.private.json` is excluded by `.gitignore`

### Requirement: Key derivation and encryption

The system SHALL derive each letter's encryption key as `scrypt(code, salt, N=2^15, r=8, p=1, dkLen=32)` and encrypt the letter body with AES-256-GCM using a random 12-byte IV per letter. The mapping key SHALL be `SHA-256(code).slice(0, 16)` encoded as hex.

#### Scenario: Round trip
- **WHEN** the encryption script encrypts a letter with code `c` and the client decrypts with the same code `c`
- **THEN** the decrypted plaintext exactly equals the original letter body

#### Scenario: Wrong code
- **WHEN** the client supplies a code that exists in the mapping but a wrong letter body is attempted (i.e., synthetic mismatch)
- **THEN** AES-GCM authentication fails and no plaintext is rendered

### Requirement: Code entry UI

The site SHALL provide a code-entry form (in every locale) that accepts a 12-character code, normalizes whitespace and case, and displays the matching letter on success.

#### Scenario: Successful entry
- **WHEN** a guest enters a valid code
- **THEN** the system computes the `idHash`, looks up the encrypted blob, derives the key with scrypt, decrypts the letter, and renders the letter body in the active locale within ≤ 2 seconds on mid-range mobile

#### Scenario: Unknown code
- **WHEN** a guest enters a code whose `idHash` does not exist in the mapping
- **THEN** the form shows "코드를 다시 확인해주세요" (in active locale) and increments a client-side failure counter

### Requirement: Brute-force rate limiting

The site SHALL enforce a client-side rate limit on code attempts: after 5 consecutive failures within a session, further submissions SHALL be blocked for at least 30 seconds, with the cooldown doubling on each subsequent batch of 5 failures (capped at 10 minutes).

#### Scenario: Rapid wrong attempts
- **WHEN** a guest submits 5 unknown codes in succession
- **THEN** the form disables submission for at least 30 seconds and shows a localized cooldown notice with countdown

### Requirement: Localized letter bodies

Each letter SHALL include `body.{ko, en, de}` and SHALL render in the active site locale; if a translation is missing, the system SHALL fall back to `ko`.

#### Scenario: German guest, German letter present
- **WHEN** the active locale is `de` and the letter has `body.de`
- **THEN** the German body is rendered

#### Scenario: German guest, only Korean body
- **WHEN** the active locale is `de` and the letter only has `body.ko`
- **THEN** the Korean body is rendered with a small "Übersetzung folgt" notice

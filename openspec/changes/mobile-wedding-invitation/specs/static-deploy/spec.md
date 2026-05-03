## ADDED Requirements

### Requirement: Astro static build

The project SHALL build to fully static HTML/CSS/JS via `astro build` with `output: 'static'`, and SHALL produce a self-contained `dist/` directory deployable to any static host.

#### Scenario: Build output
- **WHEN** `npm run build` completes
- **THEN** `dist/` contains `index.html`, `en/index.html`, `de/index.html`, hashed JS/CSS, image assets, and `letters.encrypted.json`, with no server-runtime code referenced

### Requirement: GitHub Pages base path

The site config SHALL set `site` and `base` in `astro.config.mjs` so that the build produces correct absolute asset URLs whether deployed at `<user>.github.io/<repo>/` or at a custom domain root.

#### Scenario: Project page deployment
- **WHEN** deployed to `<user>.github.io/<repo>/`
- **THEN** all internal links and assets resolve under `/<repo>/` and no 404 occurs on first navigation

#### Scenario: Custom domain
- **WHEN** a `CNAME` file exists in `public/` and `base` is set to `/`
- **THEN** the same build serves correctly at the custom domain root

### Requirement: GitHub Actions deploy workflow

The repository SHALL include `.github/workflows/deploy.yml` that, on push to `main`, runs `npm ci`, runs `npm run build:letters` with the encrypted-letter secret available, runs `npm run build`, and publishes `dist/` via `actions/upload-pages-artifact` + `actions/deploy-pages`.

#### Scenario: Push to main triggers deploy
- **WHEN** a commit is pushed to `main`
- **THEN** the workflow runs end-to-end and updates the live GitHub Pages deployment within ≤ 5 minutes

#### Scenario: PR build (no deploy)
- **WHEN** a pull request is opened against `main`
- **THEN** the workflow runs the build to verify it succeeds but does not deploy

### Requirement: Letter secret injection

The deploy workflow SHALL inject `data/letters.private.json` from a GitHub Actions repository secret at build time, and SHALL fail the build cleanly if the secret is missing.

#### Scenario: Secret available
- **WHEN** the secret `LETTERS_PRIVATE_JSON` is set on the repository
- **THEN** the workflow writes its contents to `data/letters.private.json` before `npm run build:letters` and the encryption step succeeds

#### Scenario: Secret missing
- **WHEN** the secret `LETTERS_PRIVATE_JSON` is unset
- **THEN** the workflow fails with an explicit error message and does not deploy a partial site

### Requirement: Public env vars at build time

The build SHALL expose `PUBLIC_KAKAO_KEY`, `PUBLIC_SITE_URL`, and `PUBLIC_VENUE_LATLON` via Astro's `import.meta.env` mechanism, sourced from GitHub Actions environment variables.

#### Scenario: Missing required public env
- **WHEN** `PUBLIC_KAKAO_KEY` is unset
- **THEN** the build emits a warning and renders the Kakao share/map sections in fallback mode (web share / static map link)

### Requirement: Performance budget

The deployed site SHALL meet a Lighthouse mobile performance score ≥ 90, accessibility ≥ 90, and best-practices ≥ 90, on the cover page in all three locales.

#### Scenario: CI Lighthouse check
- **WHEN** the workflow runs Lighthouse against the preview build for `/`, `/en/`, `/de/`
- **THEN** all three scores exceed the thresholds; otherwise the workflow flags a warning (non-blocking initially, blocking once stable)

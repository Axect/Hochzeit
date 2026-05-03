## 1. 프로젝트 셋업

- [x] 1.1 `package.json` 초기화 및 Astro/TypeScript/Tailwind 의존성 추가 (`astro`, **Tailwind v4 → `@tailwindcss/vite`**, `typescript`)
- [x] 1.2 `astro.config.mjs` 작성 — `output: 'static'`, `i18n: { defaultLocale: 'ko', locales: ['ko','en','de'], routing: { prefixDefaultLocale: false } }`, `site` / `base`는 env에서 주입
- [x] 1.3 Tailwind v4 셋업 (`@tailwindcss/vite` plugin + `src/styles/global.css` `@import "tailwindcss"` + `@theme` 토큰), 모바일 우선 breakpoint 정의
- [x] 1.4 폰트 셋업 — Pretendard(Hangul) + Inter(Latin). npm 패키지로 자체 호스팅, BaseLayout에서 lang별 preload (실제 preload는 2.7에서 적용)
- [x] 1.5 Prettier + ESLint(flat config, astro plugin 포함) + TypeScript strict 옵션 적용
- [x] 1.6 `.gitignore`에 `data/letters.private.json`, `dist/`, `node_modules/`, `.env*` 등록
- [x] 1.7 `README.md`에 빌드·콘텐츠 갱신 절차 정리

## 2. 콘텐츠 모델 & i18n

- [x] 2.1 `src/content/i18n/{ko,en,de}.json` 스키마 정의 (meta, ui, cover, greeting, schedule, gallery, journey, secretLetter, directions, accounts, share, rsvp, guestbook, footer)
- [x] 2.2 `src/content/schedule.json`, `src/content/gallery.json`, `src/content/journey.json`, `src/config/forms.json`, `src/config/venue.json` placeholder 작성
- [x] 2.3 `scripts/validate-content.ts` 작성 — i18n 키 패리티 + schedule/gallery/journey의 localized field + venue/forms shape 검증
- [x] 2.4 `npm run prebuild`에 `validate:content` + `build:letters` 연결 (build-letters는 Phase 5에서 실제 암호화 구현)
- [x] 2.5 i18n 헬퍼: `src/lib/i18n.ts` (`t`, `tField`, `formatDate`, `formatRelative`, `localizedHref`, `stripLocale`, `detectLocale`, `htmlLang`, `fmt`)
- [x] 2.6 locale 토글 컴포넌트 `src/components/LocaleToggle.astro` — 활성 locale 표시, 동등 페이지로 링크
- [x] 2.7 `<head>`에 `hreflang` 링크와 `<html lang>` 자동 설정하는 레이아웃 `src/layouts/BaseLayout.astro` (skip-link, OG/Twitter, canonical 포함)

## 3. 표준 청첩장 섹션

- [x] 3.1 `src/pages/index.astro` (ko), `src/pages/en/index.astro`, `src/pages/de/index.astro` + 공통 `src/components/Invitation.astro` 컴포지션
- [x] 3.2 `src/components/Cover.astro` — 풀 뷰포트 메인 커버, 이름·날짜·장소·scroll hint
- [x] 3.3 `src/components/Greeting.astro` — 인사말 + 양가 부모님 카드
- [x] 3.4 `src/components/Schedule.astro` — 시간/제목 리스트
- [x] 3.5 `src/components/Gallery.astro` + `GalleryLightbox.tsx` React island — 그리드, 라이트박스 swipe + 키보드 네비게이션
- [x] 3.6 `src/components/Directions.astro` — Kakao Map SDK lazy-load (IntersectionObserver) + 카카오/네이버/TMAP 길찾기 딥링크
- [x] 3.7 `src/components/Accounts.astro` — 양가 계좌 카드 + clipboard 복사 + execCommand fallback + 토스트 + IBAN/BIC 지원
- [x] 3.8 `src/components/ShareButtons.astro` — Kakao Share SDK lazy-load + `navigator.share` fallback + 링크 복사 fallback
- [x] 3.9 OG/Twitter 메타 (BaseLayout): canonical, hreflang, og:locale + alt locales, og:image (lang별 작업은 8.x에서)

## 4. 만남·여행 인터랙티브 섹션

- [x] 4.1 `src/data/journey.json` 스키마 정의 (id, kind, date, lat, lon, title.{ko,en,de}, body.{ko,en,de}) + `validate-content`에서 검증
- [x] 4.2 `d3-geo`, `topojson-client`, `world-atlas` 의존성 추가
- [x] 4.3 `src/components/JourneyMap.tsx` React island — natural-earth1 투영, graticule + countries 메시 + 마커 + 점선 경로
- [x] 4.4 scroll progress(window.scrollY 기반)로 active event index 진행 (rAF 디바운스)
- [x] 4.5 swipe + prev/next 버튼 + 진행 도트 탭으로 수동 네비게이션
- [x] 4.6 active event의 localized title/body/dateFormatted를 사이드 패널에 표시
- [x] 4.7 `prefers-reduced-motion: reduce` 분기 — 정적 모든 마커 + 텍스트 리스트 + 안내문
- [x] 4.8 `client:visible` + d3/topojson/world-atlas 동적 import → 첫 화면에서 0KB
- [ ] 4.9 가장 모바일 작은 viewport(360px)에서 가독성·터치 영역 검증 (8.1로 이관 — 실 디바이스 필요)

## 5. Secret Code 편지

- [x] 5.1 `scripts/generate-codes.ts` — 12자 영숫자(`[a-hjk-mnp-z2-9]`) 코드 N개 생성, 중복 검사, `--append` 옵션
- [x] 5.2 `data/letters.private.json` 스키마: `[{ code, recipient, body: { ko, en?, de? } }]`
- [x] 5.3 `scripts/build-letters.ts` — `idHash = sha256(code)[:16]`, `key = scrypt(code, salt, N=2^15, r=8, p=1, dkLen=32)`, AES-256-GCM (12B IV, 16B tag) → `src/data/letters.encrypted.json`
- [x] 5.4 `npm run build:letters` + prebuild에서 자동 실행 (validate:content 다음에)
- [x] 5.5 `data/letters.private.json` 부재 시 dev: 빈 매핑(configured=false)로 빌드 통과, CI(`CI=true`): 명시적 fail
- [x] 5.6 `src/lib/letter-crypto.ts` + `SecretLetterForm.tsx` — code 정규화·검증, `crypto.subtle.digest` idHash lookup, `@noble/hashes` scrypt + Web Crypto AES-GCM 복호화
- [x] 5.7 SecretLetterForm은 island(`client:visible`) — `@noble/hashes/scrypt`은 island 번들에만 포함되어 첫 화면 LCP에 영향 없음
- [x] 5.8 sessionStorage 기반 rate limit (5회 실패 → 30/60/120/240/480/600초 백오프), 잠금 동안 1초 단위 카운트다운 UI
- [x] 5.9 locale별 letter body 렌더, 누락 시 ko fallback + `missingTranslation` 안내문 표시
- [x] 5.10 `scripts/verify-no-plaintext.ts` — `dist/` 모든 .html/.js/.json/.css/... 파일에서 recipient + body phrase + code 검색, 한 건이라도 매치되면 fail (✓ 3개 letter로 실측 통과)

## 6. RSVP / 방명록

- [x] 6.1 `src/config/forms.json` placeholder (rsvp/guestbook formUrl·langEntry, sheetId·gid·approvedColumn·columns·displayLimit·cacheTtlSeconds)
- [x] 6.2 `src/components/Rsvp.astro` — `?usp=pp_url&entry.{lang}=<locale>` prefill, 새 창 오픈, placeholder 감지 시 안내
- [x] 6.3 `src/components/Guestbook.astro` + `GuestbookList.tsx` (React island) — `gviz/tq?tqx=out:json` fetch, `approved=Y` 필터, 최신 N개 카드 렌더
- [x] 6.4 `sessionStorage` 5분 SWR 캐시 (cacheTtlSeconds 설정 가능)
- [x] 6.5 fetch 실패 시 errorTitle/errorBody + retry 버튼 fallback
- [x] 6.6 entry 카드: 이름 + 메시지 + locale 국기 (🇰🇷🇬🇧🇩🇪) + `Intl.RelativeTimeFormat` 상대 시각
- [x] 6.7 방명록 폼 링크도 활성 locale 전달 (langEntry prefill)

## 7. 빌드 & 배포

- [x] 7.1 `astro.config.mjs`의 `site`/`base`를 `PUBLIC_SITE_URL`/`BASE_PATH` env에서 읽도록 분기
- [x] 7.2 `.github/workflows/deploy.yml` — `main` push + PR + workflow_dispatch 트리거, `npm ci` → secret을 `data/letters.private.json`으로 디코드 → `npm run build` → `npm run verify:no-plaintext` → `actions/upload-pages-artifact` → `actions/deploy-pages`
- [x] 7.3 PR 트리거 시 `build` job 만 수행, `deploy` job은 `if: github.event_name == 'push' || workflow_dispatch'` 가드
- [x] 7.4 secret `LETTERS_PRIVATE_JSON` 부재 시 워크플로에서 `::error::` 로 명시적 실패 + build-letters 자체에서도 `CI=true` 분기로 fail
- [x] 7.5 `PUBLIC_KAKAO_KEY`, `PUBLIC_SITE_URL`, `BASE_PATH`, `PUBLIC_VENUE_LATLON`을 GitHub Actions vars로 받아 build env에 주입 (PUBLIC_SITE_URL/BASE_PATH는 미설정 시 `<owner>.github.io/<repo>/` 자동 fallback)
- [x] 7.6 README에 커스텀 도메인 + `public/CNAME` 절차 문서화
- [x] 7.7 `.github/workflows/lighthouse.yml` + `.github/lighthouse/lighthouserc.json` — PR마다 ko/en/de 페이지에 perf/a11y/best-practices/seo ≥ 0.9 어드바이저리 체크 (`continue-on-error: true`, 차단형 승격은 후속)

## 8. 검증 & 출시 준비

- [ ] 8.1 실제 휴대폰(iOS Safari, Android Chrome) 360px / 414px / 768px에서 전 섹션 동작 확인 — **사용자 작업 필요**
- [x] 8.2 ko/en/de 각 페이지에서 모든 i18n 키 패리티 — `validate:content` 자동화 완료 (실 콘텐츠 채운 뒤 재실행)
- [ ] 8.3 카카오맵 도메인 등록(`<repo>.github.io` 또는 커스텀 도메인) 후 운영 키 교체 — **사용자 작업 필요** (Kakao Developers Console)
- [ ] 8.4 카카오톡 공유 — Kakao Developers에 사이트 도메인 등록, 실 디바이스에서 share sheet 검증 — **사용자 작업 필요**
- [ ] 8.5 Google Form (RSVP, 방명록) 실제 생성, prefill URL 검증, 응답 시트 published 설정 — **사용자 작업 필요** (`src/config/forms.json` 갱신)
- [ ] 8.6 게스트 코드 발급 — 실제 인원수만큼 생성 (`npm run generate:codes -- --count N --append`), 1회용 카드/메시지로 배포 — **사용자 작업 필요**
- [x] 8.7 `dist/`에서 평문 letter content grep 통과 — `verify:no-plaintext` 자동화 완료 (테스트 letter 3건으로 실측 통과, deploy 워크플로에 통합)
- [x] 8.8 `openspec validate mobile-wedding-invitation --strict` 통과
- [ ] 8.9 결혼식 D-1 최종 빌드 + 백업으로 `dist/` 아카이브 보관 — **사용자 작업 필요** (D-1)

## Context

이 프로젝트는 한국인 신랑과 독일인 신부 Andrea의 결혼식 모바일 청첩장이며, 신규 정적 사이트로 제로에서 시작한다. 호스팅은 GitHub Pages, RSVP·방명록 백엔드는 Google Forms / Google Sheets로 제한된다. 즉, 사용 가능한 런타임은 사용자 브라우저뿐이고, 서버 측 비밀 검증·세션·DB는 없다. 이 제약 하에서 (1) 표준 청첩장 UX, (2) 한·영·독 다국어, (3) 인터랙티브 만남·여행 시각화, (4) 게스트별 비밀 코드 편지를 모두 제공해야 한다.

## Goals / Non-Goals

**Goals:**
- 모바일 우선, Lighthouse 모바일 성능·접근성 ≥ 90.
- 정적 빌드만으로 GitHub Pages에서 동작 (서버 코드 0줄).
- 한국어 기본, 토글 한 번으로 영·독 동등 콘텐츠 전환.
- 만남·여행 섹션은 텍스트만 읽어도 이해 가능하되, 인터랙션 시 드라마틱한 애니메이션 제공 (점진적 향상).
- 게스트별 편지는 정적 번들에 평문으로 포함되지 않으며, 코드 없이는 본문 추출 불가.
- 콘텐츠 수정(텍스트, 사진, 좌표, 코드·편지 추가) 시 코드 변경 없이 데이터 파일만 갱신.

**Non-Goals:**
- 자체 백엔드/DB·인증·관리자 페이지.
- 게스트 편지의 "강한" 암호 보안 (국가급 공격자 방어 X). 위협 모델은 호기심 있는 친지 / 코드 추측 시도이며, 이에 대해 실용적 강도(scrypt 파생키 + AES-GCM)면 충분.
- 결혼식 후 영구 운영. 1년 이내 아카이브 가정 (도메인 갱신·SDK 키 만료 OK).
- 라이브 스트리밍·결제·축의금 처리.

## Decisions

### D1. 프레임워크: Astro + Tailwind (vs Next.js / SvelteKit / 순수 HTML)
- **선택**: Astro 정적 빌드 + Tailwind CSS + TypeScript. 인터랙티브 부분만 "island"로 (`client:visible`) 하이드레이션.
- **이유**: 정적 청첩장 99%는 마크업·CSS·이미지. JS 번들 최소화로 모바일 LCP·TTI 우수. Tailwind는 i18n 텍스트 길이 변동에 대한 유틸리티 기반 레이아웃에 강함.
- **대안**:
  - Next.js: SSR/Edge 인프라 불필요하고 번들 큼.
  - SvelteKit: 가능하지만 Astro 쪽이 정적·다국어 라우팅 ergonomics가 단순.
  - 순수 HTML: 다국어 + 6+ 섹션 + 인터랙션 관리가 빠르게 한계.

### D2. 다국어 라우팅: Astro built-in i18n (`/`, `/en/`, `/de/`)
- **선택**: Astro `i18n` config로 `defaultLocale: 'ko'`, `prefixDefaultLocale: false`, locales `['ko','en','de']`. 콘텐츠는 `src/content/i18n/{ko,en,de}.json` 단일 키 트리.
- **이유**: SEO `hreflang` 자동 생성, prerender 시 lang별 정적 페이지 분리 → 페이지당 lang 번들만 로드. 토글은 단순 `<a>` 링크.
- **대안**: `?lang=` 쿼리 — 캐시·SEO 불리, 클라이언트 JS로 swap해야 함. 기각.

### D3. 만남·여행 시각화: D3-geo + world-atlas + 자체 SVG 애니메이션 (vs MapLibre / 외부 지도)
- **선택**: `d3-geo` + `world-atlas` topojson(110m, ~120KB) + 사용자 정의 투영(자연 지구). 좌표·날짜·메모는 `src/content/journey.json` 배열.
- **이유**: 청첩장 톤(따뜻한 일러스트풍)에 맞춰 색·곡선·마커를 자유 스타일링. 도시 줌·검색·실시간 타일이 필요 없음. MapLibre는 지도 타일 제공자(상업) 종속 + 무거운 번들.
- **대안**:
  - MapLibre GL JS: vector tile + 부드러운 팬/줌이지만 청첩장에 과도. 기각.
  - 정적 SVG 일러스트 + Framer Motion: 가장 가볍지만 좌표↔지도 변환을 손으로 해야 하고 확장성 떨어짐. D3-geo가 양쪽 장점 절충.
- **인터랙션**: 모바일에서는 스크롤 진행도(IntersectionObserver) 기반 자동 진행, 탭/스와이프로 이전/다음 이벤트 점프. 큰 화면에서는 호버 미리보기.

### D4. Secret Code 편지 보안 모델
- **위협 모델**: (a) 호기심 있는 게스트가 페이지 소스를 열어 다른 게스트의 편지를 읽으려 함. (b) 코드를 추측·열거하려 함. 국가급/장기 오프라인 공격은 범위 외.
- **선택**: 빌드 시 코드별 편지를 `scrypt(code, salt)` 파생키로 AES-GCM 암호화하고, `SHA-256(code)`의 앞 16바이트를 인덱스 키로 하여 `{ idHash → { iv, ciphertext, tag } }` 매핑을 정적 JSON으로 배포. 클라이언트는 입력된 code로 동일 해시 계산 → 매핑 조회 → 동일 KDF로 키 파생 → 복호화 → 렌더.
- **파라미터**: code = 영숫자 12자(소문자 + 숫자, 시각적 모호 문자 i,l,o,0,1 제외, ~32^12 ≈ 1.15 × 10^18). scrypt N=2^15, r=8, p=1 (브라우저에서 ~200ms). 한 시도당 ~200ms 비용 → 추측 공격 비실용적.
- **저장 위치**: `data/letters.private.json`(gitignore) → 로컬 빌드 또는 GitHub Actions secret로 주입. 공개 산출물은 암호문만 포함.
- **장애 모드**: 잘못된 코드 → 매핑 미스 → "코드를 다시 확인해주세요" UI. 추측 시도에 클라이언트 측 rate limit (sessionStorage에 실패 카운트, 5회 후 30초 백오프).
- **대안**:
  - 코드 = 편지 URL 슬러그(난독화만): 소스 검색으로 노출. 기각.
  - 서버 API: 정적 호스팅 제약 위반. 기각.
  - 단순 SHA-256 매핑(비암호): 매핑 자체가 노출되어 소스 보면 모든 hash → letter 맵을 볼 수 있음. 기각. 암호화 필수.

### D5. RSVP / 방명록: Google Forms 임베드 + 방명록 표시는 Sheet published CSV
- **RSVP**: Google Form embed(iframe) — 가장 단순. 모바일에서 iframe 높이 자동 조정 어려움 → "참석 의사 보내기" 버튼으로 새 창 오픈을 기본으로, iframe은 옵션.
- **방명록 입력**: 별도 Google Form (이름 + 메시지 + lang 필드).
- **방명록 표시**: 동일 Sheet의 응답 탭을 "웹에 게시"로 published → `https://docs.google.com/spreadsheets/d/.../gviz/tq?tqx=out:json` fetch → 최근 N개 카드 렌더. 5분 SWR 캐시(브라우저 sessionStorage).
- **위험**: Google이 published CSV/JSON endpoint를 미래에 변경/제거. → fallback으로 form 링크만 노출. 부적절 콘텐츠는 신랑·신부가 시트에서 직접 삭제·승인 컬럼 추가(예: `approved=Y`만 표시).

### D6. 카카오맵 + 카카오톡 공유
- 카카오 Developers 앱 등록, JavaScript 키와 사이트 도메인(github.io 페이지 또는 커스텀) 등록.
- 키는 빌드 시 `import.meta.env.PUBLIC_KAKAO_KEY`로 주입(공개되어도 도메인 제한으로 무용). GitHub Actions secret + Astro env.
- 카카오톡 공유: Kakao SDK `Kakao.Share.sendDefault({ objectType: 'feed', ... })`. og:image, og:title은 lang별로 다르게 prerender.

### D7. 콘텐츠 모델
```
src/content/
  i18n/{ko,en,de}.json       # 모든 텍스트 (greeting, schedule, gallery captions, ...)
  journey.json               # [{ id, lat, lon, date, title.{ko,en,de}, body.{ko,en,de}, kind: letter|visit|trip }]
  schedule.json              # [{ time, title.{ko,en,de} }]
  gallery.json               # [{ src, alt.{ko,en,de}, blurDataURL }]
data/
  letters.private.json       # gitignore: [{ code, recipient, body.{ko,en,de} }]
  build-letters.ts           # 빌드 전 실행: letters.private.json → src/content/letters.encrypted.json
src/content/letters.encrypted.json   # 빌드 산출물 (커밋 가능, 암호문만)
```

### D8. 배포: GitHub Pages + GitHub Actions
- `.github/workflows/deploy.yml`: push to `main` → `npm ci` → `npm run build:letters` (시크릿 주입) → `npm run build` (Astro) → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- Pages 설정: "Build from GitHub Actions". 커스텀 도메인은 옵션, 미설정 시 `<user>.github.io/<repo>/` 하위 경로 → `astro.config.mjs`의 `site` + `base` 설정 필수.

## Risks / Trade-offs

- **[Risk] Secret code 편지가 약한 코드(짧거나 추측 가능한 단어) 시 노출** → 코드 생성기로 12자 암호학적 난수만 발급, 사람이 직접 정하지 못하도록.
- **[Risk] Google Sheets API/published 형식 변경** → 방명록 fetch 실패 시 form 링크 fallback, 빌드 타임 캐시(JSON snapshot)로도 보강.
- **[Risk] D3-geo + topojson 번들 ~150KB** → 만남 섹션 island를 `client:visible`로 하여 첫 화면 LCP에서 제외, 스크롤 도달 시 lazy load.
- **[Risk] 카카오 SDK는 한국 도메인 정책상 비-한국 IP에서 차단되거나 느림** → 독일 친지가 접속 시 카카오 공유는 graceful degrade(웹 표준 `navigator.share`로 대체).
- **[Risk] i18n 콘텐츠 비대칭(독일어 번역 누락)** → JSON 스키마 검증 스크립트로 빌드 시 누락 키 fail.
- **[Trade-off] 정적 빌드 → 편지·코드 추가 시마다 재빌드·재배포 필요** → 결혼식 직전엔 코드 풀이 비교적 고정이라 수용 가능. 푸시 한 번 = 배포 한 번.
- **[Trade-off] 방명록 표시는 Google Sheet 가공 결과만 렌더, 실시간 업데이트 X** → 5분 SWR + 새로고침으로 충분.

## Migration Plan

신규 프로젝트라 마이그레이션 대상 없음. 단계는 tasks.md 참고. 롤백은 GitHub Pages 이전 deployment로 즉시 복구.

## Open Questions

- 결혼식 날짜·장소·신랑/신부 부모님 성함 등 실제 콘텐츠 — 구현 단계에서 데이터 파일에 채움.
- 도메인: `<repo>.github.io` 하위 경로로 갈지, 커스텀 도메인(예: `andrea-and-<groom>.de` 등) 등록할지.
- 만남 타임라인 이벤트 수 (5개? 15개?) — 콘텐츠 측 결정.
- 게스트 코드 발급 채널: 카카오톡 1:1 메시지에 코드 + 청첩장 링크 동봉?

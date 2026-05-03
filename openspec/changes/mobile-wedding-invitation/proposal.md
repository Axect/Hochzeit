## Why

신랑(한국인)과 신부 Andrea(독일인)의 결혼식 모바일 청첩장이 필요하다. 한국 친지에게는 익숙한 청첩장 포맷을(메인/인사말/식순/갤러리/오시는길/계좌/RSVP), 독일·해외 친지에게는 한·영·독 토글로 동등한 경험을 제공해야 한다. 동시에 두 사람의 글로벌한 만남 서사와 게스트별 개인화된 메시지를 통해 일반 템플릿 청첩장과 차별화된, 기억에 남는 경험을 만든다.

## What Changes

- 신규 Astro + Tailwind 정적 사이트 프로젝트 셋업, GitHub Pages 배포 파이프라인 구성.
- 표준 청첩장 섹션 구현: 메인 커버, 인사말, 식순, 사진 갤러리(라이트박스), 오시는 길(카카오맵 임베드 + 길찾기 딥링크), 계좌번호 복사, 카카오톡 공유.
- 한/영/독 3국어 i18n. 기본 한국어, 우상단 토글로 `?lang=en|de` 또는 `/en/`·`/de/` 라우트 전환. 모든 텍스트 콘텐츠는 단일 콘텐츠 소스(예: `src/content/i18n/*.json`)에서 관리.
- 인터랙티브 "우리의 만남" 섹션: 세계지도 위에 한국–독일 첫 편지 → Andrea 한국 방문 → 함께한 글로벌 여행지를 좌표·날짜·짧은 메모로 시각화하는 타임라인 애니메이션. 모바일 스크롤·스와이프 인터랙션.
- Secret Code 개인 편지: 게스트마다 고유한 난독화 코드(예: 8–12자 영숫자) 부여. 사이트에 코드 입력 시 해당 게스트 전용 편지가 표시. 코드는 추론·열거 불가능해야 하고, 편지 본문은 빌드 산출물에서 평문으로 노출되지 않아야 함.
- RSVP / 방명록은 Google Forms 임베드 또는 외부 링크로, 표시(방명록 최근 글)는 공개 Google Sheet의 published CSV/JSON을 fetch하여 렌더.
- 모바일 우선 반응형, 라이트하우스 성능·접근성 점수 고려. 폰트는 한·영·독 모두를 커버.

## Capabilities

### New Capabilities
- `core-invitation`: 메인 커버, 인사말, 식순, 사진 갤러리, 오시는 길, 계좌번호 복사, 공유 등 표준 모바일 청첩장 섹션과 모바일 우선 레이아웃.
- `multilingual-content`: 한국어 기본의 한/영/독 3국어 콘텐츠 모델, 언어 토글 UI, 라우팅, SEO `hreflang`.
- `our-meeting-animation`: 세계지도 + 타임라인 기반의 인터랙티브 만남·여행 서사 섹션.
- `secret-letters`: 난독화된 1회성 코드로 보호된 게스트별 개인 편지의 저장·조회·렌더링 모델.
- `rsvp-guestbook`: Google Forms 기반 RSVP 제출과 Google Sheet 기반 방명록 표시 통합.
- `static-deploy`: Astro 정적 빌드와 GitHub Pages 배포 워크플로(GitHub Actions + 커스텀 도메인 옵션 + 비밀 데이터 빌드 시 주입).

### Modified Capabilities
<!-- 신규 프로젝트라 변경 대상 기존 spec 없음 -->

## Impact

- 새 디렉터리: `src/`, `public/`, `astro.config.mjs`, `tailwind.config.cjs`, `package.json`, `.github/workflows/deploy.yml`.
- 콘텐츠 디렉터리: `src/content/i18n/{ko,en,de}.json`, `src/content/journey.json`(만남·여행 좌표/날짜), `src/content/letters/`(코드별 편지 — 빌드 시 해시 키로 분리 저장).
- 의존성: `astro`, `@astrojs/tailwind`, `tailwindcss`, `astro-icon`(또는 lucide), 지도 라이브러리(MapLibre GL JS 또는 d3-geo + topojson), 카카오맵 SDK 스크립트, 카카오톡 JS SDK(공유용).
- 외부 시스템: Google Forms / Google Sheets(공개 published 링크), Kakao Developers 앱 키(JS 도메인 등록), GitHub Pages 호스팅.
- 개인정보·기밀: 게스트 편지 본문은 평문 번들 금지 — 코드에서 파생된 키로 암호화·해시 매핑된 산출물만 배포.

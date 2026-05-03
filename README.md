# Hochzeit — 청첩장 / Wedding Invitation / Hochzeitseinladung

신랑(🇰🇷)과 Andrea(🇩🇪)의 결혼식 모바일 청첩장. Astro + Tailwind, GitHub Pages 정적 배포.

## Stack

- [Astro 5](https://astro.build/) — 정적 빌드, i18n 라우팅
- Tailwind CSS v4 (`@tailwindcss/vite`)
- TypeScript strict
- React island (라이트박스, 비밀 편지, 방명록, 만남 지도)
- Pretendard (Hangul) + Inter (Latin)

## 로컬 개발

```bash
npm install
npm run dev          # http://localhost:4321/
```

## 빌드

```bash
npm run build        # validate:content → build:letters → astro build
npm run preview
```

`prebuild`가 자동으로 다음을 수행한다:

1. `npm run validate:content` — i18n 키와 콘텐츠 JSON 무결성 검증
2. `npm run build:letters` — `data/letters.private.json`을 읽어 코드별 편지를 암호화하고 `src/content/letters.encrypted.json`에 저장 (파일 부재 시 dev에선 빈 매핑, CI에선 실패)

## 콘텐츠 갱신

수정 후 `npm run build`만 다시 실행하면 된다. 코드 수정은 필요 없다.

| 항목 | 파일 |
|---|---|
| 모든 텍스트 (인사말·UI·식순 라벨) | `src/data/i18n/{ko,en,de}.json` |
| 식순 시간표 | `src/data/schedule.json` |
| 사진 갤러리 | `src/data/gallery.json` (+ `public/gallery/`) |
| 만남·여행 타임라인 | `src/data/journey.json` |
| 폼·시트 URL | `src/config/forms.json` |
| 식장 좌표·주소·계좌 | `src/config/venue.json` |
| 게스트 편지 (gitignored) | `data/letters.private.json` |

## 비밀 편지 (Secret Code Letters)

게스트별 12자 코드는 **이름 + 순번 + 비밀 salt 의 SHA-256 해시**로 결정론적으로 파생된다. 즉 코드는 어디에도 저장되지 않고, 같은 (이름, 순번, salt) 입력이면 언제나 같은 코드가 다시 나온다. 사용자(신랑·신부)가 직접 코드를 외울 필요 없다.

### 권장 흐름 (codes.private.json)

```bash
cp data/codes.private.example.json data/codes.private.json
# 1) salt 를 32자 이상의 랜덤 문자열로 교체
# 2) guests[]에 { order, name, recipient?, body: { ko, en?, de? } } 항목 추가
npm run derive:codes      # 게스트별 (order, name, code) 매핑 출력
npm run build             # 자동으로 derive → 암호화 → 빌드
npm run verify:no-plaintext  # dist/에 평문 누출 없는지 확인
```

게스트에게 보낼 때:
- 카카오톡/메일에 `https://axect.github.io/Hochzeit/` + `<derived code>` 한 줄.
- 코드만 알려주면 사이트의 "당신을 위한 편지" 섹션에서 입력 → 본인 편지가 열림.

### 단발 코드 한 개만 필요할 때

```bash
npm run derive:code -- --name "민수형" --order 1 --salt "<my-secret-salt>"
# → 86g658n24cp9
```

### 알고리즘

- 정규화: `name = NFC(trim(name))`
- 입력: `H = SHA-256(name || U+001F || decimal(order) || U+001F || salt)`
- 코드: `code[i] = ALPHABET[H[i] % 31]`, i = 0..11
- 알파벳: `abcdefghjkmnpqrstuvwxyz23456789` (시각적으로 헷갈리는 i, l, o, 0, 1 제외)

### 보안 모델

- `dist/`에 평문 편지·이름·코드가 남지 않는다 (per-letter scrypt-derived AES-256-GCM, idHash = SHA-256(code)[:16]).
- `data/codes.private.json` 은 gitignored — 신랑·신부 로컬에만 보관.
- 누군가 사이트 소스를 통째로 받아도 코드 없이는 단 한 통도 복호화할 수 없다 (코드당 평균 ~200ms scrypt 비용).

자세한 내용은 `openspec/changes/mobile-wedding-invitation/design.md §D4` 참조.

## 배포 (GitHub Pages)

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드·배포한다. PR을 열면 같은 워크플로의 `build` job만 실행되어 빌드가 깨지지 않았는지 확인하지만 배포는 하지 않는다.

### 1단계: 저장소 설정

1. **Settings → Pages → Build and deployment** 를 `GitHub Actions` 로 변경.
2. 아래 secret/variable 등록:

| 이름 | 종류 | 설명 |
|---|---|---|
| `LETTERS_PRIVATE_JSON` | **secret** | `data/codes.private.json` 전체 내용을 그대로 붙여넣기. 부재 시 빌드 실패. |
| `PUBLIC_SITE_URL` | variable (옵션) | 최종 사이트 URL. 미설정 시 `https://<owner>.github.io/<repo>/`로 자동. |
| `BASE_PATH` | variable (옵션) | 베이스 경로. 미설정 시 `/<repo>/` 자동, 커스텀 도메인 사용 시 `/`로 변경. |

> 카카오 SDK 키는 더 이상 필요하지 않다. 지도(Directions)는 카카오 "지도 퍼가기" 임베드 + 구글맵 임베드를 키 없이 사용하고, 공유 기능은 단순 링크 복사로 단순화했다.

### 2단계 (옵션): 커스텀 도메인

커스텀 도메인을 쓰려면:

1. 도메인 DNS에서 `<owner>.github.io`로 CNAME (apex 도메인은 A 레코드로 GitHub Pages IP).
2. `public/CNAME` 파일을 만들어 도메인 한 줄을 적는다.
   ```bash
   echo "your-domain.example" > public/CNAME
   ```
3. Settings → Pages 의 Custom domain에 같은 도메인 입력.
4. `BASE_PATH` 변수를 `/` 로 변경, `PUBLIC_SITE_URL` 을 `https://your-domain.example/` 로 갱신.

### 3단계 (옵션): Lighthouse 어드바이저리

`.github/workflows/lighthouse.yml` 가 PR마다 `dist/`를 Lighthouse로 측정한다. 임계값 미달 시 경고만 내고 차단하지는 않는다 (`continue-on-error: true`). 사이트가 안정화된 후 `assert` 의 `warn` 을 `error` 로 승격시켜 차단형으로 바꾸면 됨.

## 디렉터리

```
src/
  pages/          # 라우트 (ko=/, en=/en/, de=/de/)
  layouts/        # BaseLayout
  components/     # Cover, Greeting, Schedule, Gallery, Directions, Accounts, ...
  content/        # i18n, schedule, gallery, journey, letters.encrypted
  config/         # forms, venue
  lib/            # i18n helper, etc.
  styles/         # global.css (Tailwind import + theme tokens)
data/
  letters.private.json   # gitignored
scripts/
  validate-content.ts
  build-letters.ts
  generate-codes.ts
  verify-no-plaintext.ts
public/                  # 정적 자산, CNAME (옵션)
```

## 라이선스

비공개. 결혼식 후 아카이브 예정.

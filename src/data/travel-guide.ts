import type { Locale } from '@lib/i18n';

type LocaleString = Record<Locale, string>;

export type GuideBlock =
  | { type: 'h3'; text: LocaleString }
  | { type: 'p'; text: LocaleString }
  | { type: 'ul'; items: LocaleString[] }
  | { type: 'ol'; items: LocaleString[] }
  | { type: 'callout'; text: LocaleString; tone?: 'tip' | 'warn' };

export type GuideSection = {
  id: string;
  badge?: LocaleString;
  heading: LocaleString;
  lead: LocaleString;
  blocks: GuideBlock[];
};

export type Phrase = {
  ko: string;
  rom: string;
  en: string;
  de: string;
};

export type TravelGuideData = {
  meta: {
    title: LocaleString;
    description: LocaleString;
  };
  back: LocaleString;
  intro: LocaleString[];
  sections: GuideSection[];
  phrasesIntro: LocaleString;
  phrases: Phrase[];
  emergencyHeading: LocaleString;
  emergencyItems: LocaleString[];
  miscHeading: LocaleString;
  miscItems: LocaleString[];
  outroBack: LocaleString;
};

export const travelGuide: TravelGuideData = {
  meta: {
    title: {
      ko: '외국 손님을 위한 한국 여행 가이드',
      en: 'Travel Guide — Getting to Venuevian',
      de: 'Reiseführer — Anreise zum Venuevian',
    },
    description: {
      ko: '인천공항에서 베뉴비안까지, 외국 손님을 위한 친절한 안내서.',
      en: 'A friendly step-by-step guide from Incheon Airport to Venuevian for our international guests.',
      de: 'Eine ausführliche Schritt-für-Schritt-Anleitung vom Flughafen Incheon zum Venuevian für unsere internationalen Gäste.',
    },
  },
  back: {
    ko: '← 청첩장으로 돌아가기',
    en: '← Back to the invitation',
    de: '← Zurück zur Einladung',
  },
  intro: [
    {
      ko: '해외에서 결혼식에 와 주시는 분들을 위한 자세한 안내서입니다. 인천공항에서 베뉴비안(신풍역)까지 도착하는 세 가지 방법과 한국에서 유용한 팁을 정리했습니다.',
      en: 'This is a step-by-step guide for guests travelling to Seoul for our wedding. It covers three ways to reach Venuevian (right at Sinpung Station) from Incheon Airport, plus practical tips for getting around Korea.',
      de: 'Dieser Leitfaden richtet sich an unsere Gäste aus dem Ausland. Er beschreibt Schritt für Schritt drei Wege vom Flughafen Incheon zum Venuevian (direkt an der Sinpung-Station) und gibt praktische Tipps für den Aufenthalt in Korea.',
    },
    {
      ko: '한국에 계신 가족·친구가 외국 손님께 미리 보여 드리거나, 도착 후 함께 보면서 안내하실 때 참고해 주세요.',
      en: "If you're meeting friends arriving from abroad, you can also use this page to walk them through the journey before or after they land.",
      de: 'Wer Gäste am Flughafen abholt oder ihnen vorab Informationen schicken möchte, kann diese Seite gerne weitergeben.',
    },
  ],
  sections: [
    {
      id: 'bus-6008',
      badge: {
        ko: '가장 추천',
        en: 'Recommended',
        de: 'Empfohlen',
      },
      heading: {
        ko: '① 공항 리무진버스 6008번',
        en: '① Airport Limousine Bus #6008',
        de: '① Flughafenbus Nr. 6008',
      },
      lead: {
        ko: '환승 없이 베뉴비안 코앞 신풍역까지 한 번에 도착합니다. 짐이 많거나 처음 한국에 오시는 분께 가장 권합니다.',
        en: 'A single seat all the way from the airport to Sinpung Station — right at the venue. The easiest option if you have luggage or it is your first time in Korea.',
        de: 'Eine einzige Fahrt vom Flughafen direkt bis zur Sinpung-Station — am Veranstaltungsort. Die einfachste Option mit Gepäck oder beim ersten Korea-Besuch.',
      },
      blocks: [
        {
          type: 'h3',
          text: {
            ko: '탑승 위치',
            en: 'Where to board',
            de: 'Einstiegsort',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'T1 (1터미널): 1층 도착층 6번 게이트로 나와 도로 건너편 정류장. 노란색 디지털 안내판에서 "6008" 노선 번호를 확인하세요.',
              en: 'Terminal 1: exit through Gate 6 on the Arrivals floor (1F) and cross to the bus platform across the road. Look for "6008" on the yellow digital signboard.',
              de: 'Terminal 1: Verlasse die Ankunftsebene (1. OG) durch Tor 6 und überquere die Straße zum Bussteig. Auf der gelben Anzeigetafel die Nummer „6008" suchen.',
            },
            {
              ko: 'T2 (2터미널): 지하 1층(B1) 27번 게이트. 도착 후 에스컬레이터로 한 층 내려가시면 됩니다.',
              en: 'Terminal 2: Gate 27 on basement level B1. Take the escalator one floor down from arrivals.',
              de: 'Terminal 2: Tor 27 in Untergeschoss B1. Eine Etage tiefer per Rolltreppe ab Ankunft.',
            },
            {
              ko: '게이트 번호는 가끔 변경될 수 있으니, 의심스러우면 안내데스크의 노란 조끼 직원에게 "6008?"이라고 보여 주시면 됩니다.',
              en: 'Gate numbers can change occasionally — if in doubt, show "6008" to a staff member in a yellow vest at the information desk.',
              de: 'Die Tornummern können sich gelegentlich ändern — im Zweifelsfall zeige einer Mitarbeiterin in gelber Weste am Infoschalter „6008".',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '결제 방법',
            en: 'How to pay',
            de: 'Bezahlung',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'T-money 교통카드 (가장 편함): 탑승 시 단말기에 카드를 터치하고, 내릴 때 한 번 더 터치하면 ₩17,000 자동 차감.',
              en: 'T-money transit card (easiest): tap on when boarding, tap off when alighting — ₩17,000 deducted automatically.',
              de: 'T-money Verkehrskarte (am einfachsten): Beim Einsteigen ans Lesegerät halten, beim Aussteigen erneut. Es werden automatisch 17.000 ₩ abgebucht.',
            },
            {
              ko: '해외 신용카드: Visa·Mastercard 결제 가능. 단말기에 카드를 한 번 대 주세요.',
              en: 'Foreign credit card: Visa and Mastercard accepted. Tap once on the reader.',
              de: 'Ausländische Kreditkarte: Visa und Mastercard werden akzeptiert. Einmal an das Lesegerät halten.',
            },
            {
              ko: '현금: ₩17,000을 정확히 준비하시거나, 운전기사에게 거스름돈을 받으실 수 있어요. 사전 예약은 필요 없습니다.',
              en: 'Cash: bring ₩17,000 in correct change if possible — drivers can give change but it slows boarding. No advance booking needed.',
              de: 'Bargeld: möglichst 17.000 ₩ passend bereithalten. Wechselgeld ist möglich, verzögert aber das Einsteigen. Keine Reservierung nötig.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '신풍역에서 내리는 법',
            en: 'Getting off at Sinpung Station',
            de: 'Aussteigen an der Sinpung-Station',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '차량 안 디지털 안내판에 다음 정류장이 한국어와 영어로 표시됩니다. "신풍역 / Sinpung Station" 글자가 보이면 좌석 옆 또는 손잡이 기둥의 빨간 정차 버튼을 누르세요.',
              en: 'Inside the bus, a digital screen announces upcoming stops in Korean and English. When you see "Sinpung Station / 신풍역", press the red stop button on the seat side or pillar.',
              de: 'Im Bus zeigt eine digitale Anzeige die nächsten Haltestellen auf Koreanisch und Englisch. Bei „Sinpung Station / 신풍역" den roten Halteknopf an Sitz oder Säule drücken.',
            },
            {
              ko: '내린 곳에서 약 50m 거리에 신풍역 1번 출구가 있습니다. 베뉴비안은 신풍역 바로 옆이라 도보 5분.',
              en: 'You alight roughly 50 m from Exit 1 of Sinpung Station. Venuevian is a 5-minute walk from there.',
              de: 'Du steigst etwa 50 m vom Ausgang 1 der Sinpung-Station aus. Das Venuevian ist von dort 5 Minuten zu Fuß.',
            },
            {
              ko: '실수로 한 정류장 더 가셔도 괜찮아요 — 다음 정류장(래미안에스티움)에서 내려 신풍역 방향으로 도보 약 5분.',
              en: 'If you accidentally miss the stop, get off at the next one (Raemian Estium) and walk back about 5 minutes towards Sinpung Station.',
              de: 'Wenn du die Haltestelle verpasst, steige an der nächsten (Raemian Estium) aus und gehe ca. 5 Minuten zurück Richtung Sinpung-Station.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '운행 정보',
            en: 'Schedule',
            de: 'Fahrplan',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '운행 시간: 대략 06:40~22:40 (T2 → T1 순으로 정차하므로 T2가 몇 분 빠릅니다). 정확한 시각은 airportlimousine.co.kr에서 확인.',
              en: 'Operating hours: roughly 06:40–22:40 (T2 picks up a few minutes before T1). Verify the exact times on airportlimousine.co.kr.',
              de: 'Betriebszeit: etwa 06:40–22:40 Uhr (T2 wird ein paar Minuten vor T1 bedient). Genaue Zeiten auf airportlimousine.co.kr prüfen.',
            },
            {
              ko: '배차 간격: 시간대에 따라 약 40~80분 (출발 시각은 사전 확인 권장)',
              en: 'Frequency: roughly every 40–80 min depending on time of day — worth checking the timetable in advance.',
              de: 'Taktung: je nach Tageszeit etwa alle 40–80 Min. — Fahrplan vorher prüfen empfohlen.',
            },
            {
              ko: '신풍역까지 약 60~75분 (교통상황에 따라 다름)',
              en: 'Travel time to Sinpung: about 60–75 minutes depending on traffic.',
              de: 'Fahrzeit bis Sinpung: ca. 60–75 Minuten je nach Verkehr.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          text: {
            ko: '공식 시간표: airportlimousine.co.kr — 결혼식 1주 전쯤 한 번 더 확인하시면 좋습니다.',
            en: 'Official schedule: airportlimousine.co.kr — worth a second check about a week before the wedding in case anything changes.',
            de: 'Offizieller Fahrplan: airportlimousine.co.kr — etwa eine Woche vor der Hochzeit lohnt sich ein erneuter Blick.',
          },
        },
        {
          type: 'callout',
          tone: 'warn',
          text: {
            ko: '23시 이후 도착하시는 경우 6008번 막차가 끊겨 있을 수 있어요. 다음 옵션(국제택시)을 추천드립니다.',
            en: 'If your flight lands after 23:00, the last #6008 may have already departed. Plan to take an International Taxi instead.',
            de: 'Bei Ankunft nach 23:00 Uhr könnte der letzte 6008 bereits weg sein. In dem Fall ein International Taxi nutzen.',
          },
        },
      ],
    },
    {
      id: 'intl-taxi',
      heading: {
        ko: '② 국제택시 (International Taxi)',
        en: '② International Taxi (fixed flat rate)',
        de: '② International Taxi (Festpreis)',
      },
      lead: {
        ko: '영문 가능 기사가 운전하는 정액제 택시입니다. 늦게 도착하시거나, 일행이 4명 이상이거나, 짐이 매우 많을 때 추천합니다.',
        en: 'A flat-rate taxi service with English-speaking drivers. Best for late arrivals, groups of four or more, or anyone with a lot of luggage.',
        de: 'Ein Taxidienst zum Festpreis mit englischsprachigen Fahrer:innen. Empfehlenswert bei später Ankunft, Gruppen ab vier Personen oder viel Gepäck.',
      },
      blocks: [
        {
          type: 'h3',
          text: {
            ko: '베뉴비안 권역(영등포구) 정액 요금',
            en: 'Flat fare to Yeongdeungpo (the Venuevian area)',
            de: 'Festpreis nach Yeongdeungpo (Bezirk des Venuevian)',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '중형 (4인까지): ₩55,000',
              en: 'Standard (up to 4 passengers): ₩55,000',
              de: 'Standard (bis 4 Personen): 55.000 ₩',
            },
            {
              ko: '대형/럭셔리 (짐 많거나 5인 이상): ₩80,000',
              en: 'Large / luxury (lots of luggage, 5+ passengers): ₩80,000',
              de: 'Großraum / Luxus (viel Gepäck, ab 5 Personen): 80.000 ₩',
            },
            {
              ko: '통행료, 야간할증, 인천 시외 추가요금이 모두 포함되어 추가 청구 없음.',
              en: 'All tolls, late-night surcharge, and out-of-Incheon fees are already included — no surprises.',
              de: 'Mautgebühren, Nachtzuschlag und Außerorts-Aufschlag sind enthalten — keine Überraschungen.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '부스 위치',
            en: 'Where to find the booth',
            de: 'Wo ist der Schalter?',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'T1: 1층 도착층 4번 게이트 근처 부스. 차량 승차는 4C 라인. "International Taxi" 영문 표지판을 따라가세요.',
              en: 'Terminal 1: Arrivals floor (1F), booth near Gate 4 — pickup at lane 4C. Follow the "International Taxi" signs.',
              de: 'Terminal 1: Ankunftsebene (1. OG), Schalter nahe Tor 4 — Abfahrt an Spur 4C. Den Schildern „International Taxi" folgen.',
            },
            {
              ko: 'T2: 1층 도착층, 부스 표지판을 따라가시면 차량 승차는 3C 라인.',
              en: 'Terminal 2: Arrivals floor (1F); follow booth signage — pickup at lane 3C.',
              de: 'Terminal 2: Ankunftsebene (1. OG); der Beschilderung folgen — Abfahrt an Spur 3C.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '도착 후 이용 절차',
            en: 'Step by step after you land',
            de: 'Ablauf nach der Landung',
          },
        },
        {
          type: 'ol',
          items: [
            {
              ko: '입국 후 부스에서 직원에게 목적지를 영어로 말씀하세요. 예) "Venuevian, near Sinpung Station, Yeongdeungpo".',
              en: 'After clearing customs, tell the booth staff your destination in English — e.g. "Venuevian, near Sinpung Station, Yeongdeungpo".',
              de: 'Nach der Einreise dem Schalterpersonal das Ziel auf Englisch nennen — z. B. „Venuevian, near Sinpung Station, Yeongdeungpo".',
            },
            {
              ko: '정액 요금을 확인하고 안내해 주는 차량으로 이동.',
              en: 'They will confirm the flat fare and walk you to the assigned taxi.',
              de: 'Der Festpreis wird bestätigt und du wirst zum zugewiesenen Taxi gebracht.',
            },
            {
              ko: '도착 후 운전기사에게 직접 결제 — 현금 또는 카드(해외카드 가능).',
              en: 'Pay the driver at the destination — cash or card (foreign cards accepted).',
              de: 'Bezahlung beim Fahrer am Ziel — bar oder mit Karte (auch ausländische).',
            },
            {
              ko: '영수증이 필요하면 "영수증 주세요 (yeongsujeung juseyo)"라고 부탁하세요.',
              en: 'Need a receipt? Ask for "yeongsujeung" — that is the Korean word.',
              de: 'Quittung gewünscht? Sage einfach „yeongsujeung" — das koreanische Wort dafür.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '사전 예약 (권장)',
            en: 'Online booking (recommended)',
            de: 'Online-Buchung (empfohlen)',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'intltaxi.co.kr 또는 "International Taxi" 모바일 앱 (영문 지원)',
              en: 'Use intltaxi.co.kr or the "International Taxi" mobile app (English UI).',
              de: 'Über intltaxi.co.kr oder die App „International Taxi" (englische Oberfläche).',
            },
            {
              ko: '항공편 번호 입력하면 기사가 도착 시간에 맞춰 입국장에서 영문 이름표를 들고 마중',
              en: 'Enter your flight number — the driver will track your arrival and wait at the international arrivals exit holding a sign with your name.',
              de: 'Mit Eingabe der Flugnummer wartet der Fahrer am internationalen Ausgang mit einem Schild mit deinem Namen.',
            },
            {
              ko: '예약하면 부스에 줄 설 필요 없이 바로 차량으로 이동',
              en: 'A booking saves the queue at the booth and you walk straight to your car.',
              de: 'Mit Vorbuchung entfällt das Anstehen am Schalter — du gehst direkt zum Wagen.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '귀국길 예약',
            en: 'Booking your ride back to ICN',
            de: 'Rückfahrt zum Flughafen buchen',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '호텔 컨시어지에 부탁하시거나, 같은 앱·웹에서 직접 예약 가능',
              en: 'Ask the hotel concierge to call for you, or book the return trip on the same app/web.',
              de: 'Den Concierge des Hotels bitten oder die Rückfahrt selbst über die App/Website buchen.',
            },
            {
              ko: '최소 1일 전 예약 권장',
              en: 'Book at least one day ahead for peace of mind.',
              de: 'Mindestens einen Tag im Voraus reservieren.',
            },
          ],
        },
      ],
    },
    {
      id: 'arex-subway',
      heading: {
        ko: '③ 공항철도(AREX)와 지하철',
        en: '③ AREX airport train + Seoul subway',
        de: '③ Flughafenbahn AREX + Seouler U-Bahn',
      },
      lead: {
        ko: '가장 저렴하지만 환승이 세 번 필요합니다. 캐리어가 작고 한국에 익숙하신 분께 추천합니다.',
        en: 'The cheapest option, but with three transfers. Best if your luggage is light and you do not mind navigating signs.',
        de: 'Die günstigste Variante, aber mit drei Umstiegen. Empfehlenswert mit wenig Gepäck und etwas Reiseroutine.',
      },
      blocks: [
        {
          type: 'h3',
          text: {
            ko: '1단계: T-money 교통카드 구입',
            en: 'Step 1: Buy a T-money card',
            de: 'Schritt 1: T-money-Karte kaufen',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '인천공항 편의점(GS25, CU, 7-Eleven) 또는 자판기에서 구입',
              en: 'Buy at any airport convenience store (GS25, CU, 7-Eleven) or vending machine.',
              de: 'In jedem Flughafen-Kiosk (GS25, CU, 7-Eleven) oder am Automaten erhältlich.',
            },
            {
              ko: '카드 가격: 일반 T-money ₩2,500 / 인천공항에서 파는 "Korea Tour Card"는 ₩4,000 (카드 자체 비용, 환불 불가). 잔액 환불 시 ₩500 수수료.',
              en: 'Card costs ₩2,500 for the standard T-money or ₩4,000 for the airport-sold "Korea Tour Card" (non-refundable card cost). ₩500 fee on balance refund.',
              de: 'Kartenkosten: 2.500 ₩ für die normale T-money oder 4.000 ₩ für die am Flughafen erhältliche „Korea Tour Card" (nicht erstattungsfähig). 500 ₩ Gebühr bei Restguthaben-Rückerstattung.',
            },
            {
              ko: '처음 ₩10,000 정도 충전 권장 — 모든 지하철·버스에서 사용',
              en: 'Top up around ₩10,000 to start — usable on every subway and bus in Korea.',
              de: 'Beim Kauf rund 10.000 ₩ aufladen — nutzbar in U-Bahn und Bus in ganz Korea.',
            },
            {
              ko: '미사용 잔액은 지하철역 안내데스크에서 환불 가능',
              en: 'Unused balance is refundable at any subway info desk.',
              de: 'Restguthaben kann an jedem U-Bahn-Infoschalter erstattet werden.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '2단계: AREX 일반열차 → 서울역',
            en: 'Step 2: AREX (all-stop train) → Seoul Station',
            de: 'Schritt 2: AREX (Bummelzug) → Seoul Station',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'T1·T2 모두 지하 1층(B1)에서 AREX 탑승. 파란색 "AREX" 로고를 따라가세요.',
              en: 'Both T1 and T2 have AREX platforms on basement B1. Follow the blue "AREX" logo.',
              de: 'Sowohl T1 als auch T2 haben den AREX-Bahnsteig in B1. Dem blauen AREX-Logo folgen.',
            },
            {
              ko: '"일반열차 (All-stop)" 탑승: ₩4,750, 약 53~66분, 5~8분 간격',
              en: 'Take the "All-stop" train: ₩4,750, 53–66 min, departures every 5–8 min.',
              de: 'Den „All-stop"-Zug nehmen: 4.750 ₩, 53–66 Min., Takt alle 5–8 Min.',
            },
            {
              ko: '직통열차(₩9,500, T1 약 43분 / T2 약 51분)도 있지만 가격 차이가 커서 일반열차가 더 가성비 좋음',
              en: 'There is also an Express train (₩9,500, ~43 min from T1 / ~51 min from T2) but the all-stop train is the better value.',
              de: 'Es gibt auch einen Expresszug (9.500 ₩, ca. 43 Min. ab T1 / ca. 51 Min. ab T2), aber der Bummelzug bietet das bessere Preis-Leistungs-Verhältnis.',
            },
            {
              ko: '서울역에서 하차',
              en: 'Get off at Seoul Station (서울역, the last stop).',
              de: 'An der Seoul Station (서울역, Endhaltestelle) aussteigen.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '3단계: 1호선 → 신도림 (7정거장)',
            en: 'Step 3: Line 1 → Sindorim (7 stops)',
            de: 'Schritt 3: Linie 1 → Sindorim (7 Stationen)',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: 'AREX 게이트에서 T-money를 터치하고 나간 뒤, "지하철 1호선 / Line 1" 파란색 표지판을 따라 이동',
              en: 'Tap out at the AREX gate, then follow the blue "Line 1" signs.',
              de: 'Am AREX-Ausgang die T-money-Karte abscannen, dann den blauen Schildern „Line 1" folgen.',
            },
            {
              ko: '1호선 게이트에 다시 카드를 터치하고 입장',
              en: 'Tap in again at the Line 1 gate.',
              de: 'Am Eingang zur Linie 1 die Karte erneut abscannen.',
            },
            {
              ko: '남부 방향(천안·신창·인천 방면) 승강장으로 이동',
              en: 'Take the southbound platform (toward Cheonan, Sinchang, or Incheon).',
              de: 'Auf den Bahnsteig Richtung Süden (nach Cheonan, Sinchang oder Incheon).',
            },
            {
              ko: '7정거장 후 "신도림 / Sindorim" 하차 (남영 → 용산 → 노량진 → 대방 → 신길 → 영등포 → 신도림)',
              en: 'Ride 7 stops to "신도림 / Sindorim" (Namyeong → Yongsan → Noryangjin → Daebang → Singil → Yeongdeungpo → Sindorim).',
              de: 'Nach 7 Stationen an „신도림 / Sindorim" aussteigen (Namyeong → Yongsan → Noryangjin → Daebang → Singil → Yeongdeungpo → Sindorim).',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '4단계: 2호선 → 대림 (1정거장)',
            en: 'Step 4: Line 2 → Daerim (1 stop)',
            de: 'Schritt 4: Linie 2 → Daerim (1 Station)',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '신도림역 안에서 "지하철 2호선 / Line 2" 초록색 표지판을 따라 이동',
              en: 'Inside Sindorim, follow the green "Line 2" signs.',
              de: 'In Sindorim den grünen Schildern „Line 2" folgen.',
            },
            {
              ko: '내선(성수 / Seongsu 방면) 승강장에서 1정거장 → "대림 / Daerim"',
              en: 'Take the inner-loop platform (toward Seongsu) and ride 1 stop to "대림 / Daerim".',
              de: 'Bahnsteig in Richtung Seongsu (Innenring), eine Station bis „대림 / Daerim".',
            },
            {
              ko: '신도림과 대림은 같은 7호선이 아니라는 점 주의',
              en: 'Sindorim and Daerim are connected by Line 2, not Line 7.',
              de: 'Sindorim und Daerim verbindet die Linie 2, nicht die Linie 7.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '5단계: 7호선 → 신풍 (1정거장)',
            en: 'Step 5: Line 7 → Sinpung (1 stop)',
            de: 'Schritt 5: Linie 7 → Sinpung (1 Station)',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '대림역 안에서 "7호선 / Line 7" 진녹색(올리브) 표지판을 따라 이동',
              en: 'Inside Daerim, follow the dark-olive "Line 7" signs.',
              de: 'In Daerim den dunkelgrün-oliv farbenen Schildern „Line 7" folgen.',
            },
            {
              ko: '장암 (Jangam) 방향 승강장에서 1정거장 → "신풍 / Sinpung"',
              en: 'Board toward Jangam and ride 1 stop to "신풍 / Sinpung".',
              de: 'Richtung Jangam einsteigen und eine Station bis „신풍 / Sinpung".',
            },
            {
              ko: '7호선의 색은 진한 녹색/올리브색 — 2호선의 밝은 초록과 헷갈리지 마세요',
              en: 'Line 7 is dark olive — distinguish it from the brighter green of Line 2.',
              de: 'Die Linie 7 ist dunkelgrün/olivfarben — nicht mit dem helleren Grün der Linie 2 verwechseln.',
            },
          ],
        },
        {
          type: 'h3',
          text: {
            ko: '6단계: 신풍역에서 베뉴비안까지',
            en: 'Step 6: From Sinpung Station to Venuevian',
            de: 'Schritt 6: Von der Sinpung-Station zum Venuevian',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '신풍역 1번 출구로 나가기 (출구 번호는 Naver Map에서 미리 확인 권장)',
              en: 'Take Exit 1 (you can verify the exact exit on Naver Map ahead of time).',
              de: 'Ausgang 1 nehmen (genauen Ausgang vorher in Naver Map prüfen).',
            },
            {
              ko: 'Naver Map에서 "베뉴비안" 또는 "Venuevian" 검색 → 도보 약 5분',
              en: 'Search "Venuevian" in Naver Map — about a 5-minute walk.',
              de: '„Venuevian" in Naver Map eingeben — ca. 5 Minuten zu Fuß.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'tip',
          text: {
            ko: '요금 합계: 카드 ₩2,500~₩4,000 + 운임 약 ₩6,500 = 약 ₩9,000~₩10,500. 전체 소요 시간 약 80~95분.',
            en: 'Total cost: ₩2,500–₩4,000 card + ~₩6,500 fares = about ₩9,000–₩10,500. Door-to-door time roughly 80–95 minutes.',
            de: 'Gesamtkosten: 2.500–4.000 ₩ Karte + ca. 6.500 ₩ Tarife = rund 9.000–10.500 ₩. Reisezeit etwa 80–95 Min.',
          },
        },
      ],
    },
    {
      id: 'apps-payment',
      heading: {
        ko: '④ 한국에서 유용한 앱과 결제 팁',
        en: '④ Apps and payment tips for Korea',
        de: '④ Nützliche Apps und Zahlungs-Tipps für Korea',
      },
      lead: {
        ko: '인천공항에 도착하시기 전에 미리 다운로드해 두시면 한국 일정이 훨씬 편안해집니다.',
        en: 'Download these before you board your flight — they make every part of the trip easier.',
        de: 'Diese Apps am besten schon vor dem Flug installieren — sie erleichtern den gesamten Aufenthalt.',
      },
      blocks: [
        {
          type: 'h3',
          text: {
            ko: '추천 앱',
            en: 'Recommended apps',
            de: 'Empfohlene Apps',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '네이버 지도 (Naver Map): 한국 1위 지도 앱. 영문 UI 지원. 지하철·버스·도보 경로가 가장 정확합니다.',
              en: 'Naver Map (네이버 지도): the dominant Korean maps app, with English UI. The most reliable for subway, bus, and walking directions.',
              de: 'Naver Map (네이버 지도): die führende koreanische Karten-App, englische Oberfläche. Am verlässlichsten für U-Bahn, Bus und Fußwege.',
            },
            {
              ko: '카카오맵 (KakaoMap): 대안 지도. 영문 UI 지원. 식당·카페 정보가 풍부합니다.',
              en: 'KakaoMap (카카오맵): an alternative maps app with English UI — better for restaurant and cafe info.',
              de: 'KakaoMap (카카오맵): alternative Karten-App mit englischer Oberfläche — besonders gut für Restaurants und Cafés.',
            },
            {
              ko: 'Kakao T: 택시 호출 앱, 영문 UI 지원. 자동 결제는 한국 휴대폰 번호 등록이 필요해서, 외국 손님은 차량에서 카드/현금 직접 결제가 더 간단합니다. 외국인 전용 "k.ride" 앱은 한국 번호 없이도 해외카드 등록 가능.',
              en: 'Kakao T: the local Uber equivalent, English UI available. Auto-pay requires a Korean phone number, so foreign guests usually choose "pay the driver" and pay in cash or card on arrival. Alternative: "k.ride" — a foreigner-focused app that accepts overseas cards without a Korean phone number.',
              de: 'Kakao T: das lokale Uber-Pendant, englische Oberfläche. Auto-Zahlung erfordert eine koreanische Mobilnummer; Gäste aus dem Ausland wählen daher meist „Bei Fahrer zahlen" und begleichen bar oder mit Karte beim Aussteigen. Alternativ: „k.ride" — eine App speziell für Ausländer, die Auslandskarten ohne koreanische Nummer akzeptiert.',
            },
            {
              ko: 'Papago (파파고): 한국어 ↔ 영어/독일어 번역. 음성·이미지 번역도 가능합니다.',
              en: 'Papago (파파고): Korean ↔ English/German translation, including voice and image input.',
              de: 'Papago (파파고): Übersetzung Koreanisch ↔ Englisch/Deutsch, auch per Stimme und Bild.',
            },
          ],
        },
        {
          type: 'callout',
          tone: 'warn',
          text: {
            ko: 'Google Maps는 한국에서 지하철·도보 길찾기가 거의 작동하지 않습니다(국내 지도 데이터 반출 제한). 반드시 Naver나 KakaoMap을 사용하세요.',
            en: 'Google Maps does not give working subway or walking directions in Korea (legal export restrictions on map data). Use Naver Map or KakaoMap instead.',
            de: 'Google Maps liefert in Korea keine zuverlässigen U-Bahn- oder Fußwegrouten (Exportbeschränkungen für Kartendaten). Bitte Naver Map oder KakaoMap verwenden.',
          },
        },
        {
          type: 'h3',
          text: {
            ko: '결제 수단',
            en: 'Paying for things',
            de: 'Bezahlen vor Ort',
          },
        },
        {
          type: 'ul',
          items: [
            {
              ko: '대부분의 식당·상점·카페에서 해외 신용카드(Visa·Mastercard) 사용 가능',
              en: 'Most restaurants, shops, and cafes accept foreign credit cards (Visa, Mastercard).',
              de: 'In den meisten Restaurants, Geschäften und Cafés werden ausländische Kreditkarten (Visa, Mastercard) akzeptiert.',
            },
            {
              ko: '소액·전통시장·일부 분식점은 현금이 필요하니, 약간의 원화를 환전해 두세요',
              en: 'Carry a little cash for small purchases, traditional markets, and some street-food spots.',
              de: 'Etwas Bargeld einplanen für kleine Beträge, traditionelle Märkte und Imbissstände.',
            },
            {
              ko: 'ATM은 공항·편의점에 다수. 해외카드는 "Global ATM" 또는 "외환" 표시 확인',
              en: 'ATMs at the airport and convenience stores. Look for "Global ATM" or "외환" — these accept foreign cards.',
              de: 'Geldautomaten am Flughafen und in Convenience-Stores. Auf „Global ATM" oder „외환" achten — diese akzeptieren ausländische Karten.',
            },
            {
              ko: '환전은 공항도 괜찮지만, 명동·인사동 사설 환전소가 환율이 더 좋은 편',
              en: 'You can exchange cash at the airport, but private exchanges in Myeongdong or Insadong usually offer better rates.',
              de: 'Wechseln am Flughafen ist möglich, aber private Wechselstuben in Myeongdong oder Insadong bieten meist bessere Kurse.',
            },
          ],
        },
      ],
    },
  ],
  phrasesIntro: {
    ko: '외국 손님께 한 번 보여 드리거나 캡처해 보내 드리면 좋은 짧은 표현들입니다. 발음은 한국어 음을 영문자로 옮긴 것이라 완벽하지 않지만, 통하기에는 충분합니다.',
    en: "A few short Korean phrases that go a long way. The pronunciation column is approximate — Korean speakers will understand even if it's not perfect.",
    de: 'Ein paar kurze koreanische Sätze, die viel helfen. Die Aussprache-Spalte ist eine Annäherung — Korean:innen verstehen es trotzdem.',
  },
  phrases: [
    { ko: '안녕하세요', rom: 'annyeonghaseyo', en: 'Hello', de: 'Hallo' },
    { ko: '감사합니다', rom: 'gamsahamnida', en: 'Thank you', de: 'Danke' },
    { ko: '여기요 / 저기요', rom: 'yeogiyo / jeogiyo', en: 'Excuse me (to get attention)', de: 'Entschuldigung (um Aufmerksamkeit zu bekommen)' },
    { ko: '신풍역 가요?', rom: 'sinpung-yeok gayo?', en: 'Does this go to Sinpung Station?', de: 'Fährt das zur Sinpung-Station?' },
    { ko: '영어 할 줄 아세요?', rom: 'yeong-eo hal jul aseyo?', en: 'Do you speak English?', de: 'Sprechen Sie Englisch?' },
    { ko: '화장실 어디예요?', rom: 'hwajangsil eodi-yeyo?', en: 'Where is the restroom?', de: 'Wo ist die Toilette?' },
    { ko: '도와주세요', rom: 'dowajuseyo', en: 'Please help me', de: 'Bitte helfen Sie mir' },
    { ko: '얼마예요?', rom: 'eolma-yeyo?', en: 'How much is it?', de: 'Wie viel kostet das?' },
    { ko: '괜찮아요', rom: 'gwaenchanayo', en: "It's OK / No problem", de: 'Alles in Ordnung / Kein Problem' },
    { ko: '영수증 주세요', rom: 'yeongsujeung juseyo', en: 'A receipt, please', de: 'Eine Quittung, bitte' },
  ],
  emergencyHeading: {
    ko: '비상 연락처',
    en: 'Emergency numbers',
    de: 'Wichtige Nummern',
  },
  emergencyItems: [
    {
      ko: '119 — 화재·구급 (소방·응급의료)',
      en: '119 — Fire and ambulance',
      de: '119 — Feuerwehr und Krankenwagen',
    },
    {
      ko: '112 — 경찰',
      en: '112 — Police',
      de: '112 — Polizei',
    },
    {
      ko: '1330 — 한국관광공사 24시간 통역 안내 (한국어·영어·중국어·일본어 등 다국어 지원, 무료)',
      en: '1330 — Korea Travel Hotline. 24/7 multilingual support (Korean, English, Chinese, Japanese, and more) — free.',
      de: '1330 — Korea Travel Hotline. Rund um die Uhr mehrsprachig (Koreanisch, Englisch, Chinesisch, Japanisch u. a.) — kostenlos.',
    },
    {
      ko: '1345 — 외국인종합안내센터 (출입국·체류 관련 문의, 평일 09:00~22:00, 무료)',
      en: '1345 — Immigration Contact Center (immigration and visa questions; weekdays 09:00–22:00; free).',
      de: '1345 — Einwanderungs-Kontaktzentrum (Einreise- und Visumsfragen; werktags 09:00–22:00 Uhr; kostenlos).',
    },
  ],
  miscHeading: {
    ko: '그 밖에 알아두시면 좋은 것들',
    en: 'A few more things worth knowing',
    de: 'Weitere nützliche Hinweise',
  },
  miscItems: [
    {
      ko: '전압: 220V, 60Hz. 독일·유럽 플러그(Type C/F) 그대로 사용 가능. 미국에서 오시는 분은 변환 어댑터 필요.',
      en: 'Power: 220 V, 60 Hz. The plug shape (Type C/F) is the same as in Germany — Europeans can plug straight in. Travelers from the US need a plug adapter.',
      de: 'Strom: 220 V, 60 Hz. Steckdosentyp (Typ C/F) wie in Deutschland — passt direkt. Aus den USA Anreisende brauchen einen Adapter.',
    },
    {
      ko: '시차: 서울은 독일보다 8시간 빠름 (독일 서머타임 적용 시 7시간)',
      en: 'Time difference: Seoul is 8 hours ahead of Germany (7 hours during German daylight-saving time).',
      de: 'Zeitunterschied: Seoul liegt 8 Stunden vor Deutschland (während der Sommerzeit: 7 Stunden).',
    },
    {
      ko: '무료 Wi-Fi: 인천공항·지하철·대부분의 카페·식당에서 무료. 호텔에는 거의 100% 제공',
      en: 'Free Wi-Fi: at Incheon Airport, on the subway, in most cafes and restaurants, and in every hotel.',
      de: 'Kostenloses WLAN: am Flughafen Incheon, in U-Bahn, Cafés, Restaurants und Hotels nahezu überall.',
    },
    {
      ko: '편의점: GS25·CU·7-Eleven이 24시간 운영. 식음료, ATM, 교통카드 충전 등 만능 거점',
      en: 'Convenience stores (GS25, CU, 7-Eleven) are open 24/7 — food, drinks, ATM, transit-card top-ups, all in one place.',
      de: 'Convenience-Stores (GS25, CU, 7-Eleven) haben rund um die Uhr geöffnet — Snacks, Getränke, Geldautomaten, Karten-Aufladen — alles an einem Ort.',
    },
  ],
  outroBack: {
    ko: '청첩장으로 돌아가기 →',
    en: 'Back to the invitation →',
    de: 'Zurück zur Einladung →',
  },
};

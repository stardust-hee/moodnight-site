# 무드나잇 (moodnight.co.kr)

친구들이 링크로 함께 참여하는 시즌 웹 놀이 브랜드. 운영자 김이나 · moodnight@kakao.com
수익 모델: 유료 기능 없이 광고만 (카카오 애드핏, 구글 애드센스, 쿠팡 파트너스).

## 사이트 구조

| 경로 | 내용 |
|---|---|
| `/` `index.html` | 무드나잇 소개 (서비스 카드, 이용 방법, 안전 운영, FAQ, 읽을거리, 문의) |
| `/santa/` `santa/index.html` + `santa/app.js` | 산타의 비밀 택배 실제 서비스 (방 주인 화면) |
| `/santa/r/<방코드>` | 친구가 받는 선물방 링크. `vercel.json` rewrite로 `santa/index.html`을 그대로 씀 |
| `/santa/demo/` | 산타 체험판 (예시 데이터, 저장 안 됨) |
| `/blog/` | 읽을거리 (애드센스 심사용 글). 현재 2개: manitto, christmas-card |
| `/privacy.html` `/terms.html` | 개인정보처리방침, 이용약관 (산타 + 눈망진창 공통) |
| `/auth-test.html` | 로그인 테스트용 (검색 차단) |
| `og.png` `santa/og.png` | 공유 미리보기 이미지 1200×630 |
| `icon-512.png` `apple-touch-icon.png` | 앱 아이콘 |

- 호스팅: Vercel 프로젝트 `moodnight-site` (GitHub `stardust-hee/moodnight-site` main 브랜치 push 시 자동 배포)
- 도메인: 가비아 `moodnight.co.kr` (만료 2027-12-19). 기본 주소는 `www.moodnight.co.kr`, 루트는 www로 308 리다이렉트
- DNS(가비아): A `@` 216.198.79.1, CNAME `www` → Vercel 값. 네임서버 가비아
- 서치 콘솔(구글, URL 접두어 www), 네이버 서치어드바이저: 확인 태그는 `index.html` head에 있음. sitemap 제출 완료

## 디자인

- 무드나잇 홈/블로그: 겨울밤 다크 단일 테마 (`style.css` 토큰: night #151A2E, cream #F6EEDD, lamp #F2C46B, berry #E0574A, pine #5FB487)
- 산타: 따뜻한 3D 디오라마 느낌 (크림 벽, 초록 문, 빨간 커튼, 트리, 선물 상자). 폰트 Jua(제목) + Gowun Dodum(본문)
- 눈망진창 기획 메모: 친구들이 눈사람 얼굴·모자·옷·소품을 하나씩 붙여 망치는 구조. 처음 구상은 레트로 픽셀 + 귀여운 일러스트

### 눈망진창 디자인 방향 (2026-11-06 논의)
- 산타와 같은 **따뜻한 3D 디오라마 감성**으로 가는 방향을 검토 중
- 세계관: 산타 방의 창문 밖 눈 덮인 마당이 눈망진창의 무대 (방 안은 산타, 마당은 눈망진창)
- 제안: **무대는 디오라마, 웃음은 소품으로.** 마당·눈·울타리·가로등은 예쁘게, 눈사람에 붙는 소품은 일부러 엉뚱하게 (선글라스, 고무장갑 모자, 대파 팔, 삐뚤어진 당근 코, 쓰레기 봉투 망토 등). 예쁜 무대와 엉망인 눈사람의 대비가 웃음·공유 포인트
- 걱정: 디오라마만으로는 너무 단정해서 "망치는" 병맛이 약해질 수 있음
- **다음 할 일: 새 대화에서 체험판부터 만들기. 픽셀 버전과 디오라마 버전을 한 화면씩 만들어 나란히 비교한 뒤 방향 결정**

## 백엔드 (Supabase)

- 프로젝트 `moodnight` (id `gbmlkyfguktjtroczqfw`, 서울 ap-northeast-2, 무료)
- URL `https://gbmlkyfguktjtroczqfw.supabase.co`, publishable 키는 `santa/app.js` 상단 (공개용 키)
- 로그인: 카카오(REST API 키 + Client Secret, 이메일 없이 허용 ON), 구글(프로덕션 게시 완료). 로그인은 방 만드는 사람만, 친구는 로그인 없이 참여
- Auth Redirect URLs: www/루트/santa 서브도메인/vercel.app 각각 `/**`
- 카카오 디벨로퍼스 앱 "무드나잇": JS 키 `929f085734659fd851830cba5592775d` (공유 버튼), 제품 링크 관리 웹 도메인 등록 완료, 비즈 앱 전환 완료

### 테이블 (모두 RLS 켜짐)
- `rooms` 방 주인당 1개. `slug`가 링크 코드. `unlock_override`는 테스트용으로만 SQL에서 설정
- `gifts` 포장지, 선물, 메시지, 단서 3개, 보낸 사람 이름, 가짜 후보(decoys, 선택), 추리 기록, 숨김
- `reports` 신고 (신고되면 선물 자동 숨김)

### 함수 (화면은 이 함수로만 읽고 씀)
- `get_room(slug)` 누구나: 방 이름, 개봉 시각, 상자 겉모습
- `send_gift(...)` 누구나, 개봉 전까지만, 방당 300개
- `open_gift(id)` / `guess_sender(id, name)` 방 주인, 개봉 후만. 단서는 틀릴 때마다 1개씩, 3번 틀리면 정답 공개
- 보기(후보): 이 방에 선물 보낸 **다른 친구 이름 우선**, 모자라면 가짜 후보로 채움. 보기가 정답 하나뿐이면 직접 입력(성 붙이고 뺀 차이는 정답 인정)
- `hide_gift`, `report_gift` 방 주인
- 개봉 시각: `unlock_at()` = 2026-12-25 00:00 KST

## 남은 할 일

- [ ] 출시 전: 테스트방(`251d5a02d3`) `unlock_override`를 null로 되돌리기, 테스트 계정·선물 삭제
- [ ] 카카오 애드핏 신청 → 승인 후 `santa/app.js` renderSent의 `ad-slot` 자리에 광고 코드
- [ ] 애드센스: 읽을거리 6개 이상 올린 뒤 신청 (11/16 이후 예정)
- [ ] 읽을거리: 2~3일 간격 게시. 일정과 경험 질문은 `무드나잇_읽을거리_글계획.xlsx`. 이나님 경험 답변을 받아 글에 녹여 쓰기 (AI 티 나는 일반론 금지)
- [ ] 결과 공유 카드 (맞힌 결과를 이미지로 저장/공유 + "나도 만들기")
- [ ] santa.moodnight.co.kr 서브도메인을 쓸지 결정 (현재는 /santa/ 경로 사용)
- [ ] 눈망진창 개발: `/snow/`, 같은 Supabase 프로젝트와 로그인 재사용, 눈사람 테이블 추가

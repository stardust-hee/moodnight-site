# 무드나잇 보안 점검 및 적용 기록

- 점검 기준: Git commit 8bc2144, Supabase moodnight (gbmlkyfguktjtroczqfw).
- DB migration security_harden_permissions_and_write_limits 적용 성공. 이 PR은 이미 적용한 DB 변경의 소스/인수인계 기록이며, 웹 화면 변경은 없음.
- 고객의 편지, 이름, 이메일 내용은 점검 대상으로 조회하지 않음. 역할 검사 트랜잭션은 ROLLBACK.
- 전체 침투 테스트, DDoS 방어 검증, 브라우저 로그인 E2E 완료를 의미하지 않음.

## 실제 적용
1. camp_items_ok: null 소품 ID가 통과하는 문제를 재현 후 수정. 잘못된 kind도 거부.
2. send_gift/post_note: 방 행 잠금으로 동일 방의 동시 작성 시 300개 등 기존 한도 검사와 삽입을 직렬화.
3. sansa_add/camp_note_add: 트랜잭션 advisory lock으로 기존 전체 분당/일별 한도 검사와 삽입을 직렬화. 잠금은 해당 쓰기 함수별로 구분하며 트랜잭션 종료 시 해제.
4. anon/authenticated의 public 테이블 TRUNCATE/REFERENCES/TRIGGER 권한 제거. 이 권한이 HTTP로 직접 악용 가능하다는 뜻은 아니며 최소 권한 보강.
5. 직접 읽거나 쓰지 않고 권한 확인 RPC로만 접근하는 gifts/reports 및 캠핑장 5개 테이블의 anon/authenticated 직접 권한 제거.
6. 로그인 필수 캠핑장 쓰기 RPC 7개에서 anon/PUBLIC 실행 권한 제거. authenticated 권한과 내부 소유자/관리자 검사는 유지.
7. 삭제 RPC 2개의 search_path를 빈 값으로 고정.

## 검증
- 적용 전 트랜잭션 내 리허설 후 ROLLBACK, 실제 적용 후 12개 검사 모두 true.
- null/unknown 소품, 범위 밖 좌표, 잘못된 kind 거부; 정상 실내/실외 소품 허용.
- 비로그인 저장 불가, 로그인 저장 함수 권한 유지, 공개 camp_get 권한 유지.
- gifts 직접 SELECT 불가, 방 이름 수정 권한 유지, unlock_override 수정 불가.
- 관리자 목록에 없는 합성 JWT subject + authenticated 역할: is_admin=false, admin_members에서 forbidden, rooms/mansions 직접 SELECT 결과 없음.
- 실제 동시 세션 부하 테스트 및 실제 두 회원의 브라우저 E2E는 미실시. 잠금 구문 적용과 함수 정의를 검증.
- public 테이블 19개 RLS 활성. 관리자 RPC는 DB admins 테이블 기반 서버 권한 검사.
- 산타 열기/맞히기는 소유자 및 개봉 시간 검사. 방 INSERT/UPDATE는 컬럼 권한으로 owner_id/display_name 입력과 display_name 수정만 허용.
- 제한된 패턴 검색에서 service_role/secret/private-key 문자열 없음. 전체 Git 이력 및 모든 비밀키 형식 검사는 미실시.
- Advisor: anon SECURITY DEFINER 경고 22 → 15. 남은 공개 RPC 경고는 함수별 판단 필요. RLS enabled/no policy 17개는 기본 거부 + RPC 구조에서 발생하며 임의 허용 정책을 추가하지 않음.
- 유출 비밀번호 보호 비활성 경고 유지. 현재 화면은 소셜 로그인; 비밀번호 로그인 가능 여부/Auth 설정 추가 확인 필요.

## 남은 우선 작업
### P1 익명 스팸 및 신고 조작
- sansa_report: 클라이언트가 만든 기기 문자열 2개로 자동 숨김 조건을 채울 수 있음. 기기 ID는 신원 증명이 아님.
- sansa_add/post_note/move_in: 기기 변경 또는 null로 기기별 제한을 우회할 수 있음. 이번 동시성 수정은 신원 위조 방어가 아님.
- log_event: 일부 방문 중복 제거만 있으며 모든 이벤트에 대한 강제 유입 제한은 없음.
- sansa_bonnoe_add: 공개 카운터 반복 호출 가능.
- 해결은 서버에서 검증하는 CAPTCHA/익명 인증 또는 신뢰 가능한 게이트웨이 제한을 설계하고, 직접 RPC 우회까지 차단해야 함. Vercel만 제한하면 Supabase 직접 호출은 남음. 이를 적용하려면 브라우저 참여 흐름/인증 구조 변경과 검증 필요.

### P1 운영 설정 및 회귀 테스트
- Vercel 방화벽/트래픽 제한/비용 알림, Supabase Auth 허용 리디렉션과 인증 설정: 미확인.
- 실제 소유자/다른 회원 두 계정으로 선물, 맨션 비공개 편지, 캠핑장 수정 회귀 테스트 필요.
- 공개 입력을 화면 HTML에 넣는 경로 전수 XSS/공급망 검사는 미완료.

## 다음 담당자가 확인할 질문
1. 익명 참여를 유지하면서 CAPTCHA 또는 익명 인증을 도입할 것인가?
2. 익명 신고 2건 자동 숨김을 유지할 것인가, 관리자 검토로 바꿀 것인가?
3. 봇/트래픽 보호와 비용 알림의 허용 기준은 무엇인가?

## 근거
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADVISORY-LOCKS
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable

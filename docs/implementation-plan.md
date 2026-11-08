# School Log 구현 계획

## 제품 범위

School Log는 학교가 공개를 승인한 일정과 공지사항을 로그인 없이 조회·검색하고, 인증된 관리자만 웹에서 등록·수정·삭제하는 반응형 공개 정보 아카이브다. 첫 버전에는 학생·교사 계정, 반별 비공개 정보, 알림, 댓글, 개인화를 넣지 않는다. GitHub Pages 정적 프론트엔드와 Supabase의 데이터베이스·인증·RLS를 사용한다.

## 구현 방식

- 프론트엔드는 기존 React + TypeScript + Vite 구조를 사용하고 GitHub Pages에 정적 산출물로 배포한다. GitHub Pages는 서버를 실행하지 않으므로 공개 운영 경로는 `/api/trpc`나 Manus 전용 서버 세션에 의존하지 않는다.
- 기존 Express + tRPC 코드는 Manus Preview와 서버형 실행을 위한 보조 구조로 남기되, GitHub Pages 배포 경로는 `client/src/lib/supabase.ts`의 공개 조회·CRUD 함수를 사용한다. 공개 조회는 Supabase의 공개 SELECT 정책으로, 생성·수정·삭제는 Supabase Auth 사용자와 `profiles.role = 'admin'` RLS 정책으로 보호한다.
- `school_items` 테이블에 일정과 공지를 통합 저장한다. `category`, `startDate`, `endDate`, `title`, `description`을 검증하며 종료일은 선택 값이다.
- 날짜 필터는 시작일과 종료일을 포함한 기간에 적용한다. 종료일이 없으면 시작일 하루 자료로 계산한다.
- Supabase의 `school_items` 테이블에 일정과 공지를 영구 저장한다. GitHub Pages 재배포가 데이터를 초기화하지 않으며, 지난 자료는 시간 경과만으로 삭제하지 않는다.
- 관리자 인증은 Supabase Auth 이메일·비밀번호와 `profiles.role`을 사용한다. 브라우저에는 publishable/anon key만 넣고, service role key는 사용하지 않는다. 권한은 Supabase RLS가 직접 검사하며 클라이언트 버튼 숨김을 보안 수단으로 사용하지 않는다.
- 오류, 로딩, 빈 결과를 구분해서 표시한다. 입력 텍스트는 HTML로 실행하지 않고 React의 텍스트 렌더링으로 출력한다.

## 정보 구조와 화면

- `/`: 공개 일정·공지 조회 화면. 상단 브랜드 영역, 현재 기준 요약, 날짜·종류 필터, 빠른 상태 필터, 목록, 지난 자료 접기 영역으로 구성한다.
- `/admin`: 관리자 로그인 상태 확인 후 관리 대시보드. 공개 자료 목록과 등록·수정·삭제 폼을 제공한다.
- `/404`: 스타터의 접근성·SEO 대응 NotFound 화면을 유지한다.

## 디자인

### 대안 스타일

- 교무실 아카이브: 종이 문서철과 날짜 도장을 연상시키는 따뜻한 편집 디자인 — 0.07
- 시간표 그리드: 모눈 노트와 시간표를 재해석한 구조적인 정보 화면 — 0.06
- 캠퍼스 새벽: 짙은 남색과 옅은 하늘색으로 공공 정보의 안정감과 날짜의 선명함을 표현 — 0.87

### 선택 스타일: 캠퍼스 새벽

- **Design Movement:** 현대 공공 서비스 편집 디자인과 조용한 캠퍼스 안내 시스템.
- **Core Principles:** 신뢰감 있는 대비, 날짜 중심의 빠른 스캔, 과거 기록의 차분한 보존, 작은 화면 우선.
- **Color Philosophy:** 깊은 남색을 기록과 신뢰의 바탕으로 사용하고, 하늘색을 오늘·진행 중 상태에 사용한다. 노란색은 주의를 끄는 강조색으로만 제한해 검색 결과와 관리 작업의 우선순위를 드러낸다.
- **Layout Paradigm:** 중앙에 모든 것을 모으는 대시보드 대신 왼쪽의 날짜 레일과 오른쪽의 정보 흐름을 나누는 비대칭 매거진형 레이아웃을 사용한다. 모바일에서는 레일이 상단 요약으로 변한다.
- **Signature Elements:** 큰 날짜 숫자, 얇은 수직 시간선, 색상 상태 점과 모서리가 살짝 둥근 흰색 기록 카드.
- **Interaction Philosophy:** 필터는 즉시 결과를 좁히되 입력의 의미를 항상 레이블로 보여준다. 저장·삭제처럼 영향이 큰 작업은 명시적 버튼과 확인 단계를 사용한다.
- **Animation:** 목록은 짧은 fade-up만 사용한다. 필터 변경 시 결과 영역만 부드럽게 전환하며, 정보 탐색을 방해하는 반복 애니메이션은 사용하지 않는다.
- **Typography System:** 본문과 UI는 Noto Sans KR, 날짜 숫자와 영문 보조 표기는 IBM Plex Mono 계열 감각을 사용한다. 제목은 굵고 짧게, 설명은 넉넉한 줄 간격으로 둔다.
- **Brand Essence:** 학교의 공개 기록을 오늘 필요한 정보로 바꾸는 차분한 일정 아카이브. 성격은 명료하고 신뢰할 수 있으며 다정하다.
- **Brand Voice:** 안내는 짧고 구체적으로 쓴다. 예: “오늘의 학교 기록을 확인하세요.”, “조건에 맞는 공개 자료가 없습니다.”
- **Wordmark & Logo:** 날짜 눈금과 책갈피를 결합한 작은 사각 마크 옆에 `SCHOOL LOG` 워드마크를 둔다.
- **Signature Brand Color:** Campus Navy `#17243A`.

## 주요 폴더와 책임

- `client/src/pages/Home.tsx`: 공개 조회 화면 및 필터 상태
- `client/src/pages/Admin.tsx`: 관리자 대시보드와 자료 편집 폼
- `client/src/components/SchoolItemCard.tsx`: 공개 자료 카드
- `client/src/lib/categories.ts`: 허용 종류와 라벨
- `server/routers.ts`: 공개 목록, 관리자 CRUD, 인증 상태 API
- `server/db.ts`: 자료 조회·저장·수정·삭제 쿼리
- `drizzle/schema.ts`: 사용자와 학교 자료 스키마
- `drizzle/*.sql`: 데이터베이스 마이그레이션
- `public/manus-routes.json`: 공개 페이지 경로 선언

## 운영상 제한

첫 버전에서는 승인 전 자료를 저장하지 않는다. 관리자는 학교가 공개를 승인한 자료만 입력한다. 데이터베이스 백업·복구 시험과 관리자 권한 발급·회수는 운영 공개 전에 학교 담당자가 별도로 확인해야 한다.

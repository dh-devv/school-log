# School Log

학교에서 공개를 승인한 일정과 공지사항을 한곳에서 조회하고 검색하는 웹 서비스입니다. 방문자는 로그인 없이 공개 자료를 확인하고, 관리자는 인증 후 자료를 등록·수정·삭제할 수 있습니다.

## 주요 기능

- 날짜와 종류별 일정·공지 조회
- 휴대전화와 컴퓨터에서 이용할 수 있는 반응형 화면
- 관리자 인증을 통한 자료 관리
- Supabase에 자료 저장 및 행 단위 보안 정책 적용

첫 버전에서는 학교 전체에 공개할 수 있는 정보만 다룹니다. 일반 학생·교사 계정, 반별 비공개 정보, 알림 기능은 포함하지 않습니다. 학교가 지정한 교사는 별도 관리자 계정을 사용해 자료를 관리할 수 있습니다.

## 기술 구성

- 화면: React, TypeScript, Vite
- 정적 사이트 배포: GitHub Pages
- 데이터베이스와 관리자 인증: Supabase
- 배포 자동화: GitHub Actions

GitHub Pages는 정적 웹사이트를 제공하므로 Express 서버를 실행하지 않습니다. 공개 자료 조회와 관리자 자료 관리는 Supabase를 통해 이루어집니다.

## 프로젝트 문서

요구사항과 설계, 구현 계획은 [`docs/`](./docs/)에서 확인할 수 있습니다. 문서별 안내는 [`docs/README.md`](./docs/README.md)를 참고하세요.

## 현재 준비 상태

- GitHub Pages 배포 워크플로가 설정되어 있습니다.
- Supabase 데이터베이스 구조와 접근 권한 정책은 [`supabase/schema.sql`](./supabase/schema.sql)에 정의되어 있습니다.
- 실제 서비스를 사용하려면 Supabase 프로젝트와 GitHub Actions 환경 변수를 설정하고 관리자 계정을 지정해야 합니다.

Supabase 연결을 마치기 전에는 공개 자료 조회와 관리자 기능이 동작하지 않습니다. 학교의 공개 승인과 백업·복구 절차도 운영을 시작하기 전에 확인해야 합니다.

## GitHub Pages 배포

배포 워크플로는 `main` 브랜치에 변경 사항을 올리거나 GitHub Actions에서 직접 실행할 때 사이트를 빌드하고 배포합니다. 이 저장소의 기본 주소는 다음과 같습니다.

<https://dh-devv.github.io/school-log/>

### 1. Supabase 설정

1. Supabase 프로젝트를 만듭니다.
2. Supabase SQL 편집기에서 [`supabase/schema.sql`](./supabase/schema.sql)을 실행합니다.
3. Supabase 프로젝트의 URL과 공개용 `anon` 키를 확인합니다.
4. Supabase Authentication에서 관리자 계정을 만듭니다.
5. 해당 계정의 사용자 ID를 확인한 뒤, SQL 편집기에서 관리자 권한을 부여합니다.

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '<관리자 사용자 ID>';
   ```

자료 관리를 맡을 교사도 같은 방법으로 별도 계정을 만들고 해당 계정의 사용자 ID에 `admin` 역할을 부여합니다. 이 계정은 기존 관리자와 동일하게 자료를 등록·수정·삭제할 수 있으므로 지정된 담당자에게만 부여하세요.

관리자 로그인은 브라우저 탭의 세션 저장소에 유지됩니다. 새로고침이나 사이트 내 이동은 가능하지만 보통 탭을 닫으면 저장된 로그인 정보가 사라집니다. 브라우저의 탭 복원이나 복제 방식에 따라 세션이 남을 수 있으므로 공용 기기에서는 반드시 로그아웃하세요. 탭을 닫는 것만으로 Supabase 서버의 세션이 즉시 폐기되는 것은 아닙니다.

로그인 입력란은 자동 완성을 요청하지 않도록 설정되어 있지만, 브라우저나 비밀번호 관리자가 이를 무시할 수 있습니다. 저장된 로그인 정보는 해당 브라우저의 비밀번호 관리자에서 삭제할 수 있습니다.

### 2. Pages 배포 환경에 비밀 값 등록

저장소의 **Settings → Environments → `github-pages`**로 이동해 다음 비밀 값을 등록합니다. `github-pages` 환경은 배포 워크플로에서 사용하는 환경 이름입니다.

| 이름 | 값 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase 공개용 `anon` 키 |

공개용 키는 웹 브라우저에 포함되므로 데이터베이스의 행 단위 보안 정책(RLS)을 반드시 적용해야 합니다. `service_role` 키는 웹 앱이나 GitHub Actions의 프런트엔드 빌드에 등록하지 마세요.

필수 값이 없으면 배포 워크플로가 빌드 전에 실패하도록 설정되어 있습니다. 따라서 연결 정보가 빠진 사이트가 정상 배포된 것처럼 보이는 상황을 막을 수 있습니다.

### 3. GitHub Pages 배포 설정

1. 저장소의 **Settings → Pages**로 이동합니다.
2. 배포 원본을 **GitHub Actions**로 설정합니다.
3. `main` 브랜치에 변경 사항을 올리거나 `.github/workflows/deploy-pages.yml`의 작업을 수동으로 실행합니다.
4. Actions 실행이 완료되면 Pages 설정에 표시되는 주소에서 사이트를 확인합니다.

워크플로는 저장소 이름에 맞춰 `/school-log/` 경로를 사용합니다. 사용자 지정 도메인을 연결하는 경우 [`deploy-pages.yml`](./.github/workflows/deploy-pages.yml)의 `VITE_BASE_PATH` 값을 `/`로 바꾸어야 합니다.

## 로컬에서 실행하기

Node.js와 pnpm을 설치한 뒤 저장소의 루트 폴더에서 다음 명령을 실행합니다.

```bash
pnpm install
pnpm dev:static
```

정적 배포용 빌드는 다음 명령으로 확인할 수 있습니다.

```bash
pnpm build:static
```

Supabase를 사용하는 화면을 로컬에서 확인하려면 루트 폴더의 `.env` 파일에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 설정해야 합니다. `.env.example`을 참고하고, 실제 환경 변수 파일은 저장소에 올리지 마세요.

## 공개 및 운영 전 확인 사항

- 학교가 공개를 승인한 자료만 등록합니다.
- 관리자 계정의 발급과 권한 회수 절차를 정합니다.
- 데이터베이스의 백업·복구 방법을 확인하고 복구 시험을 진행합니다.
- 개인정보나 반별 비공개 정보를 첫 버전의 데이터베이스에 저장하지 않습니다.

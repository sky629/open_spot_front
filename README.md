# Open Spot Front

React TypeScript 기반의 위치 정보 공유 플랫폼 프론트엔드입니다. 네이버 지도 API를 활용하여 카테고리별 장소 정보를 표시하고, Google OAuth 인증을 통한 사용자 관리 기능을 제공합니다.

## 🚀 주요 기능

- **🔐 Google OAuth 인증**: 간편한 구글 계정 로그인
- **📍 네이버 지도 연동**: 네이버 클라우드 플랫폼 Maps API v3 활용
- **🎯 카테고리별 마커 표시**: 음식점, 카페, 쇼핑, 공원 등 카테고리별 SVG 마커
- **📱 반응형 사이드바**: 데스크톱 사이드바, 모바일 오버레이 UI
- **🏷️ 그룹 관리**: 장소를 그룹으로 분류하고 실시간 개수 표시
- **📊 실시간 카운트**: 그룹별, 카테고리별 장소 개수 자동 업데이트
- **🗺️ 지도 네비게이션**: "지도에서 보기" 버튼으로 장소로 즉시 이동
- **💬 정보창**: 마커 클릭 시 위치 상세 정보 표시
- **✏️ 장소 관리**: 추가, 수정, 삭제, 그룹 할당 등 완전한 CRUD
- **🏗️ 의존성 주입**: Clean Architecture 기반 서비스 계층
- **🔄 API 코드 자동 생성**: Orval로 OpenAPI 스펙에서 타입 안전한 클라이언트 생성

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite 7
- **Package Manager**: Yarn
- **Styling**: Styled Components
- **State Management**: Zustand with persistence and devtools
- **Authentication**: Google OAuth 2.0 with JWT
- **HTTP Client**: Axios with secure interceptors
- **Map API**: Naver Cloud Platform Maps API v3
- **API Code Gen**: Orval (OpenAPI → TypeScript)
- **Architecture**: Feature-based with Dependency Injection
- **Routing**: React Router DOM v7

## 📋 사전 요구사항

- Node.js 16.0 이상
- Yarn (패키지 매니저)
- 네이버 클라우드 플랫폼 계정 (네이버 지도 API 키 발급용)

## 🏃‍♂️ 시작하기

### 1. 저장소 클론

```bash
git clone <repository-url>
cd open_spot_front
```

### 2. 의존성 설치

```bash
yarn install
# 또는 단순히
yarn
```

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
# 네이버 클라우드 플랫폼 Maps API Key ID (필수)
VITE_NAVER_MAP_CLIENT_ID=your_ncp_key_id_here

# 백엔드 API URL (Spring Boot Gateway)
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth Client ID (필수)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# OAuth Redirect URI
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

#### 네이버 클라우드 플랫폼 Maps API 키 발급 방법:
> **중요**: 2025년부터 기존 AI NAVER API는 더 이상 사용할 수 없으며, 네이버 클라우드 플랫폼 API로 이전되었습니다.

1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속 및 회원가입
2. 콘솔 로그인 후 **AI·Application Service > AI NAVER API > Maps** 선택
3. **Application 등록** 클릭
4. 서비스 정보 입력:
   - 서비스명: 원하는 서비스명 입력
   - 서비스 URL: 개발/배포 도메인 등록
   - **Web Dynamic Map** 서비스 선택
5. 생성된 **인증 정보**에서 **Key ID**를 복사
6. 발급받은 **Key ID**를 `VITE_NAVER_MAP_CLIENT_ID`에 설정

### 4. 개발 서버 실행

```bash
yarn dev
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 📦 빌드 및 배포

### 개발 명령어

```bash
# 개발 서버 시작
yarn dev

# 빌드 (타입 체크 없이 빠른 빌드)
yarn build

# 빌드 + 타입 체크 (완전한 검증)
yarn build:check

# 빌드 미리보기
yarn preview

# 타입 체크만 실행
yarn type-check

# ESLint 코드 린팅
yarn lint

# 개발 서버 종료 (포트 정리 포함)
yarn kill:servers

# 서버 재시작 (종료 + 시작)
yarn restart
```

### Docker 배포

```bash
# 프로덕션 배포 (nginx 컨테이너)
sh deploy.sh prod

# 로컬 Docker 빌드 테스트
docker-compose up --build
```

## 🏗️ 프로젝트 구조

```
src/
├── features/          # Feature modules
│   ├── auth/         # Authentication feature
│   │   ├── components/      # Login, ProtectedRoute
│   │   ├── pages/          # LoginPage, LoginErrorPage
│   │   └── services/       # AuthServiceImpl
│   └── map/          # Map feature
│       ├── components/      # MapContainer, LocationMarker, CreateLocationModal
│       └── pages/          # MapPage
├── components/        # Shared UI components
│   ├── Sidebar/      # GroupSection, LocationSection, LocationItem
│   │   ├── GroupSection.tsx       # 그룹 관리 (개수 포함)
│   │   ├── LocationSection.tsx    # 장소 목록 (개수 포함)
│   │   ├── LocationItem.tsx       # 장소 상세 (수정/삭제/그룹 추가)
│   │   ├── AddToGroupModal.tsx    # 그룹 추가 모달
│   │   ├── EditLocationModal.tsx  # 장소 수정 모달
│   │   └── DeleteConfirmModal.tsx # 삭제 확인 모달
│   └── common/       # CategoryDropdown, SearchableDropdown
├── api/               # Generated API client (Orval)
│   └── generated/    # Auto-generated from openapi.yaml
├── stores/            # Zustand stores
│   ├── auth/         # Authentication store with service injection
│   ├── location/     # Location store with map navigation control
│   ├── group/        # Group store with locationIds sync
│   └── category/     # Category store
├── services/          # Service layer
│   ├── locationService.ts  # Location CRUD operations
│   ├── groupService.ts     # Group management
│   └── categoryService.ts  # Category operations
├── core/              # Core architecture
│   ├── container/    # Dependency injection container
│   └── interfaces/   # Service interfaces (ILocationService, IGroupService)
├── constants/         # Application constants
│   ├── map.ts        # Map config, categories, marker icons
│   └── api.ts        # API endpoints
├── types/             # TypeScript type definitions
├── utils/             # Utility functions (logger, cookies)
└── setup/             # Application initialization
```

### 아키텍처 특징

- **Feature-based Architecture**: 기능별 디렉토리 구조 (auth, map)
- **Dependency Injection**: 서비스 계층 의존성 주입 (DI Container)
- **Backend API Integration**: OpenAPI 스펙 기반 Orval 자동 코드 생성
- **Group-Location Sync**: 백엔드를 Single Source of Truth로 활용
- **Clean Separation**: UI, 비즈니스 로직, 데이터 레이어 분리
- **Type Safety**: 모든 레이어에서 TypeScript 강타입 적용
- **Real-time Updates**: 그룹/장소 개수 실시간 동기화

## 🔌 API 연동

### 현재 상태: 백엔드 API 통합 완료

애플리케이션은 Spring Boot 백엔드와 완전히 통합되어 있습니다:

- **Orval 자동 생성**: `openapi.yaml` → TypeScript 클라이언트
- **타입 안전성**: 모든 API 요청/응답이 타입 체크됨
- **Graceful Fallback**: API 실패 시 목 데이터로 대체
- **실시간 동기화**: 백엔드를 Single Source of Truth로 활용

### 백엔드 API 엔드포인트

```
# 인증 관련
POST   /api/v1/auth/login          # Google OAuth 로그인
POST   /api/v1/auth/refresh        # JWT 토큰 갱신
POST   /api/v1/auth/logout         # 로그아웃
GET    /api/v1/auth/user           # 사용자 정보 조회

# 위치 관련
GET    /api/v1/locations           # 모든 위치 조회 (페이지네이션)
GET    /api/v1/locations?category=cafe&groupId=xxx  # 필터링 조회
GET    /api/v1/locations/:id       # 특정 위치 조회
POST   /api/v1/locations           # 새 위치 생성
PUT    /api/v1/locations/:id       # 위치 정보 업데이트
DELETE /api/v1/locations/:id       # 위치 삭제

# 그룹 관련
GET    /api/v1/location-groups     # 모든 그룹 조회
POST   /api/v1/location-groups     # 새 그룹 생성
PUT    /api/v1/location-groups/:id # 그룹 정보 업데이트
DELETE /api/v1/location-groups/:id # 그룹 삭제
POST   /api/v1/location-groups/reorder  # 그룹 순서 변경
```

### API 응답 형식

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "1",
        "name": "광화문 카페",
        "latitude": 37.5665,
        "longitude": 126.9780,
        "description": "역사적인 광화문 근처의 아늑한 카페",
        "category": "cafe",
        "address": "서울특별시 종로구 세종대로",
        "rating": 4.5,
        "review": "분위기가 좋아요",
        "groupId": "group-1",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "page": {
      "number": 0,
      "size": 20,
      "totalElements": 50,
      "totalPages": 3
    }
  }
}
```

### OpenAPI 스펙 업데이트

백엔드 API가 변경되면:

```bash
# 1. 최신 openapi.yaml 받기
# 2. API 클라이언트 재생성
yarn generate:api

# 3. 생성된 타입과 함수 자동 적용
# src/api/generated/ 디렉토리 확인
```

## 🎨 아키텍처 패턴

### 디자인 패턴

- **Dependency Injection**: 서비스 계층의 의존성을 런타임에 주입
- **Repository Pattern**: 데이터 접근 로직 추상화 (`locationService.ts`)
- **Custom Hook Pattern**: React 상태 관리 및 로직 재사용 (`useAuth`, `useLocations`)
- **Factory Pattern**: DI 컨테이너에서 서비스 인스턴스 생성
- **Observer Pattern**: Zustand 상태 변화 감지 및 React 구독
- **Adapter Pattern**: Naver Maps API를 React에 맞게 변환
- **Facade Pattern**: 복잡한 인증/API 로직을 단순한 인터페이스로 제공

### 상태 관리 전략

- **Zustand with Persistence**: 인증 상태 브라우저 저장
- **Service Injection**: Zustand 스토어에 서비스 의존성 주입
- **Infinite Loop Prevention**: 상태 동등성 검사로 무한 루프 방지
- **React Context**: 컴포넌트 간 인증 상태 공유

### 개발 전략

- **Mock-first Development**: API 개발 대기 없이 프론트엔드 완성
- **Type-driven Development**: TypeScript 타입 먼저 정의 후 구현
- **Component-driven**: Storybook 없이도 컴포넌트 단위 개발

## 📱 반응형 디자인

- **Desktop**: 1200px 이상 - 전체 기능 이용 가능
- **Tablet**: 768px - 1199px - 적응형 레이아웃
- **Mobile**: 767px 이하 - 모바일 최적화 UI

## 🔧 개발 가이드

### 새로운 위치 카테고리 추가

1. **상수 업데이트**: `src/constants/map.ts`
   ```typescript
   export const MAP_CATEGORIES = {
     // 기존 카테고리...
     NEW_CATEGORY: 'new_category',
   };

   export const MARKER_ICONS = {
     // 기존 아이콘...
     NEW_CATEGORY: '/icons/marker-new-category.svg',
   };
   ```

2. **아이콘 생성**: `public/icons/marker-new-category.svg` 추가

3. **목 데이터 업데이트**: `src/services/locationService.ts`의 `mockLocations`에 새 카테고리 데이터 추가

### 커스텀 마커 아이콘 생성

1. **SVG 아이콘 생성**: `public/icons/` 폴더에 32x32 SVG 파일 추가
2. **아이콘 등록**: `src/constants/map.ts`의 `MARKER_ICONS`에 경로 등록
3. **테스트**: `http://localhost:3000/icons/your-icon.svg`로 접근 가능 확인

### 백엔드 API 연결

1. **환경 변수 설정**: `.env`에서 `VITE_API_BASE_URL` 확인
2. **서비스 전환**: `src/services/locationService.ts`에서 TODO 주석 해제
3. **목 데이터 비활성화**: `return filteredLocations;` 라인 주석 처리

### 새로운 서비스 추가

1. **인터페이스 정의**: `src/core/interfaces/` 에 인터페이스 추가
2. **서비스 구현**: `src/services/` 에 구현체 생성
3. **토큰 등록**: `src/core/container/ServiceTokens.ts`에 토큰 추가
4. **컨테이너 등록**: `src/setup/initializeApplication.ts`에서 서비스 등록

## 🐛 문제 해결

### 지도가 로드되지 않는 경우
- **NCP API 키 확인**: `.env`의 `VITE_NAVER_MAP_CLIENT_ID`가 올바른 Key ID인지 확인
- **도메인 등록**: NCP 콘솔에서 `http://localhost:3000` 도메인이 등록되어 있는지 확인
- **401 Unauthorized**: 콘솔에서 `http://oapi.map.naver.com/v3/auth` 401 에러시 도메인 등록 문제
- **API 마이그레이션**: 기존 AI NAVER API 키는 2025년부터 사용 불가

### 마커 아이콘 404 에러
- **아이콘 파일 확인**: `public/icons/` 폴더에 SVG 파일들이 있는지 확인
- **경로 확인**: `src/constants/map.ts`의 `MARKER_ICONS` 경로가 올바른지 확인
- **서빙 테스트**: `curl -I http://localhost:3000/icons/marker-default.svg`로 200 응답 확인

### Google OAuth 로그인 실패
- **Client ID 확인**: `.env`의 `VITE_GOOGLE_CLIENT_ID`가 올바른지 확인
- **리다이렉트 URI**: Google Console에서 `http://localhost:8080/login/oauth2/code/google` 등록 확인
- **백엔드 연결**: 백엔드 서버 `localhost:8080`이 실행 중인지 확인

### 빌드 에러
- **타입 체크 분리**: `yarn build` (빠른 빌드) vs `yarn build:check` (타입 체크 포함)
- **의존성 재설치**: `yarn install`로 node_modules 재설치
- **Docker 빌드**: `.dockerignore`가 `.env` 파일을 제외하고 있는지 확인

### 개발 서버 포트 충돌
- **포트 정리**: `yarn kill:servers`로 기존 프로세스 종료
- **재시작**: `yarn restart`로 서버 재시작

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해주세요.
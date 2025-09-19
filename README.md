# Open Spot Front

네이버 지도 API를 활용한 위치 기반 서비스 프론트엔드 애플리케이션입니다. 백엔드 API에서 GPS 좌표 데이터를 조회하여 지도상에 마커로 표시하는 기능을 제공합니다.

## 🚀 주요 기능

- **📍 네이버 지도 연동**: 네이버 지도 API를 활용한 인터랙티브 지도
- **🎯 위치 마커 표시**: 백엔드 API에서 조회한 GPS 좌표를 지도상에 마커로 표시
- **🏷️ 카테고리 필터링**: 음식점, 카페, 쇼핑, 공원 등 카테고리별 위치 필터링
- **📱 반응형 디자인**: 모바일과 데스크톱 모든 환경에서 최적화된 UI
- **💬 정보창**: 마커 클릭 시 위치 상세 정보 표시
- **🔄 실시간 업데이트**: 지도 이동 시 해당 영역의 위치 정보 자동 조회

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Package Manager**: Yarn
- **Styling**: Styled-components
- **HTTP Client**: Axios
- **Map API**: Naver Maps API
- **State Management**: React Hooks

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
# 네이버 지도 API 키 (필수)
NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here

# 백엔드 API URL
API_BASE_URL=http://localhost:8000
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
6. 발급받은 **Key ID**를 `NAVER_MAP_CLIENT_ID`에 설정

### 4. 개발 서버 실행

```bash
yarn dev
```

애플리케이션이 `http://localhost:3000`에서 실행됩니다.

## 📦 빌드 및 배포

### 프로덕션 빌드

```bash
yarn build
```

### 빌드 미리보기

```bash
yarn preview
```

### 타입 체크

```bash
yarn type-check
```

### 코드 린팅

```bash
yarn lint
```

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── Map/            # 지도 관련 컴포넌트
│   │   ├── MapContainer.tsx     # 메인 지도 컨테이너
│   │   └── LocationMarker.tsx   # 위치 마커 컴포넌트
│   └── UI/             # 공통 UI 컴포넌트
├── pages/              # 페이지 컴포넌트
│   └── MainPage.tsx    # 메인 페이지
├── services/           # API 통신 레이어
│   ├── api.ts          # 기본 API 클라이언트
│   └── locationService.ts # 위치 데이터 API
├── hooks/              # 커스텀 React 훅
│   ├── useLocations.ts # 위치 데이터 상태 관리
│   └── useNaverMap.ts  # 네이버 지도 인스턴스 관리
├── types/              # TypeScript 타입 정의
│   ├── naver-maps.d.ts # 네이버 지도 API 타입
│   └── api.ts          # API 응답 타입
├── constants/          # 애플리케이션 상수
│   ├── map.ts          # 지도 설정 및 마커 아이콘
│   └── api.ts          # API 엔드포인트
└── utils/              # 유틸리티 함수
    └── loadNaverMaps.ts # 동적 지도 API 로딩
```

## 🔌 API 연동

이 애플리케이션은 다음과 같은 백엔드 API 엔드포인트를 사용합니다:

```
GET    /api/v1/locations           # 모든 위치 조회
GET    /api/v1/locations/:id       # 특정 위치 조회
POST   /api/v1/locations           # 새 위치 생성
PUT    /api/v1/locations/:id       # 위치 정보 업데이트
DELETE /api/v1/locations/:id       # 위치 삭제
```

### 예상 API 응답 형식:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "카페 이름",
      "latitude": 37.5665,
      "longitude": 126.9780,
      "description": "맛있는 커피를 제공하는 카페",
      "category": "cafe",
      "iconUrl": "https://example.com/icon.png",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 🎨 디자인 패턴

이 프로젝트는 다음과 같은 디자인 패턴들을 적용했습니다:

- **Layered Architecture**: UI, 비즈니스 로직, 데이터 접근 계층 분리
- **Repository Pattern**: 데이터 접근 로직 추상화
- **Custom Hook Pattern**: React 상태 관리 및 로직 재사용
- **Factory Pattern**: API 클라이언트 인스턴스 생성
- **Observer Pattern**: React 상태 변화 감지
- **Adapter Pattern**: 외부 API를 React에 맞게 변환
- **Facade Pattern**: 복잡한 로직을 단순한 인터페이스로 제공

## 📱 반응형 디자인

- **Desktop**: 1200px 이상 - 전체 기능 이용 가능
- **Tablet**: 768px - 1199px - 적응형 레이아웃
- **Mobile**: 767px 이하 - 모바일 최적화 UI

## 🔧 개발 가이드

### 새로운 위치 카테고리 추가

1. `src/constants/map.ts`에서 `MAP_CATEGORIES`와 `MARKER_ICONS` 업데이트
2. `src/pages/MainPage.tsx`에서 카테고리 필터 옵션 추가

### 커스텀 마커 아이콘 사용

1. `public/icons/` 폴더에 아이콘 파일 추가
2. `src/constants/map.ts`의 `MARKER_ICONS` 객체에 경로 등록
3. `LocationMarker.tsx`에서 카테고리별 아이콘 매핑

### API 엔드포인트 변경

1. `src/constants/api.ts`에서 엔드포인트 URL 수정
2. `src/types/api.ts`에서 관련 타입 정의 업데이트
3. `src/services/locationService.ts`에서 서비스 메서드 수정

## 🐛 문제 해결

### 지도가 로드되지 않는 경우
- **API 키 확인**: 네이버 클라우드 플랫폼에서 발급받은 Key ID가 올바르게 설정되었는지 확인
- **API 마이그레이션**: 기존 AI NAVER API 키를 사용하고 있다면 NCP API로 이전 필요
- **도메인 등록**: NCP 콘솔에서 현재 도메인(localhost:3000 포함)이 등록되어 있는지 확인
- **에러 메시지**: 개발자 도구 콘솔에서 인증 실패(authFailure) 또는 리소스 로드 에러 확인
- **네트워크 연결**: 인터넷 연결 상태 확인

### API 통신 에러
- 백엔드 서버가 실행 중인지 확인
- `API_BASE_URL` 환경 변수가 올바른지 확인
- CORS 설정이 적절한지 백엔드에서 확인

### 빌드 에러
- Node.js 버전이 16.0 이상인지 확인
- `yarn install`로 의존성 재설치
- TypeScript 타입 에러가 있는지 `yarn type-check`로 확인

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
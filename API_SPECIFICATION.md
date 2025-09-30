# 📍 Open Spot API 명세서

> **버전**: v1.0
> **최종 업데이트**: 2024-01-01
> **프로젝트**: Open Spot - 지도 기반 위치 공유 서비스

---

## 📋 개요

**Open Spot**은 개인이 방문한 장소에 대한 평점과 정보를 기록하고 관리하는 지도 기반 위치 공유 서비스입니다.

### 🎯 핵심 기능
- 개인 위치 평점/정보 기록 관리
- 그룹별 장소 관리 (맛집, 카페, 데이트 코스 등)
- 친구와 장소 그룹 공유
- 지도 기반 시각적 위치 표시

### 🛠️ 기술 스택
- **Frontend**: React TypeScript + 네이버 지도 API
- **Backend**: Spring Boot
- **Database**: PostgreSQL
- **Authentication**: Google OAuth 2.0 + JWT

---

## 🔐 인증 관리

### 1. Google OAuth 로그인
**`POST /api/v1/auth/google/login`**

Google OAuth 토큰을 사용하여 사용자 인증 및 JWT 토큰 발급

**Request Body:**
```json
{
  "accessToken": "google_oauth_access_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_uuid",
      "email": "user@example.com",
      "name": "홍길동",
      "profileImageUrl": "https://profile-image-url",
      "provider": "Google",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresAt": "2024-01-01T01:00:00Z"
    }
  },
  "message": "로그인 성공"
}
```

---

### 2. 토큰 갱신
**`POST /api/v1/auth/token/refresh`**

Refresh Token을 사용하여 새로운 Access Token 발급

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_access_token",
    "expiresAt": "2024-01-01T02:00:00Z"
  }
}
```

---

### 3. 사용자 프로필 조회
**`GET /api/v1/users/self`**
**Headers:** `Authorization: Bearer {access_token}`

현재 로그인된 사용자의 프로필 정보 조회

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "profileImageUrl": "https://profile-image-url",
    "provider": "Google",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. 로그아웃
**`POST /api/v1/auth/logout`**
**Headers:** `Authorization: Bearer {access_token}`

사용자 로그아웃 및 토큰 무효화

**Response (200):**
```json
{
  "success": true,
  "message": "로그아웃 완료"
}
```

---

### 5. 토큰 검증
**`POST /api/v1/auth/verify`**
**Headers:** `Authorization: Bearer {access_token}`

JWT 토큰 유효성 검증

**Response (200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user_uuid",
    "exp": 1641024000
  }
}
```

---

## 📍 내 위치 기록 관리

### 6. 내 위치 기록 목록 조회 🔥
**`GET /api/v1/locations/self`**
**Headers:** `Authorization: Bearer {access_token}`

사용자의 위치 기록 목록 조회 (현재 Mock 데이터 사용 중)

**Query Parameters:**
```
category: string (optional) - 'all', 'restaurant', 'cafe', 'shopping', 'park'
groupId: string (optional) - 특정 그룹의 위치만 조회
bounds: object (optional) - 지도 영역 필터링
  - northEast: { lat: number, lng: number }
  - southWest: { lat: number, lng: number }
limit: number (optional, default: 50) - 페이지네이션
offset: number (optional, default: 0) - 페이지네이션
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "location_uuid",
      "userId": "user_uuid",
      "name": "광화문 카페",
      "latitude": 37.5665,
      "longitude": 126.9780,
      "description": "역사적인 광화문 근처의 아늑한 카페",
      "category": "cafe",
      "iconUrl": "https://icon-url",

      "rating": 4,
      "review": "분위기가 정말 좋고 커피도 맛있어요!",
      "visitDate": "2024-01-01T00:00:00Z",
      "tags": ["분위기좋은", "데이트", "커피맛집"],

      "groupId": "group_uuid",
      "groupName": "카페 맛집",

      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 7. 내 위치 기록 상세 조회
**`GET /api/v1/locations/self/{id}`**
**Headers:** `Authorization: Bearer {access_token}`

특정 위치 기록의 상세 정보 조회

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "location_uuid",
    "userId": "user_uuid",
    "name": "광화문 카페",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "description": "역사적인 광화문 근처의 아늑한 카페",
    "category": "cafe",
    "iconUrl": "https://icon-url",
    "rating": 4,
    "review": "분위기가 정말 좋고 커피도 맛있어요!",
    "visitDate": "2024-01-01T00:00:00Z",
    "tags": ["분위기좋은", "데이트", "커피맛집"],
    "groupId": "group_uuid",
    "groupName": "카페 맛집",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 8. 새 위치 기록 생성 🔥
**`POST /api/v1/locations/self`**
**Headers:** `Authorization: Bearer {access_token}`

새로운 위치 기록 생성 (평점, 리뷰 포함)

**Request Body:**
```json
{
  "name": "광화문 카페",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "description": "역사적인 광화문 근처의 아늑한 카페",
  "category": "cafe",
  "iconUrl": "https://icon-url",

  "rating": 4,
  "review": "분위기가 정말 좋고 커피도 맛있어요!",
  "visitDate": "2024-01-01T00:00:00Z",
  "tags": ["분위기좋은", "데이트", "커피맛집"],

  "groupId": "group_uuid"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new_location_uuid",
    "userId": "user_uuid",
    "name": "광화문 카페",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "description": "역사적인 광화문 근처의 아늑한 카페",
    "category": "cafe",
    "iconUrl": "https://icon-url",
    "rating": 4,
    "review": "분위기가 정말 좋고 커피도 맛있어요!",
    "visitDate": "2024-01-01T00:00:00Z",
    "tags": ["분위기좋은", "데이트", "커피맛집"],
    "groupId": "group_uuid",
    "groupName": "카페 맛집",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "위치 기록이 생성되었습니다"
}
```

---

### 9. 위치 기록 업데이트
**`PUT /api/v1/locations/self/{id}`**
**Headers:** `Authorization: Bearer {access_token}`

기존 위치 기록 수정 (평점, 리뷰 수정 포함)

**Request Body:**
```json
{
  "name": "수정된 카페명",
  "description": "수정된 설명",
  "rating": 5,
  "review": "재방문했는데 더욱 좋아졌어요!",
  "visitDate": "2024-01-02T00:00:00Z",
  "tags": ["분위기좋은", "데이트", "커피맛집", "재방문"],
  "groupId": "new_group_uuid"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "location_uuid",
    "userId": "user_uuid",
    "name": "수정된 카페명",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "description": "수정된 설명",
    "category": "cafe",
    "rating": 5,
    "review": "재방문했는데 더욱 좋아졌어요!",
    "visitDate": "2024-01-02T00:00:00Z",
    "tags": ["분위기좋은", "데이트", "커피맛집", "재방문"],
    "groupId": "new_group_uuid",
    "groupName": "새 그룹명",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "위치 기록이 수정되었습니다"
}
```

---

### 10. 위치 기록 삭제
**`DELETE /api/v1/locations/self/{id}`**
**Headers:** `Authorization: Bearer {access_token}`

위치 기록 삭제

**Response (200):**
```json
{
  "success": true,
  "message": "위치 기록이 삭제되었습니다"
}
```

---

## 📂 위치 그룹 관리

### 11. 내 그룹 목록 조회
**`GET /api/v1/locations/groups`**
**Headers:** `Authorization: Bearer {access_token}`

사용자의 위치 그룹 목록 조회 (order 기준 오름차순 정렬)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "group_uuid",
      "userId": "user_uuid",
      "name": "맛집 모음",
      "description": "내가 가본 맛있는 음식점들",
      "color": "#FF5722",
      "icon": "restaurant",
      "order": 0,
      "locationCount": 15,
      "isShared": true,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": "group_uuid_2",
      "userId": "user_uuid",
      "name": "카페 맛집",
      "description": "분위기 좋은 카페들",
      "color": "#4CAF50",
      "icon": "local_cafe",
      "order": 1,
      "locationCount": 8,
      "isShared": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 12. 새 그룹 생성
**`POST /api/v1/locations/groups`**
**Headers:** `Authorization: Bearer {access_token}`

새로운 위치 그룹 생성 (order는 자동으로 마지막 순서로 할당)

**Request Body:**
```json
{
  "name": "데이트 코스",
  "description": "연인과 함께 가기 좋은 장소들",
  "color": "#E91E63",
  "icon": "favorite"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "new_group_uuid",
    "userId": "user_uuid",
    "name": "데이트 코스",
    "description": "연인과 함께 가기 좋은 장소들",
    "color": "#E91E63",
    "icon": "favorite",
    "order": 2,
    "locationCount": 0,
    "isShared": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "그룹이 생성되었습니다"
}
```

---

### 13. 그룹 수정
**`PUT /api/v1/locations/groups/{id}`**
**Headers:** `Authorization: Bearer {access_token}`

기존 그룹 정보 수정

**Request Body:**
```json
{
  "name": "수정된 그룹명",
  "description": "수정된 설명",
  "color": "#9C27B0",
  "icon": "star",
  "order": 0
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "group_uuid",
    "userId": "user_uuid",
    "name": "수정된 그룹명",
    "description": "수정된 설명",
    "color": "#9C27B0",
    "icon": "star",
    "order": 0,
    "locationCount": 15,
    "isShared": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-02T00:00:00Z"
  },
  "message": "그룹이 수정되었습니다"
}
```

---

### 14. 그룹 순서 변경
**`PUT /api/v1/locations/groups/reorder`**
**Headers:** `Authorization: Bearer {access_token}`

여러 그룹의 순서를 한 번에 변경 (드래그 앤 드롭 UI에서 사용)

**Request Body:**
```json
{
  "groupOrders": [
    { "id": "group_uuid_1", "order": 0 },
    { "id": "group_uuid_2", "order": 1 },
    { "id": "group_uuid_3", "order": 2 }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "그룹 순서가 변경되었습니다"
}
```

---

### 15. 그룹 삭제
**`DELETE /api/v1/locations/groups/{id}`**
**Headers:** `Authorization: Bearer {access_token}`

그룹 삭제 (그룹 내 위치들은 그룹 없음 상태로 변경)

**Response (200):**
```json
{
  "success": true,
  "message": "그룹이 삭제되었습니다"
}
```

---

## 👥 친구 및 그룹 공유 (미래 기능)

### 16. 그룹 공유하기
**`POST /api/v1/locations/groups/{groupId}/share`**
**Headers:** `Authorization: Bearer {access_token}`

친구들과 그룹 공유

**Request Body:**
```json
{
  "friendIds": ["friend_uuid_1", "friend_uuid_2"],
  "permission": "VIEW"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shareId": "share_uuid",
    "sharedWith": ["friend_uuid_1", "friend_uuid_2"],
    "permission": "VIEW"
  },
  "message": "그룹이 공유되었습니다"
}
```

---

### 17. 공유받은 그룹 목록 조회
**`GET /api/v1/shared-groups`**
**Headers:** `Authorization: Bearer {access_token}`

친구들이 공유한 그룹 목록 조회

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "shared_group_uuid",
      "groupId": "original_group_uuid",
      "groupName": "친구의 맛집 모음",
      "ownerName": "김친구",
      "permission": "VIEW",
      "locationCount": 20,
      "sharedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 18. 친구 목록 조회
**`GET /api/v1/friends`**
**Headers:** `Authorization: Bearer {access_token}`

사용자의 친구 목록 조회

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "friend_uuid",
      "name": "김친구",
      "email": "friend@example.com",
      "profileImageUrl": "https://profile-url",
      "status": "ACCEPTED",
      "addedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 19. 친구 추가 요청
**`POST /api/v1/friends/request`**
**Headers:** `Authorization: Bearer {access_token}`

이메일로 친구 추가 요청

**Request Body:**
```json
{
  "email": "friend@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "requestId": "request_uuid",
    "status": "SENT"
  },
  "message": "친구 요청이 전송되었습니다"
}
```

---

## ⚙️ 환경 설정

### 서버 정보
- **Base URL**: `http://localhost:8080`
- **API Version**: v1
- **Protocol**: HTTP/HTTPS
- **Timeout**: 10초

### 인증 설정
- **방식**: JWT Bearer Token
- **Header**: `Authorization: Bearer {access_token}`
- **토큰 만료**:
  - Access Token: 1시간
  - Refresh Token: 7일

### CORS 설정
허용 도메인:
- `http://localhost:3000` (개발 환경)
- `http://localhost:80` (프로덕션 Docker)

### Google OAuth 설정
- **Redirect URI**: `/login/oauth2/code/google`
- **Scope**: `openid profile email`

---

## 🔥 구현 우선순위

### Phase 1 - 핵심 기능 (즉시 필요)
1. **`POST /api/v1/auth/google/login`** - Google OAuth 로그인
2. **`GET /api/v1/locations/self`** - 내 위치 기록 목록 조회
3. **`POST /api/v1/locations/self`** - 새 위치 기록 생성

### Phase 2 - 인증 시스템 완성
4. **`POST /api/v1/auth/token/refresh`** - 토큰 갱신
5. **`GET /api/v1/users/self`** - 사용자 프로필
6. **`POST /api/v1/auth/logout`** - 로그아웃

### Phase 3 - 위치 관리 CRUD
7. **`GET /api/v1/locations/self/{id}`** - 특정 위치 조회
8. **`PUT /api/v1/locations/self/{id}`** - 위치 수정
9. **`DELETE /api/v1/locations/self/{id}`** - 위치 삭제

### Phase 4 - 그룹 관리
10. **`GET /api/v1/locations/groups`** - 그룹 목록 조회
11. **`POST /api/v1/locations/groups`** - 새 그룹 생성
12. **`PUT /api/v1/locations/groups/{id}`** - 그룹 수정
13. **`PUT /api/v1/locations/groups/reorder`** - 그룹 순서 변경
14. **`DELETE /api/v1/locations/groups/{id}`** - 그룹 삭제

### Phase 5 - 친구 공유 (미래)
15. 친구 관리 및 그룹 공유 API 전체

---

## 📊 데이터 타입 정의

### TypeScript 타입 정의
```typescript
// 위치 카테고리
type LocationCategory = 'restaurant' | 'cafe' | 'shopping' | 'park';

// 평점 범위
type Rating = 1 | 2 | 3 | 4 | 5;

// 친구 상태
type FriendStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED';

// 공유 권한
type SharePermission = 'VIEW' | 'EDIT';

// 사용자 정보
interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  provider: 'Google';
  createdAt: string;
  updatedAt: string;
}

// 내 위치 기록
interface MyLocationResponse {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: LocationCategory;
  iconUrl?: string;

  // 개인 평점 및 리뷰
  rating?: Rating;
  review?: string;
  visitDate?: string;
  tags?: string[];

  // 그룹 정보
  groupId?: string;
  groupName?: string;

  createdAt: string;
  updatedAt: string;
}

// 위치 그룹
interface LocationGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;          // 그룹 표시 순서 (0부터 시작)
  locationCount: number;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🛠️ 에러 처리

### HTTP 상태 코드
- **200 OK**: 성공
- **201 Created**: 생성 성공
- **400 Bad Request**: 잘못된 요청
- **401 Unauthorized**: 인증 실패
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **500 Internal Server Error**: 서버 오류

### 에러 응답 형식
```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "잘못된 요청입니다",
  "details": {
    "field": "rating",
    "code": "INVALID_RANGE",
    "message": "평점은 1-5 사이의 값이어야 합니다"
  }
}
```

### 공통 에러 코드
- `INVALID_TOKEN`: 유효하지 않은 토큰
- `EXPIRED_TOKEN`: 만료된 토큰
- `INSUFFICIENT_PERMISSION`: 권한 부족
- `RESOURCE_NOT_FOUND`: 리소스 없음
- `INVALID_REQUEST`: 잘못된 요청
- `DUPLICATE_RESOURCE`: 중복된 리소스

---

## 🔧 개발 가이드

### 데이터 형식
- **날짜**: ISO 8601 형식 (`2024-01-01T00:00:00Z`)
- **태그**: # 없이 저장, 프론트엔드에서 표시 시 추가
- **색상**: HEX 코드 형식 (`#FF5722`)
- **좌표**: WGS84 좌표계 (위도/경도)

### 페이지네이션
```json
{
  "limit": 50,
  "offset": 0,
  "total": 150,
  "hasMore": true
}
```

### 검색 필터
```json
{
  "category": "restaurant",
  "rating": [4, 5],
  "tags": ["맛집", "데이트"],
  "dateRange": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  }
}
```

---

## 📞 지원 및 문의

### 프론트엔드 연동 참고 파일
- `src/services/locationService.ts` - 위치 API 서비스
- `src/services/authService.ts` - 인증 API 서비스
- `src/constants/api.ts` - API 엔드포인트 상수
- `src/types/api.ts` - 타입 정의

### 주요 변경사항
- 위치 정보에 **평점, 리뷰, 방문날짜, 태그** 필드 추가
- **그룹 관리** 기능 추가 (색상, 아이콘 포함)
- **친구 공유** 시스템 설계
- **개인화된 위치 관리**에 초점

---

**문서 버전**: v1.0
**마지막 업데이트**: 2024-01-01
**다음 리뷰**: Phase 1 구현 완료 후
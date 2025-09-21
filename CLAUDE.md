# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React TypeScript frontend application with feature-based architecture, displaying location data on Naver Maps. Implements Google OAuth authentication, dependency injection, and Zustand state management.

## Key Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand with persistence and devtools
- **Architecture**: Feature-based with dependency injection container
- **Authentication**: Google OAuth with JWT tokens
- **Map Integration**: Naver Maps API
- **HTTP Client**: Axios with secure interceptors
- **Routing**: React Router DOM v7

## Development Commands

```bash
# Install dependencies (uses yarn)
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Type checking
yarn type-check

# Linting
yarn lint

# Kill development servers
yarn kill:servers

# Restart development server
yarn restart
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```bash
NAVER_MAP_CLIENT_ID=your_ncp_key_id_here
API_BASE_URL=http://localhost:8080
GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
OAUTH_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

## Architecture Overview

### Feature-Based Structure

```
src/
├── features/           # Feature modules (auth, map)
│   ├── auth/          # Authentication feature
│   │   ├── components/ # Login, ProtectedRoute
│   │   ├── pages/     # LoginPage, AuthCallbackPage
│   │   └── services/  # Auth-specific services
│   └── map/           # Map feature
│       ├── components/ # Map components
│       └── pages/     # MapPage
├── core/              # Core architecture
│   ├── container/     # Dependency injection
│   ├── interfaces/    # Service contracts
│   └── types/         # Core type definitions
├── stores/            # Zustand stores
│   ├── auth/          # Authentication state
│   └── location/      # Location data state
├── services/          # External API services
├── shared/            # Shared components and utilities
├── setup/             # Application initialization
└── utils/             # Utility functions
```

### Dependency Injection Container

The application uses a custom DI container (`src/core/container/Container.ts`):
- Services registered with tokens in `ServiceTokens.ts`
- Supports singleton and factory patterns
- Services injected into stores via `setAuthServiceForStore()`
- Container initialized in `src/setup/initializeApplication.ts`

### State Management with Zustand

**Auth Store** (`src/stores/auth/authStore.ts`):
- Persisted authentication state
- Google OAuth integration
- JWT token handling
- Service injection pattern for async operations
- Prevents infinite loops with state equality checks

**Location Store** (`src/stores/location/locationStore.ts`):
- Location data management
- Map bounds and filtering
- CRUD operations for locations

### Authentication Flow

1. **Login**: Google OAuth redirect → Backend exchange → JWT tokens
2. **Token Storage**: Secure cookie handling via `SecureCookieService`
3. **API Calls**: JWT attached via `SecureApiClient` interceptors
4. **Protected Routes**: `ProtectedRoute` component guards authenticated pages
5. **Token Refresh**: Automatic refresh before expiration

### Application Lifecycle

Entry point: `src/main.tsx` → `NewApp.tsx`

1. **Initialization**: `initializeApplication()` sets up DI container and services
2. **Service Registration**: Auth and API services registered with container
3. **Store Injection**: Services injected into Zustand stores
4. **Route Protection**: Authentication checked for protected routes

## Key Service Patterns

### Secure API Client
- JWT token attachment
- Request/response interceptors
- Error handling and token refresh
- CORS configuration for backend integration

### Auth Service Architecture
- Google OAuth integration
- JWT token lifecycle management
- User profile management
- Logout and cleanup

## Development Patterns

### Adding New Features
1. Create feature directory under `src/features/`
2. Implement service interfaces from `src/core/interfaces/`
3. Register services in DI container
4. Create Zustand store if needed
5. Add routes to `NewApp.tsx`

### Service Registration
```typescript
// In setup/initializeApplication.ts
container.register(ServiceTokens.AUTH_SERVICE, () => new AuthService(...));
```

### Store Integration
```typescript
// In store files
setAuthServiceForStore(container.resolve(ServiceTokens.AUTH_SERVICE));
```

## Backend Integration

- **API Base URL**: `http://localhost:8080` (Spring Boot Gateway)
- **Auth Endpoints**: `/api/v1/auth/*`
- **Location Endpoints**: `/api/v1/locations/*`
- **OAuth Callback**: `/login/oauth2/code/google`

## Error Handling

- Global `ErrorBoundary` component
- Service-level error handling with logging
- Store error states with user-friendly messages
- Graceful degradation for service failures

## Performance Considerations

- Dynamic Naver Maps API loading
- Zustand state persistence with selective serialization
- Service singleton patterns in DI container
- Infinite loop prevention in store updates
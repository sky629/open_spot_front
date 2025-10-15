# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React TypeScript frontend application with feature-based architecture, displaying categorized location data on Naver Maps. Features a toggleable sidebar with category filtering, Google OAuth authentication, dependency injection, and Zustand state management with mock-first development strategy.

## Key Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Styled Components
- **State Management**: Zustand with persistence and devtools
- **Architecture**: Feature-based with dependency injection container
- **Authentication**: Google OAuth with JWT tokens
- **Map Integration**: Naver Maps JavaScript API v3
- **HTTP Client**: Axios with secure interceptors
- **Routing**: React Router DOM v7

## Development Commands

### Local Development
```bash
# Install dependencies (uses yarn)
yarn install

# Start development server
yarn dev

# Type checking
yarn type-check

# Linting
yarn lint

# Generate API client from OpenAPI spec
yarn generate:api

# Kill development servers (includes port cleanup)
yarn kill:servers

# Restart development server (kill + start)
yarn restart
```

### Build Commands
```bash
# Fast build (no type checking)
yarn build

# Build with full TypeScript type checking
yarn build:check

# Preview production build
yarn preview
```

### Docker Development
```bash
# Build Docker image
yarn docker:build

# Run production container
yarn docker:run

# Start development environment
yarn docker:dev

# Start production environment
yarn docker:prod

# Stop containers
yarn docker:stop
yarn docker:stop:dev

# View container logs
yarn docker:logs
yarn docker:logs:dev
```

### Deployment
```bash
# Production deployment
yarn deploy
./deploy.sh prod

# Development deployment
yarn deploy:dev
./deploy.sh dev

# Check deployment status
yarn deploy:status
./deploy.sh prod status

# View deployment logs
./deploy.sh prod logs

# Stop deployment
./deploy.sh prod stop

# Clean deployment (remove images)
yarn deploy:clean
./deploy.sh prod clean
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```bash
# Naver Cloud Platform Maps API Key ID (required)
VITE_NAVER_MAP_CLIENT_ID=your_ncp_key_id_here

# Backend API URL (Spring Boot Gateway)
VITE_API_BASE_URL=http://localhost:8080

# Google OAuth Client ID (required for authentication)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here

# OAuth Redirect URI
VITE_OAUTH_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
```

**Important**: As of 2025, legacy AI NAVER API is deprecated. Use Naver Cloud Platform Maps API.

## Architecture Overview

### Feature-Based Structure

```
src/
├── features/          # Feature modules
│   ├── auth/         # Authentication feature
│   │   ├── components/      # Login, ProtectedRoute
│   │   ├── pages/          # LoginPage, LoginErrorPage
│   │   └── services/       # AuthServiceImpl
│   └── map/          # Map feature
│       ├── components/      # MapContainer, LocationMarker, CategoryFilter
│       └── pages/          # MapPage
├── components/        # Shared UI components
│   ├── Sidebar/      # GroupSection, LocationSection, LocationItem
│   └── common/       # CategoryDropdown, SearchableDropdown
├── shared/            # Shared utilities
│   └── components/   # LoadingSpinner, ErrorBoundary
├── api/               # Generated API client (Orval)
│   └── generated/    # Auto-generated from openapi.yaml
├── stores/            # Zustand stores
│   ├── auth/         # Authentication store with service injection
│   ├── location/     # Location store
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

### Dependency Injection Container

The application uses a custom DI container (`src/core/container/Container.ts`):
- Services registered with tokens in `src/core/container/ServiceTokens.ts`
- Supports singleton and factory patterns
- Services injected into stores via `setupStores()`
- Container initialized in `src/setup/serviceRegistration.ts`
- Circular dependency resolution for Auth and API services

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
- Group association (addLocationToGroup, removeLocationFromGroup)

**Group Store** (`src/stores/group/groupStore.ts`):
- Group CRUD operations with backend API
- Group location membership tracking via `locationIds` array
- Backend sync pattern: `updateGroupLocationIds(groupId)` queries actual locations from backend
- UI state management (modals, editing, deletion confirmation)
- Group deletion automatically cleans up location `groupId` references

### Authentication Flow

1. **Login**: Google OAuth redirect → Backend exchange → JWT tokens
2. **Token Storage**: Secure cookie handling via `SecureCookieService`
3. **API Calls**: JWT attached via `SecureApiClient` interceptors
4. **Protected Routes**: `ProtectedRoute` component guards authenticated pages
5. **Token Refresh**: Automatic refresh before expiration

### Application Lifecycle

Entry point: `src/main.tsx` → `NewApp.tsx`

1. **Service Registration**: `registerServices()` sets up DI container with all services
2. **Store Configuration**: `configureStores()` injects services into Zustand stores
3. **Auto-Authentication**: Attempts automatic login from stored credentials
4. **Token Management**: Sets up automatic token refresh intervals
5. **Route Protection**: Authentication checked for protected routes

### Service Registration Process

```typescript
// In src/setup/serviceRegistration.ts
export const initializeApplication = async (): Promise<void> => {
  // 1. Register all services in DI container
  registerServices();

  // 2. Configure stores with injected services
  configureStores();

  // 3. Attempt auto-login from stored credentials
  const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE);
  await authService.attemptAutoLogin();

  // 4. Setup automatic token refresh
  authService.setupAutoTokenRefresh();
};
```

## Key Service Patterns

### API Client Generation with Orval
The application uses **Orval** to auto-generate TypeScript API clients from `openapi.yaml`:
- **Source**: `openapi.yaml` in project root defines all backend endpoints
- **Generation**: `yarn generate:api` creates type-safe clients in `src/api/generated/`
- **Integration**: Services wrap generated clients for additional logic
- **Benefits**: Type safety, automatic updates when backend changes, reduced boilerplate

Example workflow:
```bash
# 1. Backend team updates openapi.yaml
# 2. Run generation command
yarn generate:api

# 3. Generated clients available immediately
import { getLocations } from 'src/api/generated/locations/locations';
```

### Backend API Integration Pattern
All services use backend APIs with fallback to mock data:
```typescript
// locationService.ts pattern
try {
  const response = await locationsApi.getLocations(params);
  if (response.success && response.data) {
    const data = response.data.content || []; // Handle pagination
    return data.map(transformLocationResponse);
  }
} catch (error) {
  logger.error('API error, using mock data', error);
  return MOCK_LOCATIONS; // Graceful fallback
}
```

### Group-Location Synchronization Pattern
Groups track member locations via `locationIds` array, synced with backend:
```typescript
// After adding location to group
await addLocationToGroup({ id: locationId, groupId });

// Sync locationIds from backend (Single Source of Truth)
await updateGroupLocationIds(groupId);
// → Queries GET /api/v1/locations?groupId={groupId}
// → Updates group.locationIds = response.data.map(loc => loc.id)
```

**Why backend sync?**
- Prevents frontend-backend data inconsistency
- No manual array manipulation bugs
- Backend is authoritative for membership

### Sidebar Category System
- **Toggleable UI**: Desktop sidebar, mobile overlay with backdrop
- **Real-time Counts**: Category counts calculated from actual location data
- **Category Constants**: Centralized in `MAP_CATEGORIES` (all, restaurant, cafe, shopping, park)
- **Responsive Design**: Adapts layout for mobile and desktop viewing

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

### Adding New Location Categories
1. Update `MAP_CATEGORIES` in `src/constants/map.ts`
2. Add corresponding `MARKER_ICONS` entry
3. Update mock data in `locationService.ts` with new category
4. Add category label in `MapPage.tsx` categories array

### Adding New Features
1. Create components under appropriate `src/components/` subdirectory
2. Implement service interfaces from `src/core/interfaces/`
3. Register services in DI container if needed
4. Add routes to `NewApp.tsx`
5. Use custom hooks for state management

### Updating OpenAPI Specification
When backend API changes:
1. Get updated `openapi.yaml` from backend team
2. Place in project root (replacing existing)
3. Run `yarn generate:api` to regenerate clients
4. Check `src/api/generated/` for new types/endpoints
5. Update service implementations if needed

### Service Registration
```typescript
// In src/setup/serviceRegistration.ts
container.register(
  SERVICE_TOKENS.AUTH_SERVICE,
  () => {
    const authService = new AuthServiceImpl();
    const apiClient = container.resolve(SERVICE_TOKENS.API_CLIENT);

    // Inject dependencies and resolve circular references
    authService.setApiClient(apiClient);
    apiClient.setAuthService(authService);

    return authService;
  },
  true // singleton
);
```

### Custom Hook Pattern
```typescript
// Location data with category counts
const { locations, locationCounts } = useLocations();

// Map instance management
const { mapRef, map, isLoaded } = useNaverMap({ center, zoom });
```

## Docker & Deployment

### Deployment Script Features
The `deploy.sh` script provides comprehensive deployment management:
- **Multi-environment**: Supports `dev` and `prod` environments
- **Health Checks**: Automatic service health verification
- **Container Management**: Clean startup/shutdown with orphan removal
- **Image Cleanup**: Automatic pruning of old images
- **Logging**: Colored output with status indicators

### Docker Architecture
- **Development**: Hot-reload enabled with volume mounts
- **Production**: Multi-stage build with nginx serving static assets
- **Environment Variables**: Build-time injection via Docker build args
- **Port Configuration**:
  - Development: `localhost:3000` (Vite) + `localhost:80` (nginx)
  - Production: `localhost:80` (nginx only)

### Kill Servers Script
The `scripts/kill-servers.sh` script provides:
- **Docker Container Cleanup**: Stops dev and prod containers
- **Port Cleanup**: Kills processes on ports 80 and 3000
- **Process Management**: Terminates yarn dev, vite, and related node processes
- **Interactive Restart**: Optional prompt to restart development server

## Backend Integration

- **API Base URL**: `http://localhost:8080` (Spring Boot Gateway)
- **Auth Endpoints**: `/api/v1/auth/*`
- **Location Endpoints**: `/api/v1/locations/*`
- **OAuth Callback**: `/login/oauth2/code/google`
- **Environment Variables**: Injected at Docker build time via build args
- **CORS Configuration**: Frontend origin whitelisted for API access

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

## Build System & Scripts

### Build Variants
- **`yarn build`**: Fast production build without TypeScript type checking
- **`yarn build:check`**: Full build with TypeScript compilation and type checking
- **Strategy**: Separate type checking from build for faster CI/CD pipelines

### Script Utilities
- **`scripts/kill-servers.sh`**: Comprehensive development server cleanup
  - Stops Docker containers (dev and prod)
  - Kills processes on ports 80 and 3000
  - Terminates yarn dev, vite, and node processes
  - Interactive restart options

### Docker Build Strategy
- **Multi-stage builds**: Separate build and runtime stages
- **Build arguments**: Environment variables injected at build time
- **Static asset serving**: nginx serves built files efficiently
- **Environment handling**: No .env files copied, all vars via build args

### Development Workflow
1. **Local Development**: Use `yarn dev` for hot-reload
2. **Type Checking**: Run `yarn type-check` before commits
3. **Linting**: Use `yarn lint` to catch code quality issues
4. **Server Cleanup**: Use `yarn kill:servers` to reset development environment
5. **Docker Testing**: Use `yarn docker:dev` to test containerized development
6. **Production Testing**: Use `./deploy.sh prod` to test full deployment
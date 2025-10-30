# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React TypeScript frontend application with feature-based architecture, displaying categorized location data on Naver Maps. Features a toggleable sidebar with category filtering, Google OAuth authentication, dependency injection, and Zustand state management. The application uses Orval for auto-generating type-safe API clients from OpenAPI specifications, enabling rapid feature development without manual API client boilerplate.

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

# Watch and type-check during development
yarn type-check  # Run in separate terminal while developing
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
- Location data management with real-time counts
- Map bounds and filtering
- CRUD operations for locations
- Group association (addLocationToGroup, removeLocationFromGroup)
- Map navigation control:
  - `setSelectedLocation`: Select location without map panning
  - `focusLocationOnMap`: Select location with map pan animation
  - `shouldFocusOnMap` flag: Controls automatic map panning behavior

**Group Store** (`src/stores/group/groupStore.ts`):
- Group CRUD operations with backend API
- Group location membership tracking via `locationIds` array
- Backend sync pattern: `updateGroupLocationIds(groupId)` queries actual locations from backend
- UI state management (modals, editing, deletion confirmation)
- Group deletion automatically cleans up location `groupId` references

### Authentication Flow

1. **Login**: Google OAuth redirect → Backend OAuth2 exchange → HttpOnly Cookies
2. **Token Storage**: **HttpOnly Cookies** (secure, HTTP-only flag) handled by backend
3. **API Calls**: Cookies automatically attached to all requests (no manual header insertion needed)
4. **Protected Routes**: `ProtectedRoute` component guards authenticated pages
5. **Token Refresh**: Backend automatically refreshes tokens via `Set-Cookie` header on each API response
   - No manual token refresh logic needed on frontend
   - Backend manages refresh token lifecycle

**Key Point**: This is a **Hybrid Token approach** using HttpOnly Cookies. The backend handles all token management, making the frontend stateless regarding token handling.

### Application Lifecycle

Entry point: `src/main.tsx` → `NewApp.tsx`

1. **Service Registration**: `registerServices()` sets up DI container with all services
2. **Store Configuration**: `configureStores()` injects services into Zustand stores
3. **Auto-Authentication**: Attempts automatic login using existing HttpOnly cookies
4. **Token Management**: Backend handles all token refresh (no frontend setup needed)
5. **Route Protection**: Authentication checked for protected routes via cookie validity

### Service Registration Process

The `src/setup/serviceRegistration.ts` file handles all service registration and configuration:

```typescript
export const registerServices = (): void => {
  // Register services as singletons in DI container
  container.register(SERVICE_TOKENS.COOKIE_SERVICE, () => new SecureCookieService(), true);
  container.register(SERVICE_TOKENS.AUTH_SERVICE, () => new AuthServiceImpl(), true);
  container.register(SERVICE_TOKENS.LOCATION_SERVICE, () => new LocationService(), true);
  container.register(SERVICE_TOKENS.GROUP_SERVICE, () => new GroupService(), true);
  container.register(SERVICE_TOKENS.CATEGORY_SERVICE, () => new CategoryService(), true);
  // ... etc
};

export const configureStores = (): void => {
  // Inject resolved services into Zustand stores
  const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE);
  setupStores({ authService, locationService, groupService, categoryService });
};

export const initializeApplication = async (): Promise<void> => {
  registerServices();
  configureStores();

  // Attempt auto-login from existing HttpOnly cookies
  const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE);
  await authService.attemptAutoLogin();
};
```

**Important**: All services are singletons. Registration includes prevention of duplicate registration via `isServiceRegistered` flag.

## Key Service Patterns

### API Client Generation with Orval (Recent Migration)
The application uses **Orval** to auto-generate TypeScript API clients from `openapi.yaml`:
- **Source**: `openapi.yaml` in project root defines all backend endpoints
- **Configuration**: `orval.config.ts` specifies Axios as the HTTP client and enables automatic code generation
- **Generation**: `yarn generate:api` creates type-safe clients in `src/api/generated/`
- **Integration**: Services use generated clients directly (wrapped Orval clients from `src/api/axios-instance.ts`)
- **Benefits**:
  - Type safety for all API requests/responses
  - Automatic updates when backend OpenAPI spec changes
  - Reduced manual boilerplate
  - Automatic prettier formatting after generation

**Workflow**:
1. Backend team updates `openapi.yaml` with new endpoints/schemas
2. Run `yarn generate:api` (regenerates all clients in `src/api/generated/`)
3. TypeScript types and API functions automatically available
4. Service implementations use generated clients directly

**Example**:
```typescript
// In locationService.ts
import { getLocations as getLocationsApi } from 'src/api/generated/locations/locations';

// Use generated type-safe function
const response = await getLocationsApi({
  groupId: '123',  // TypeScript auto-completes available params
  page: 0,
  size: 20
});

// Response is fully typed as LocationPageResponse
const locations = response.data?.content || [];
```

**Note**: Generated files should never be manually edited. They're auto-generated from the OpenAPI spec.

### Backend API Integration Pattern
All services use Orval-generated API clients with graceful fallback to mock data:

```typescript
// In src/services/locationService.ts (using Orval)
import { getLocations as getLocationsApi } from 'src/api/generated/locations/locations';

export async function fetchLocations(params: ILocationParams): Promise<LocationResponse[]> {
  try {
    // Call Orval-generated function (fully typed)
    const response = await getLocationsApi({
      northEastLat: params.bounds?.northEast.lat,
      northEastLon: params.bounds?.northEast.lng,
      southWestLat: params.bounds?.southWest.lat,
      southWestLon: params.bounds?.southWest.lng,
      categoryId: params.category,
      groupId: params.groupId,
      page: params.page,
      size: params.pageSize,
    });

    if (response.success && response.data) {
      // Backend returns { content: Location[], page: PageInfo }
      const data = response.data.content || [];
      return data.map(transformLocationResponse);
    }
  } catch (error) {
    logger.error('API error, using mock data', error);
  }

  // Graceful fallback to mock data
  return MOCK_LOCATIONS;
}
```

**Key Points**:
- Orval generates all API functions in `src/api/generated/`
- Generated types are fully TypeScript-strict
- Backend response shape: `{ success: boolean, data: T, error: null }`
- Pagination handled via `.data.content` (destructure pagination data from `.data.page`)
- All services gracefully fall back to mock data on API failure

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

**Important**: Avoid calling `fetchGroups()` in modals or components that display group counts. The `fetchGroups()` API call returns groups without `locationIds`, which resets the count to 0. Instead, use the groups already in the store, which have been properly synchronized with `updateGroupLocationIds()`.

### Sidebar System
- **Toggleable UI**: Desktop sidebar, mobile overlay with backdrop
- **Real-time Counts**: Both category and location counts displayed in sidebar headers
  - Groups: `그룹명 (개수)` format
  - Locations: `내 장소들 (개수)` format
- **Category Filtering**: Dropdown in top navigation bar
- **Category Constants**: Centralized in `MAP_CATEGORIES` (all, restaurant, cafe, shopping, park)
- **Responsive Design**: Adapts layout for mobile and desktop viewing

### Map Navigation Features
- **Location Focus**: "지도에서 보기" button in location details pans map to location
  - Uses `focusLocationOnMap()` action with `shouldFocusOnMap` flag
  - Prevents automatic panning on marker clicks (only shows info window)
  - Smooth 500ms animation with zoom level 15 for detail view
- **Map Controls**: Positioned at top center of map
  - Shows current location count: "📍 N개 저장"
  - Loading indicator during data fetch

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

### Adding New API Endpoints (with Orval)
When backend adds new endpoints:
1. **Backend team updates** `openapi.yaml` (or you receive the updated spec)
2. **Place spec** in project root: `./openapi.yaml`
3. **Regenerate clients**: `yarn generate:api`
4. **Check generated files** in `src/api/generated/` for new functions/types
5. **Use in services**: Import and call generated functions in service implementations
6. **Type-safety**: No manual types needed—Orval creates them automatically

**No manual API client writing needed!**

### Adding New Location Categories
1. Update `MAP_CATEGORIES` in `src/constants/map.ts`
2. Add corresponding `MARKER_ICONS` entry
3. Update mock data in `src/services/locationService.mockData.ts` with new category
4. Category filter in `CategoryFilter.tsx` auto-includes all categories from `MAP_CATEGORIES`

### Adding New Features
1. **Feature structure**: Create `src/features/featureName/` with `components/`, `pages/`, `services/` subdirectories
2. **Service interface**: Define interface in `src/core/interfaces/IFeatureService.ts`
3. **Service implementation**: Create service in `src/services/featureService.ts`
4. **DI registration**: Add to `src/setup/serviceRegistration.ts` with service token in `SERVICE_TOKENS`
5. **Store creation**: Create Zustand store in `src/stores/featureName/`
6. **Store injection**: Configure in `setupStores()` function
7. **Add routes**: Register in `NewApp.tsx` routing configuration

### Updating OpenAPI Specification
This is now fully automated:
1. Backend team updates `openapi.yaml` (or sends the updated spec file)
2. Replace existing `./openapi.yaml` in project root
3. Run `yarn generate:api` - this auto-generates everything
4. All API client functions and types are ready to use immediately
5. No manual updates to service files needed if spec schema structure doesn't change

### Service Registration
Register services in `src/setup/serviceRegistration.ts`:

```typescript
// Simple service registration (no dependencies)
container.register(
  SERVICE_TOKENS.CATEGORY_SERVICE,
  () => new CategoryService(),
  true // singleton
);

// Service with Orval-generated client
container.register(
  SERVICE_TOKENS.LOCATION_SERVICE,
  () => new LocationService(),
  true // singleton - Orval client is used internally
);

// Services are registered ONCE with a flag to prevent double registration
if (!isServiceRegistered) {
  registerServices();  // Safe to call multiple times
  isServiceRegistered = true;
}
```

**Key Patterns**:
- All services are **singletons** (third parameter `true`)
- Services use **Orval-generated clients internally** (no need to pass API client)
- Duplicate registration prevented via `isServiceRegistered` flag
- Circular dependencies resolved via direct imports (not DI)

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

- **Dynamic Naver Maps API loading**: Loaded on-demand via `NaverMapLoader`, not at app startup
- **Zustand state persistence**: Auth store uses browser storage with selective serialization (only essential auth data)
- **Service singleton patterns**: DI container ensures single instance per service (no duplicate API calls)
- **Infinite loop prevention**: Zustand stores use state equality checks (`isEqual`) to avoid redundant updates
- **API response handling**:
  - Graceful fallback to mock data prevents app crashes on API failures
  - Pagination handled efficiently via `.data.content` destructuring
  - No unnecessary refetches due to condition checks in service implementations

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

## Common Development Scenarios

### Scenario: Adding a new API endpoint

1. Backend team updates `openapi.yaml` with new endpoint
2. You receive the updated spec file
3. Replace `./openapi.yaml` in project root
4. Run `yarn generate:api`
5. Check `src/api/generated/` for new generated functions
6. Use the generated function in your service:
   ```typescript
   import { newEndpointFunction } from 'src/api/generated/resource/resource';

   export async function callNewEndpoint(params) {
     const response = await newEndpointFunction(params);
     return response.data;
   }
   ```

### Scenario: Fixing an API pagination issue

Common issue: `forEach is not a function` when iterating over API response

```typescript
// ❌ Wrong - assumes response.data is array
const locations = response.data.forEach(...);  // Error!

// ✅ Correct - extract content array first
const data = response.data as unknown as { content?: LocationResponse[]; page?: unknown };
const locations = data.content || [];  // Now safe to iterate
```

### Scenario: Debugging store updates not reflecting in UI

Check `src/stores/location/locationStore.ts`:
```typescript
// Stores use state equality checks to prevent infinite loops
set((state) => ({
  ...state,
  locations: updatedLocations
  // Only updates if deep equality check passes
}));
```

If UI doesn't update after store change:
1. Verify the store is being called (check console logs)
2. Check if state actually changed (compare old vs new values)
3. Use React DevTools to inspect store state
4. Ensure component is subscribed to store with `useShallow` hook if needed

### Scenario: Orval regeneration broke imports

If after running `yarn generate:api` imports break:
1. Delete `src/api/generated/` directory
2. Run `yarn generate:api` again
3. Check file structure matches expected paths in `orval.config.ts`
4. Update service imports if file locations changed

## Important Patterns to Remember

### 1. State Synchronization with Backend
**Never trust frontend state alone**—always query backend after mutations:
```typescript
// ❌ Don't do this:
addLocationToGroup(id, groupId);  // Just mutate state

// ✅ Do this:
addLocationToGroup(id, groupId);
await updateGroupLocationIds(groupId);  // Sync with backend
```

### 2. Error Handling
All services should gracefully degrade:
```typescript
try {
  const response = await apiFunction();
  return response.data;
} catch (error) {
  logger.error('Operation failed', error);
  return MOCK_DATA;  // Fallback
}
```

### 3. Service Registration is Idempotent
You can call `registerServices()` multiple times safely:
```typescript
// These are all safe - prevented by isServiceRegistered flag
registerServices();
registerServices();
registerServices();

// Only the first one actually registers, others are skipped
```

### 4. HttpOnly Cookies
- Cookies are automatically attached to all API requests
- You don't need to manually add auth headers
- Backend handles token refresh via `Set-Cookie` headers
- Frontend doesn't need token refresh logic
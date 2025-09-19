# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React TypeScript frontend application built with Vite that displays location data on a Naver Map. The application fetches GPS coordinates from a backend API and displays them as interactive markers on the map.

## Key Technologies

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Styled-components
- **Map Integration**: Naver Maps API
- **HTTP Client**: Axios
- **State Management**: React Hooks (useState, useEffect)

## Development Commands

### Installation and Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set your Naver Map API client ID:
   ```
   NAVER_MAP_CLIENT_ID=your_naver_map_client_id_here
   API_BASE_URL=http://localhost:8000/
   ```

## Project Architecture

### Core Structure
```
src/
├── components/          # Reusable UI components
│   ├── Map/            # Map-related components
│   │   ├── MapContainer.tsx    # Main map wrapper
│   │   └── LocationMarker.tsx  # Individual location markers
│   └── UI/             # General UI components
├── pages/              # Page components
│   └── MainPage.tsx    # Main application page
├── services/           # API communication layer
│   ├── api.ts          # Base API client with interceptors
│   └── locationService.ts # Location-specific API calls
├── hooks/              # Custom React hooks
│   ├── useLocations.ts # Location data management
│   └── useNaverMap.ts  # Naver Map instance management
├── types/              # TypeScript type definitions
│   ├── naver-maps.d.ts # Naver Maps API types
│   └── api.ts          # API response types
├── constants/          # Application constants
│   ├── map.ts          # Map configuration and markers
│   └── api.ts          # API endpoints and config
└── utils/              # Utility functions
    └── loadNaverMaps.ts # Dynamic Naver Maps API loading
```

### Key Components

**MapContainer**: Main map component that:
- Initializes Naver Map using custom hook
- Loads location data from backend API
- Renders location markers dynamically
- Handles map events (bounds change, marker clicks)
- Provides responsive design for mobile devices

**LocationMarker**: Individual marker component that:
- Creates Naver Map markers for each location
- Handles marker click events and info windows
- Supports custom icons based on location category
- Manages marker lifecycle (creation/destruction)

**useNaverMap**: Custom hook for map management:
- Dynamically loads Naver Maps API with environment variables
- Initializes map instance with configuration
- Provides map control methods (setCenter, setZoom, getBounds)
- Handles map lifecycle and cleanup

**useLocations**: Custom hook for location data:
- Fetches locations from backend API
- Manages loading states and error handling
- Supports filtering by map bounds and category
- Provides refresh and update methods

### API Integration

The application expects a backend API with the following endpoints:

```typescript
GET /api/locations - Fetch all locations
GET /api/locations/:id - Fetch specific location
POST /api/locations - Create new location
PUT /api/locations/:id - Update location
DELETE /api/locations/:id - Delete location
```

Location data structure:
```typescript
interface LocationResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: string;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Development Patterns

**Component Organization**: Components follow a clear separation of concerns:
- Presentational components for UI rendering
- Container components for data fetching and state management
- Custom hooks for reusable logic

**Type Safety**: Comprehensive TypeScript typing:
- API response interfaces
- Naver Maps API type definitions
- Component prop interfaces
- Custom hook return types

**Error Handling**: Robust error management:
- API service layer with interceptors
- Loading states and error boundaries
- User-friendly error messages
- Graceful degradation when map fails to load

**Performance Optimization**:
- Dynamic loading of Naver Maps API
- Efficient re-rendering with React.memo and useCallback
- Responsive design with CSS media queries
- Marker clustering for large datasets (ready for implementation)

### Map Features

**Default Configuration**:
- Center: Seoul City Hall (37.5665, 126.9780)
- Default zoom level: 13
- Enabled controls: scale, logo, map type, zoom

**Marker Categories**:
- Default, Restaurant, Cafe, Shopping, Park
- Custom icons supported per category
- Info windows with location details

**Responsive Design**:
- Mobile-optimized layout
- Touch-friendly controls
- Adaptive info panel positioning

## Testing the Application

1. Ensure backend API is running on configured port
2. Set up environment variables with valid Naver Map API key
3. Start development server: `npm run dev`
4. Navigate to `http://localhost:3000`
5. Verify map loads and displays location markers from API

## Common Development Tasks

### Adding New Location Categories
1. Update `MAP_CATEGORIES` in `src/constants/map.ts`
2. Add corresponding icon in `MARKER_ICONS`
3. Update category filter in `MainPage.tsx`

### Customizing Map Appearance
1. Modify map options in `useNaverMap` hook
2. Update map controls and styling in `MapContainer`
3. Adjust responsive breakpoints in styled-components

### API Integration Changes
1. Update type definitions in `src/types/api.ts`
2. Modify service methods in `src/services/locationService.ts`
3. Update component state management accordingly
# Frontend API Integration Guide - Location Service

## Problem Summary

The location service bounds filtering was not working because the frontend was sending **nested query parameters** while the backend expected **flat query parameters**.

**Frontend (Incorrect):**
```
bounds[northEast][lat]=37.4380038&bounds[northEast][lng]=127.2478434&bounds[southWest][lat]=37.3339338&bounds[southWest][lng]=127.1384951
```

**Backend (Expected):**
```
northEastLat=37.4380038&northEastLng=127.2478434&southWestLat=37.3339338&southWestLng=127.1384951
```

## Fixed: Correct API Parameter Format

### 1. Map Bounds Search (지도 영역 검색)

**Endpoint**: `GET /api/v1/locations`

**Query Parameters** (Flat Structure):
```
northEastLat=<double>      # Northeast corner latitude (-90 to 90)
northEastLng=<double>      # Northeast corner longitude (-180 to 180)
southWestLat=<double>      # Southwest corner latitude (-90 to 90)
southWestLng=<double>      # Southwest corner longitude (-180 to 180)
categoryId=<uuid>          # (Optional) Filter by category
groupId=<uuid>             # (Optional) Filter by group
page=<int>                 # (Optional) Page number (default: 0)
size=<int>                 # (Optional) Page size (default: 20)
```

**Example URL:**
```
https://api.kang-labs.com/api/v1/locations?northEastLat=37.4380038&northEastLng=127.2478434&southWestLat=37.3339338&southWestLng=127.1384951&page=0&size=20
```

**TypeScript Example:**
```typescript
// Correct way to call bounds search
async function searchLocationsByBounds(
  northEastLat: number,
  northEastLng: number,
  southWestLat: number,
  southWestLng: number,
  categoryId?: string,
  groupId?: string
) {
  const params = new URLSearchParams();
  params.append('northEastLat', northEastLat.toString());
  params.append('northEastLng', northEastLng.toString());
  params.append('southWestLat', southWestLat.toString());
  params.append('southWestLng', southWestLng.toString());

  if (categoryId) params.append('categoryId', categoryId);
  if (groupId) params.append('groupId', groupId);

  const response = await fetch(`https://api.kang-labs.com/api/v1/locations?${params}`);
  return response.json();
}

// Usage with map viewport
const bounds = map.getBounds();
const response = await searchLocationsByBounds(
  bounds.getNorthEast().lat(),
  bounds.getNorthEast().lng(),
  bounds.getSouthWest().lat(),
  bounds.getSouthWest().lng()
);
```

**React Query Example:**
```typescript
import { useQuery } from '@tanstack/react-query';

interface MapBounds {
  northEastLat: number;
  northEastLng: number;
  southWestLat: number;
  southWestLng: number;
}

function useLocationsByBounds(bounds: MapBounds, options = {}) {
  return useQuery({
    queryKey: ['locations', bounds],
    queryFn: async () => {
      const params = new URLSearchParams({
        northEastLat: bounds.northEastLat.toString(),
        northEastLng: bounds.northEastLng.toString(),
        southWestLat: bounds.southWestLat.toString(),
        southWestLng: bounds.southWestLng.toString()
      });

      const response = await fetch(
        `https://api.kang-labs.com/api/v1/locations?${params}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    },
    ...options
  });
}

// Usage in map component
function MapComponent() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { data } = useLocationsByBounds(bounds!, { enabled: !!bounds });

  const handleMapBoundsChanged = (newBounds: google.maps.LatLngBounds) => {
    setBounds({
      northEastLat: newBounds.getNorthEast().lat(),
      northEastLng: newBounds.getNorthEast().lng(),
      southWestLat: newBounds.getSouthWest().lat(),
      southWestLng: newBounds.getSouthWest().lng()
    });
  };

  return (
    <GoogleMap
      onBoundsChanged={handleMapBoundsChanged}
      // ... other props
    >
      {data?.content.map(location => (
        <Marker key={location.id} position={{ lat: location.latitude, lng: location.longitude }} />
      ))}
    </GoogleMap>
  );
}
```

---

### 2. Radius Search (반경 검색)

**Query Parameters** (Flat Structure):
```
latitude=<double>          # Center point latitude (-90 to 90)
longitude=<double>         # Center point longitude (-180 to 180)
radiusMeters=<double>      # Search radius in meters (100 to 50000)
categoryId=<uuid>          # (Optional) Filter by category
groupId=<uuid>             # (Optional) Filter by group
page=<int>                 # (Optional) Page number (default: 0)
size=<int>                 # (Optional) Page size (default: 20)
```

**Example URL:**
```
https://api.kang-labs.com/api/v1/locations?latitude=37.3859999&longitude=127.1931904&radiusMeters=2000
```

---

### 3. Other Search Methods

**Keyword Search** (키워드 검색):
```
keyword=<string>           # Search across name, description, address
categoryId=<uuid>          # (Optional)
groupId=<uuid>             # (Optional)
page=<int>                 # (Optional)
size=<int>                 # (Optional)
```

**Category Filter** (카테고리 필터):
```
categoryId=<uuid>          # Filter by category
sortBy=RATING|CREATED_AT   # (Optional) Sort order
page=<int>                 # (Optional)
size=<int>                 # (Optional)
```

**Group Filter** (그룹 필터):
```
groupId=<uuid>             # Filter by group
sortBy=RATING|CREATED_AT   # (Optional) Sort order
page=<int>                 # (Optional)
size=<int>                 # (Optional)
```

**Default Sorting** (기본 정렬):
```
sortBy=RATING              # Sort by highest rating
  or
sortBy=CREATED_AT          # Sort by most recent (default)
page=<int>                 # (Optional)
size=<int>                 # (Optional)
```

---

## Query Parameter Priority (우선순위)

The API uses the following priority order:

1. **Bounds Search** (지도 영역) - Highest priority
   - Requires: `northEastLat`, `northEastLng`, `southWestLat`, `southWestLon`

2. **Radius Search** (반경 검색)
   - Requires: `latitude`, `longitude`, `radiusMeters`

3. **Group Filter** (그룹 필터)
   - Requires: `groupId`

4. **Category Filter** (카테고리 필터)
   - Requires: `categoryId`

5. **Keyword Search** (키워드 검색)
   - Requires: `keyword`

6. **Default Sorting** (기본 정렬) - Lowest priority
   - Optional: `sortBy` (RATING or CREATED_AT)

**Example**: If both `bounds` and `radius` are provided, the **bounds search takes priority**.

---

## Response Format

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "userId": "uuid",
        "name": "string",
        "description": "string | null",
        "address": "string | null",
        "categoryId": "uuid",
        "category": {
          "id": "uuid",
          "name": "string",
          "icon": "string"
        },
        "latitude": 37.123456,
        "longitude": 127.123456,
        "rating": 4.5,
        "review": "string | null",
        "tags": ["string"],
        "isFavorite": false,
        "groupId": "uuid | null",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "distance": 1250.5  # Only included if radius search provided
      }
    ],
    "totalElements": 45,
    "totalPages": 3,
    "currentPage": 0,
    "pageSize": 20,
    "hasNextPage": true
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_BOUNDS",
    "message": "위도는 -90도 이상 90도 이하여야 합니다"
  }
}
```

---

## Common Issues & Solutions

### Issue: Getting all locations instead of filtered results

**Cause**: Parameters not being sent in flat format

**Solution**: Change from nested structure to flat parameters
```typescript
// ❌ WRONG
const params = {
  bounds: {
    northEast: { lat: 37.4, lng: 127.2 },
    southWest: { lat: 37.3, lng: 127.1 }
  }
};

// ✅ CORRECT
const params = {
  northEastLat: 37.4,
  northEastLng: 127.2,
  southWestLat: 37.3,
  southWestLng: 127.1
};
```

### Issue: 401 Unauthorized

**Solution**: Include Bearer token in Authorization header
```typescript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Issue: 400 Bad Request with validation error

**Solution**: Validate parameter ranges:
- Latitude: -90 to 90
- Longitude: -180 to 180
- Radius: 100 to 50000 meters

```typescript
function isValidBounds(northEastLat: number, northEastLng: number, southWestLat: number, southWestLng: number): boolean {
  return (
    northEastLat >= -90 && northEastLat <= 90 &&
    northEastLng >= -180 && northEastLng <= 180 &&
    southWestLat >= -90 && southWestLat <= 90 &&
    southWestLng >= -180 && southWestLng <= 180 &&
    southWestLat <= northEastLat &&  // Southwest should be south of northeast
    southWestLng <= northEastLng     // Southwest should be west of northeast
  );
}
```

---

## Testing the Fix

**Step 1**: Open browser DevTools → Network tab

**Step 2**: Call the bounds search with flat parameters:
```
https://api.kang-labs.com/api/v1/locations?northEastLat=37.4380038&northEastLng=127.2478434&southWestLat=37.3339338&southWestLng=127.1384951
```

**Step 3**: Verify the response contains only locations within the specified bounds

**Expected Result**: Location count should be significantly less than the total number of user's locations

---

## References

- **Controller**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/controller/LocationController.kt`
- **Request DTO**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/controller/dto/request/LocationRequest.kt` (lines 105-158)
- **Service**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/service/LocationApplicationService.kt`
- **Repository**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/repository/LocationJpaRepositoryImpl.kt`

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all required parameters are present and valid
3. Check the Authorization token is correctly set
4. Enable logging in the backend to see which query is being executed

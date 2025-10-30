# Location Bounds Filtering - Issue Analysis & Fix

## 📋 Issue Description

**Problem**: The location service is returning all user locations instead of filtering by the map bounds specified in the query parameters.

**Frontend Request**:
```
https://api.kang-labs.com/api/v1/locations?bounds[northEast][lat]=37.4380038&bounds[northEast][lng]=127.2478434&bounds[southWest][lat]=37.3339338&bounds[southWest][lng]=127.1384951
```

**Expected Result**: Only locations within the specified geographic bounds

**Actual Result**: All user locations returned (no filtering applied)

---

## 🔍 Root Cause Analysis

### Parameter Binding Mismatch

The issue is a **parameter binding mismatch** between the frontend URL format and the backend DTO structure:

#### Frontend sends (nested structure):
```
bounds[northEast][lat]=value
bounds[northEast][lng]=value
bounds[southWest][lat]=value
bounds[southWest][lng]=value
```

#### Backend expects (flat parameters):
```
northEastLat=value
northEastLng=value
southWestLat=value
southWestLng=value
```

### Why This Causes "No Filtering"

1. **Spring parameter binding fails**: The nested structure `bounds[northEast][lat]` doesn't match the flat DTO fields
2. **All bounds fields become `null`**: Since binding fails, the bounds parameters remain `null`
3. **Controller detection fails**: The `request.hasBounds()` check (line 58 in LocationController) returns `false` because all fields are `null`
4. **Fallback to default query**: The controller falls through to the `else` branch (lines 95-100)
5. **Returns all locations**: The fallback queries `getRecentLocations()` or `getTopRatedLocations()` return all user locations without bounds filtering

### Flow Diagram

```
Frontend Request (nested structure)
           ↓
Spring @ModelAttribute Binding
           ↓
❌ Binding fails (structure mismatch)
           ↓
All bounds fields = null
           ↓
request.hasBounds() returns false
           ↓
Falls through to else branch (line 95)
           ↓
Returns ALL locations ← PROBLEM!
```

---

## ✅ The Solution

### Change Frontend to Use Flat Parameters

Modify the frontend to send flat query parameters that match the backend DTO structure:

**Correct URL Format**:
```
https://api.kang-labs.com/api/v1/locations?northEastLat=37.4380038&northEastLng=127.2478434&southWestLat=37.3339338&southWestLng=127.1384951
```

### How It Will Work (After Fix)

```
Frontend Request (flat structure)
           ↓
Spring @ModelAttribute Binding
           ↓
✅ Binding succeeds (structure matches)
           ↓
Bounds fields populated correctly
           ↓
request.hasBounds() returns true
           ↓
Calls searchLocationsByBounds()
           ↓
Executes PostGIS ST_MakeEnvelope query
           ↓
Returns ONLY locations within bounds ← FIXED!
```

---

## 🏗️ Backend Architecture (Verified Correct)

### 1. Controller Layer
**File**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/controller/LocationController.kt` (lines 56-101)

```kotlin
@GetMapping
fun getLocations(
    @RequestHeader("X-User-Id") userId: String,
    @ModelAttribute request: LocationSearchRequest,  // Expects flat parameters
    @PageableDefault(size = 20) pageable: Pageable
) {
    val locationPage = when {
        request.hasBounds() -> {  // ← Checks if bounds exist
            locationApplicationService.searchLocationsByBounds(
                userId = targetUserId,
                northEastLat = request.northEastLat!!,
                northEastLon = request.northEastLon!!,
                southWestLat = request.southWestLat!!,
                southWestLon = request.southWestLon!!,
                categoryId = request.categoryId,
                groupId = request.groupId,
                pageable = pageable
            )
        }
        // ... other search methods
        else -> {
            // Fallback: return all locations
        }
    }
}
```

### 2. Request DTO
**File**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/controller/dto/request/LocationRequest.kt` (lines 105-158)

```kotlin
data class LocationSearchRequest(
    // Bounds parameters (FLAT structure - expected by backend)
    val northEastLat: Double? = null,
    val northEastLon: Double? = null,
    val southWestLat: Double? = null,
    val southWestLon: Double? = null,

    // Other parameters
    val categoryId: UUID? = null,
    val groupId: UUID? = null,
    val keyword: String? = null,
    val sortBy: LocationSortBy? = null,
    val targetUserId: UUID? = null
) {
    fun hasBounds(): Boolean {
        return northEastLat != null && northEastLon != null &&
               southWestLat != null && southWestLon != null
    }
}
```

### 3. Repository Layer (PostGIS Query)
**File**: `msa-modules/5-location-service/src/main/kotlin/com/kangpark/openspot/location/repository/jpa/LocationJpaRepositoryImpl.kt` (lines 112-195)

```kotlin
override fun findByCoordinatesWithinBoundsDynamic(
    userId: UUID,
    northEastLat: Double,
    northEastLon: Double,
    southWestLat: Double,
    southWestLon: Double,
    categoryId: UUID?,
    groupId: UUID?,
    pageable: Pageable
): Page<LocationJpaEntity> {
    // Create bounding box using PostGIS ST_MakeEnvelope
    val querySql = """
        SELECT * FROM location.locations l
        WHERE l.user_id = :userId
          AND l.is_active = true
          AND ST_Contains(
                ST_MakeEnvelope(:southWestLon, :southWestLat, :northEastLon, :northEastLat, 4326),
                l.coordinates
              )
        ORDER BY l.created_at DESC
    """

    // Execute query with pagination
}
```

**Key Points**:
- ✅ Uses `ST_MakeEnvelope` to create rectangular bounding box
- ✅ Uses `ST_Contains` to check if points fall within bounds
- ✅ SRID 4326 = WGS84 (standard lat/lng coordinates)
- ✅ Properly handles pagination
- ✅ Supports optional filters (categoryId, groupId)

---

## 📝 Implementation Checklist

### Frontend Changes Required

- [ ] Find the API call that searches locations by bounds
- [ ] Change from nested parameter format to flat format
- [ ] Update parameter names:
  - [ ] `bounds.northEast.lat` → `northEastLat`
  - [ ] `bounds.northEast.lng` → `northEastLng`
  - [ ] `bounds.southWest.lat` → `southWestLat`
  - [ ] `bounds.southWest.lng` → `southWestLng`
- [ ] Test the API call with new parameters
- [ ] Verify only locations within bounds are returned

### Testing Steps

1. **Before Fix**:
   - Request with nested parameters
   - Observe: Returns 100% of all locations

2. **After Fix**:
   - Request with flat parameters
   - Observe: Returns only ~10-20% of locations within bounds
   - Monitor network tab to verify parameters are correct

3. **Verify Backend Query**:
   - Add logging: `System.out.println("Bounds: $northEastLat, $northEastLon, $southWestLat, $southWestLon")`
   - Confirm all 4 bounds parameters are NOT null
   - Verify PostGIS query executes (not the fallback query)

---

## 📚 Reference Documentation

See `FRONTEND_API_INTEGRATION.md` for:
- Complete API parameter specifications
- TypeScript/React Query examples
- Common issues and solutions
- How to test the fix

---

## 🎯 Expected Outcome

Once the frontend sends flat parameters:

**Current Behavior** (WRONG):
```
Request: bounds[northEast][lat]=37.438...
Response: { "content": [location1, location2, ..., location100], ... }  ← ALL locations
```

**Fixed Behavior** (CORRECT):
```
Request: northEastLat=37.438&northEastLng=127.247&southWestLat=37.333&southWestLng=127.138
Response: { "content": [location15, location42, location88], ... }  ← Only within bounds
```

---

## ❓ FAQ

**Q: Do I need to change the backend?**
A: No! The backend is already correct. Only the frontend needs to change.

**Q: Will this break existing functionality?**
A: No. The flat parameters are what the backend always expected.

**Q: What's the priority order if multiple search types are provided?**
A: Bounds > Radius > Group > Category > Keyword > Default Sort

**Q: Can I test this locally?**
A: Yes! Use the corrected URL format in your browser or Postman:
```
http://localhost:8082/api/v1/locations?northEastLat=37.438&northEastLng=127.247&southWestLat=37.333&southWestLng=127.138
```

---

## 📞 Support

If bounds filtering still doesn't work after applying the fix:

1. Check browser DevTools → Network tab
2. Verify the URL shows flat parameters (not nested)
3. Confirm Authorization header is present
4. Check the response includes `data.content` with filtered locations
5. Enable backend logging to see which query method is being called

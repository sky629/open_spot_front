# Quick Fix: Location Bounds Search

## ⚡ TL;DR

**Problem**: Bounds search returns all locations instead of filtering.

**Cause**: Frontend sends nested parameters, backend expects flat parameters.

**Fix**: Change frontend URL format from this:
```
bounds[northEast][lat]=37.4&bounds[northEast][lng]=127.2&bounds[southWest][lat]=37.3&bounds[southWest][lng]=127.1
```

To this:
```
northEastLat=37.4&northEastLng=127.2&southWestLat=37.3&southWestLng=127.1
```

---

## 🔧 Frontend Code Change

### Before (❌ Wrong)
```typescript
// Creates nested parameters
const params = {
  bounds: {
    northEast: { lat: 37.4, lng: 127.2 },
    southWest: { lat: 37.3, lng: 127.1 }
  }
};
```

### After (✅ Correct)
```typescript
// Flat parameters
const params = {
  northEastLat: 37.4,
  northEastLng: 127.2,
  southWestLat: 37.3,
  southWestLng: 127.1
};
```

---

## 🎯 Parameter Reference

| Param | Type | Range | Required | Description |
|-------|------|-------|----------|-------------|
| `northEastLat` | number | -90 to 90 | ✅ Yes | Latitude of NE corner |
| `northEastLng` | number | -180 to 180 | ✅ Yes | Longitude of NE corner |
| `southWestLat` | number | -90 to 90 | ✅ Yes | Latitude of SW corner |
| `southWestLng` | number | -180 to 180 | ✅ Yes | Longitude of SW corner |
| `categoryId` | UUID | - | ❌ No | Filter by category |
| `groupId` | UUID | - | ❌ No | Filter by group |

---

## 📝 Test in Browser

Paste this URL in your browser (after login):
```
https://api.kang-labs.com/api/v1/locations?northEastLat=37.4380038&northEastLng=127.2478434&southWestLat=37.3339338&southWestLng=127.1384951
```

**If fixed correctly**, you should see far fewer locations than your total (only those within bounds).

---

## 📚 More Info

- Full API docs: See `FRONTEND_API_INTEGRATION.md`
- Technical details: See `BOUNDS_FILTERING_FIX_SUMMARY.md`

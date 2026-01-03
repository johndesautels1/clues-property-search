# CLUES Property Dashboard - Session Summary

**Date:** November 24, 2025
**Repository:** https://github.com/johndesautels1/clues-property-search
**Vercel Deployment:** https://clues-property-search1.vercel.app
**Local Dev:** http://localhost:5173

---

## Current Status

### ✅ What Works
1. **Upload CSV Feature** - Fully functional
   - Supports 110-field definition format (Field, Name, Value columns)
   - Supports standard multi-property CSV format
   - Auto-detects format
   - Imports to property list

2. **Manual Property Entry** - Working
   - Add single properties with basic fields
   - Saves to Zustand store

3. **Property List** - Working
   - Displays imported properties
   - Shows data completeness percentage

### ❌ What Doesn't Work
1. **Address/URL Scraping** - BROKEN
   - Vercel serverless functions timeout after 10 seconds (hobby plan limit)
   - Realtor.com scraping: TOO SLOW (removed)
   - County scrapers: TOO SLOW (removed)
   - Perplexity: TOO SLOW (>10 sec, causes 504 timeout)
   - Only fast APIs work: Google Maps, WalkScore, FEMA, AirNow

2. **Real Property Data** - NOT IMPLEMENTED
   - All scrapers disabled due to timeout
   - No real data being returned from searches

---

## Recent Changes (Last 10 Commits)

1. `8aa1522` - Fix CSV field definition format parser
2. `337cd2c` - Fix CSV 110-field property format
3. `4f8dbc1` - Add Upload CSV tab
4. `ac45927` - Disable Perplexity (timeout)
5. `7e2348c` - Simplify API (remove slow scrapers)
6. `fcf54b6` - Add error handling
7. `a56d50a` - Add Perplexity logging
8. `f2d17a1` - Re-enable Perplexity
9. `880a040` - Disable Perplexity
10. `d2a0a43` - Expand Perplexity prompt + add crime/school/transit

---

## Technical Details

### Project Structure
```
D:\Clues_Quantum_Property_Dashboard\app\
├── api/property/
│   ├── search.ts           (TIMEOUT ISSUES - disabled most scrapers)
│   ├── enrich.ts           (Free APIs: WalkScore, FEMA, Google, AirNow)
│   ├── florida-counties.ts (County scrapers - TOO SLOW)
│   └── scrape-realtor.ts   (Realtor scraper - TOO SLOW)
├── src/
│   ├── pages/
│   │   └── AddProperty.tsx (CSV upload working ✅)
│   └── store/
│       └── propertyStore.ts (Zustand state management)
```

### Environment Variables (Vercel)
```
WALKSCORE_API_KEY
PERPLEXITY_API_KEY (not used - too slow)
GOOGLE_MAPS_API_KEY
AIRNOW_API_KEY
WEATHERCOM_API_KEY
HOWLOUD_API_KEY
HOWLOUD_CLIENT_ID
```

### Known Issues
1. **10-second timeout** - Vercel hobby plan limit
2. **No real property data** - All scrapers disabled
3. **Perplexity takes 10-15 seconds** - Causes 504 timeout
4. **Realtor.com blocks requests** - Anti-scraping protection
5. **County sites are slow** - 5-10 seconds per request

---

## Solutions Needed

### Option 1: Upgrade Vercel Plan
- **Pro Plan:** $20/month
- **Benefit:** 60-second timeouts
- **Would allow:** Perplexity, county scrapers, Realtor.com

### Option 2: Background Job System
- Create separate endpoint that returns job ID
- Process scraping in background
- Frontend polls for results
- **More complex but free**

### Option 3: Client-Side Scraping
- Use browser extension or Electron app
- No server timeout limits
- User's browser does the scraping

### Current Recommendation
**Use CSV upload** - It's the only fully working method right now.

---

## CSV Format Examples

### Format 1: Field Definition (110 fields for 1 property)
```csv
Field,Category,Name,Value,Notes/Sources
1,Core Property,full_address,290 41st Ave St Pete Beach FL 33706,USPS
7,Pricing,listing_price,549000,Realtor.com
12,Property Basics,bedrooms,3,County Records
```

### Format 2: Standard Multi-Property
```csv
address,city,state,zip,price,bedrooms,bathrooms,sqft
290 41st Ave,St Pete Beach,FL,33706,549000,3,2,1426
123 Main St,Tampa,FL,33601,450000,4,3,2000
```

---

## How to Continue

### Start Local Dev Server
```bash
cd "D:\Clues_Quantum_Property_Dashboard\app"
npm run dev
```
Opens at: http://localhost:5173

### Check Vercel Logs
1. Go to https://vercel.com
2. Select project: clues-property-search1
3. Click "Logs" tab
4. Filter by function: `/api/property/search`

### Run Tests
```bash
# Test with your address
curl -X POST http://localhost:5173/api/property/search \
  -H "Content-Type: application/json" \
  -d '{"address":"290 41st Ave, St Pete Beach, FL 33706"}'
```

---

## Git Commands

### Push Changes
```bash
cd "D:\Clues_Quantum_Property_Dashboard\app"
git add -A
git commit -m "Your message"
git push origin main
```

### View Status
```bash
git status
git log --oneline -10
```

---

## Next Steps Priority

1. **URGENT:** Fix property data retrieval
   - Either upgrade Vercel plan OR
   - Implement background job system OR
   - Build client-side scraper

2. **Medium:** Complete 110-field schema
   - Only 20-30 fields currently mapped
   - Need to map all 110 fields to PropertyCard type

3. **Low:** Polish CSV upload
   - Better error messages
   - Field mapping preview
   - Validation

---

## Contact Info

**User:** John Broker (Admin)
**GitHub Repo:** johndesautels1/clues-property-search
**Vercel Project:** clues-property-search1

---

**Last Updated:** November 24, 2025 7:30 PM EST

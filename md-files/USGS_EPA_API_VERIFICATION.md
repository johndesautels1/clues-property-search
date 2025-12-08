# USGS & EPA API Verification Report
**Date:** December 6, 2025
**Testing Location:** Tampa Bay Area (lat=27.9, lon=-82.6)

---

## Executive Summary

This report documents the verification of USGS and EPA API endpoints for environmental and hazard data retrieval. Each endpoint was tested with real queries to confirm functionality, response format, and data availability.

**Status Legend:**
- ✅ **WORKING** - API tested and returns valid data
- ⚠️ **PARTIAL** - API works but has limitations
- ❌ **BROKEN** - API endpoint not functional
- 🔄 **UPDATED** - Endpoint URL has changed from original claim

---

## 1. USGS Elevation API ✅ WORKING

### Status
**FULLY FUNCTIONAL** - API returns elevation data successfully.

### Endpoint
```
https://epqs.nationalmap.gov/v1/json
```

### Working Example
```
https://epqs.nationalmap.gov/v1/json?x=-77.0&y=38.9&units=Feet&output=json
```

### Query Parameters
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `x` | Yes | Longitude | `-82.6` |
| `y` | Yes | Latitude | `27.9` |
| `units` | No | Feet or Meters | `Feet` |
| `output` | No | Output format | `json` |

### Response Format
**Type:** JSON

**Structure:**
```json
{
  "location": {
    "x": -77.0,
    "y": 38.9,
    "spatialReference": {
      "wkid": 4326,
      "latestWkid": 4326
    }
  },
  "locationId": 0,
  "value": 44.56,
  "rasterId": 105724,
  "resolution": 1
}
```

### Available Fields
- `value` - Elevation in specified units (feet or meters)
- `location.x` - Longitude
- `location.y` - Latitude
- `spatialReference.wkid` - Coordinate system (4326 = WGS84)
- `rasterId` - Data source identifier
- `resolution` - Grid cell precision

### Limitations
- Returns 0 for locations over water or data gaps
- Tampa Bay test coordinates (27.9, -82.6) returned 0, likely due to water location
- Works successfully for land-based coordinates

### Example Use Cases
- Property elevation determination
- Flood risk assessment
- Topographic analysis

---

## 2. USGS Earthquake Hazards API ✅ WORKING

### Status
**FULLY FUNCTIONAL** - Returns earthquake event data in GeoJSON format.

### Endpoint
```
https://earthquake.usgs.gov/fdsnws/event/1/query
```

### Working Example
```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2015-01-01&endtime=2025-12-06&minlatitude=24.5&maxlatitude=31.0&minlongitude=-87.6&maxlongitude=-80.0&minmagnitude=2.0
```

### Query Parameters
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `format` | No | Output format | `geojson` |
| `starttime` | No | Start date (YYYY-MM-DD) | `2015-01-01` |
| `endtime` | No | End date (YYYY-MM-DD) | `2025-12-06` |
| `minlatitude` | No | Min latitude | `24.5` |
| `maxlatitude` | No | Max latitude | `31.0` |
| `minlongitude` | No | Min longitude | `-87.6` |
| `maxlongitude` | No | Max longitude | `-80.0` |
| `minmagnitude` | No | Min magnitude | `2.0` |

### Response Format
**Type:** GeoJSON

**Structure:**
```json
{
  "type": "FeatureCollection",
  "metadata": {
    "generated": 1733490000000,
    "url": "...",
    "title": "USGS Earthquakes",
    "status": 200,
    "api": "1.14.1",
    "count": 2
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "mag": 2.7,
        "place": "2 km ESE of Century, Florida",
        "time": 1553428800000,
        "updated": 1553500000000,
        "tz": null,
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/...",
        "detail": "...",
        "felt": 4,
        "cdi": 3.4,
        "mmi": null,
        "alert": null,
        "status": "reviewed",
        "tsunami": 0,
        "sig": 112,
        "net": "us",
        "code": "...",
        "ids": "...",
        "sources": "...",
        "types": "...",
        "nst": null,
        "dmin": 0.123,
        "rms": 0.45,
        "gap": 89,
        "magType": "mb_lg",
        "type": "earthquake",
        "title": "M 2.7 - 2 km ESE of Century, Florida"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-87.2345, 30.9876, 5.0]
      },
      "id": "..."
    }
  ]
}
```

### Available Fields
**Properties:**
- `mag` - Magnitude
- `place` - Location description
- `time` - Timestamp (milliseconds since epoch)
- `felt` - Number of felt reports
- `cdi` - Community Decimal Intensity
- `status` - Review status
- `tsunami` - Tsunami warning (0/1)
- `magType` - Magnitude type
- `url` - Link to detailed event page

**Geometry:**
- `coordinates[0]` - Longitude
- `coordinates[1]` - Latitude
- `coordinates[2]` - Depth (km)

### Test Results
**Florida Region (2015-2025):**
- 2 significant earthquakes found
- M 2.7 - Century, Florida (March 24, 2019) - 4 felt reports
- M 2.8 - Jay, Florida (March 6, 2019) - 49 felt reports

### Limitations
- Florida has very low seismic activity
- Data availability depends on magnitude threshold
- Historical data only (not predictive)

### Example Use Cases
- Historical earthquake analysis
- Seismic risk assessment
- Property disclosure requirements

---

## 3. EPA Facility Registry Service (FRS) API ✅ WORKING (🔄 UPDATED URL)

### Status
**FULLY FUNCTIONAL** - Returns comprehensive facility data including NPL/Superfund sites.

### Endpoint (UPDATED)
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities
```

**Note:** Original claimed endpoint was `https://ofmpub.epa.gov/...` which redirects (302) to the current endpoint above.

### Working Example (All Facilities)
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities?latitude83=27.9&longitude83=-82.6&search_radius=5&output=JSON
```

### Working Example (Superfund Sites Only)
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities?latitude83=27.9&longitude83=-82.6&search_radius=5&pgm_sys_acrnm=SEMS&output=JSON
```

### Query Parameters
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `latitude83` | Yes | Latitude (NAD83 datum) | `27.9` |
| `longitude83` | Yes | Longitude (NAD83 datum) | `-82.6` |
| `search_radius` | Yes | Radius in miles | `5` |
| `pgm_sys_acrnm` | No | Program filter (SEMS, CERCLIS, etc.) | `SEMS` |
| `output` | No | Format (JSON, XML, JSONP) | `JSON` |

### Response Format
**Type:** JSON (also supports XML, JSONP)

**Structure:**
```json
{
  "Results": {
    "Facility": [
      {
        "RegistryID": "110000444467",
        "FacilityName": "CHEVRON PORT TAMPA TERMINAL",
        "LocationAddress": "1601 MARITIME BLVD",
        "City": "TAMPA",
        "StateCode": "FL",
        "County": "HILLSBOROUGH",
        "ZipCode": "33605",
        "Latitude83": "27.860156",
        "Longitude83": "-82.537581",
        "ProgramSystemAcronym": "RCRA",
        "EPARegionCode": "04",
        "FacilityURL": "https://...",
        "FacilityDetailURL": "https://..."
      }
    ]
  }
}
```

### Available Fields
- `RegistryID` - Unique facility identifier
- `FacilityName` - Facility name
- `LocationAddress` - Street address
- `City`, `StateCode`, `County`, `ZipCode` - Location
- `Latitude83`, `Longitude83` - Coordinates (NAD83)
- `ProgramSystemAcronym` - EPA program (RCRA, SEMS, TRI, etc.)
- `EPARegionCode` - EPA region
- `FacilityURL` - Link to facility details
- `FacilityDetailURL` - Detailed facility report

### Test Results
**Tampa Bay Area (5-mile radius):**
- 500+ facilities returned
- Types: Retail, manufacturing, energy, healthcare, waste management
- Notable: Chevron terminal, Duke Energy, Amazon distribution centers
- SEMS-specific search found limited Superfund sites in test area

### Limitations
- Requires NAD83 coordinates (not WGS84)
- Maximum radius varies by endpoint
- Large result sets may be paginated
- NPL designation requires filtering by `pgm_sys_acrnm=SEMS`

### Example Use Cases
- Environmental hazard screening
- Nearby facility identification
- Superfund site proximity analysis
- Due diligence for property transactions

---

## 4. EPA Congressional District Lookup API ✅ WORKING

### Status
**FULLY FUNCTIONAL** - Returns congressional district for coordinates.

### Endpoint
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_cd_111
```

### Working Example
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_cd_111?latitude=27.9&longitude=-82.6&hdatum=wgs84
```

### Query Parameters
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `latitude` | Yes | Latitude | `27.9` |
| `longitude` | Yes | Longitude | `-82.6` |
| `hdatum` | Yes | Horizontal datum | `wgs84` |

### Response Format
**Type:** XML

**Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CongressionalDistrict>
  <Message>Success</Message>
  <State>FL</State>
  <CD>10</CD>
  <CDName>Congressional District 10</CDName>
</CongressionalDistrict>
```

### Available Fields
- `Message` - Status message
- `State` - State code
- `CD` - Congressional district number
- `CDName` - District name

### Example Use Cases
- Political boundary identification
- Regulatory jurisdiction determination
- Environmental justice analysis

---

## 5. USDA Forest Service Wildfire Hazard Potential API ⚠️ PARTIAL (🔄 UPDATED ENDPOINT)

### Status
**ENDPOINT UPDATED - EXPERIENCING TIMEOUT ISSUES**

### Original Claimed Endpoint (❌ BROKEN)
```
https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_WildfirePotential_01/MapServer/0/query
```
**Error:** "Service EDW/EDW_WildfirePotential_01/MapServer not found"

### Current Endpoint (⚠️ INTERMITTENT)
```
https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_Continuous_2023/ImageServer
```

### Service Information URL
```
https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_Continuous_2023/ImageServer?f=json
```

### Query Parameters (Theoretical)
| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `geometry` | Yes | Point coordinates | `{"x":-82.6,"y":27.9,"spatialReference":{"wkid":4326}}` |
| `geometryType` | Yes | Geometry type | `esriGeometryPoint` |
| `returnFirstValueOnly` | No | Return single value | `false` |
| `f` | No | Output format | `json` |

### Service Metadata
**Dataset:** 2023 Wildfire Hazard Potential (WHP)
**Coverage:** Conterminous United States
**Resolution:** 270-meter pixels
**Projection:** Web Mercator (WKID 3857)
**Data Source:** LANDFIRE 2020 (landscape conditions as of end-2020)
**Classification:** Five categories (very low through very high)
**Value Range:** 0-120,650

### Available Fields (From Metadata)
- Wildfire hazard potential value (0-120,650)
- Classification category (1-5: very low to very high)
- Pixel resolution metadata
- Raster statistics

### Current Issues
**Error:** "Wait timeout for the request exceeded" (503 error)

**Possible Causes:**
- Service experiencing high load
- Query timeout configuration
- Server-side performance issues

### Alternative Approaches

#### Option 1: Download Data Directly
```
https://data.fs.usda.gov/geodata/edw/datasets.php?xmlKeyword=wildfire
```

#### Option 2: Use USGS Fire Danger Forecast (Different Service)
```
https://www.usgs.gov/fire-danger-forecast
```
**Note:** This provides current/forecast fire danger (not strategic planning WHP)

#### Option 3: NASA FIRMS API (Active Fire Data)
```
https://firms.modaps.eosdis.nasa.gov/api/
```
**Note:** Real-time active fire detection, not hazard potential

### Limitations
- API experiencing timeout issues during testing
- Based on 2020 data (static, not real-time)
- Not a forecast (strategic planning tool only)
- Does not include current weather/fuel moisture

### Recommendations
1. Implement retry logic with exponential backoff
2. Consider caching downloaded WHP raster data locally
3. Use alternative real-time fire danger APIs for current conditions
4. Contact USDA Forest Service for API stability status

### Example Use Cases
- Long-term wildfire risk assessment
- Fuel treatment prioritization
- Property insurance underwriting
- Land use planning

---

## 6. EPA EJScreen API ❌ NOT AVAILABLE AS REST API

### Status
**NO PUBLIC API** - Web application only, discontinued public access in 2025.

### Original Claimed Endpoint
```
https://ejscreen.epa.gov/mapper/
```
**Error:** ECONNREFUSED (Not an API endpoint)

### Current Status
**PUBLIC ACCESS DISCONTINUED** - February 5, 2025

### Alternative Access Methods

#### Option 1: Third-Party Reconstruction
```
https://screening-tools.com/epa-ejscreen
```
**Status:** Community-maintained reconstruction of EJScreen v2.3
**Format:** Web interface (not programmatic API)

#### Option 2: Data Downloads (Historical)
**Previous endpoint (no longer available):**
```
https://gaftp.epa.gov/EJScreen/
```
**Format:** ZIP files by year containing geodatabase (.gdb) or CSV files

#### Option 3: Harvard Dataverse
```
https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/RLR5AX
```
**Format:** Downloadable datasets in various formats
**Resolution:** Block group or tract level

#### Option 4: Zenodo Archive
```
https://zenodo.org/records/14767363
```
**Coverage:** 2015-2024 historical data

### Available Data Fields (Historical)
When EJScreen data was available, it included:
- Demographic indicators (minority population, low income)
- Environmental indicators (air quality, proximity to hazards)
- EJ indexes (combined demographic + environmental)
- Supplemental demographic data
- Traffic proximity
- Lead paint indicators
- Wastewater discharge proximity

### Current Limitations
- No programmatic REST API available
- Public web access discontinued in 2025
- Data must be downloaded and processed locally
- Community alternatives may have limited coverage

### Recommendations
1. Download historical EJScreen datasets for local analysis
2. Use third-party reconstruction for basic screening
3. Monitor EPA announcements for API restoration
4. Consider alternative environmental justice tools:
   - CDC SVI (Social Vulnerability Index)
   - CEJST (Climate and Economic Justice Screening Tool)

### Example Use Cases (Requires Downloaded Data)
- Environmental justice screening
- Community demographics analysis
- Pollution burden assessment
- Equity analysis for development projects

---

## 7. EPA Envirofacts SEMS (Superfund) API ❌ CURRENTLY BROKEN

### Status
**API ENDPOINTS RETURNING ERRORS** - Service exists but queries failing.

### Claimed Endpoints
**Original format:**
```
https://ofmpub.epa.gov/enviro/frs_rest_services.get_facilities
```
**Status:** 404 Not Found

**Updated format:**
```
https://data.epa.gov/efservice/SEMS_ACTIVE_SITES/ROWS/0:10/JSON
```
**Status:** 404 Not Found

**Alternative format:**
```
https://data.epa.gov/efservice/sems.envirofacts_site/state_code/equals/FL/JSON
```
**Status:** 500 Internal Server Error

### Documented API Structure
**Base URL:** `https://data.epa.gov/efservice/`

**URL Format:**
```
/[table]/[column]/[operator]/[value]/[format]
```

### Available Tables (Documented)
- `SEMS_ACTIVE_SITES`
- `sems.envirofacts_site`
- `sems.envirofacts_contaminants`

### Query Parameters (Documented)
| Component | Description | Example |
|-----------|-------------|---------|
| Table | SEMS table name | `SEMS_ACTIVE_SITES` |
| Column | Filter column | `state_code` |
| Operator | Comparison | `equals`, `like`, `excludes` |
| Value | Filter value | `FL` |
| Format | Output format | `JSON`, `XML`, `CSV`, `EXCEL` |

### Documented Features
- JOIN support: `/left/[table2]/[column1]/equals/[column2]`
- Pagination: `/ROWS/[start]:[end]/`
- Sorting: `/ORDER/[column]/`
- Multiple formats: JSON, XML, CSV, Excel, HTML, Parquet, PDF

### Current Issues
- 404 errors on documented endpoints
- 500 errors on documented query formats
- Service may be undergoing maintenance or migration
- Documentation exists but endpoints not responding

### Working Alternative: FRS API with SEMS Filter
```
https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities?latitude83=27.9&longitude83=-82.6&search_radius=5&pgm_sys_acrnm=SEMS&output=JSON
```
**Status:** ✅ WORKING (See Section 3)

### SEMS Web Search Interface (Working)
```
https://enviro.epa.gov/envirofacts/sems/search
```
**Format:** HTML form-based search (not programmatic)

### Recommendations
1. **Use FRS API** with `pgm_sys_acrnm=SEMS` filter for location-based Superfund queries
2. Monitor EPA API documentation for Envirofacts SEMS updates
3. Consider scraping SEMS web search as fallback (requires HTML parsing)
4. Contact EPA Envirofacts support for API status
5. Check EPA Data.gov catalog for alternative data access methods

### Example Use Cases (When Working)
- Superfund site identification by location
- NPL status verification
- Contamination history lookup
- Site remediation status tracking

---

## Summary Table

| API | Status | Endpoint Verified | Data Format | Rate Limits | Notes |
|-----|--------|-------------------|-------------|-------------|-------|
| **USGS Elevation** | ✅ WORKING | https://epqs.nationalmap.gov/v1/json | JSON | None observed | Returns 0 for water locations |
| **USGS Earthquake** | ✅ WORKING | https://earthquake.usgs.gov/fdsnws/event/1/query | GeoJSON | None observed | Comprehensive historical data |
| **EPA FRS Facilities** | ✅ WORKING | https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities | JSON/XML | None observed | 500+ facilities in Tampa test |
| **EPA Congressional District** | ✅ WORKING | https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_cd_111 | XML | None observed | Political boundary lookup |
| **USDA Wildfire Potential** | ⚠️ PARTIAL | https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/... | JSON | Timeout issues | Service exists but timing out |
| **EPA EJScreen** | ❌ NO API | N/A (web app only) | N/A | N/A | Discontinued public access |
| **EPA SEMS (Envirofacts)** | ❌ BROKEN | https://data.epa.gov/efservice/... | N/A | N/A | Use FRS API instead |

---

## Integration Recommendations

### High Priority (Reliable APIs)
1. **USGS Elevation API** - Implement immediately for property elevation data
2. **USGS Earthquake API** - Integrate for seismic history analysis
3. **EPA FRS Facilities API** - Use for environmental hazard screening

### Medium Priority (Working with Caveats)
4. **EPA Congressional District API** - Useful for political boundary data
5. **USDA Wildfire API** - Implement with retry logic and error handling

### Low Priority (Not Recommended)
6. **EPA EJScreen** - Not available as API; requires data download and local processing
7. **EPA SEMS Envirofacts** - Currently broken; use FRS API with SEMS filter instead

---

## Implementation Code Examples

### 1. USGS Elevation Query
```typescript
async function getElevation(lat: number, lon: number): Promise<number> {
  const url = `https://epqs.nationalmap.gov/v1/json?x=${lon}&y=${lat}&units=Feet&output=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.value; // Returns elevation in feet, 0 if over water
}
```

### 2. USGS Earthquake Query
```typescript
async function getEarthquakes(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
  startDate: string,
  minMagnitude: number = 2.0
) {
  const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?` +
    `format=geojson&` +
    `starttime=${startDate}&` +
    `endtime=${new Date().toISOString().split('T')[0]}&` +
    `minlatitude=${minLat}&maxlatitude=${maxLat}&` +
    `minlongitude=${minLon}&maxlongitude=${maxLon}&` +
    `minmagnitude=${minMagnitude}`;

  const response = await fetch(url);
  const data = await response.json();
  return data.features; // Array of earthquake events
}
```

### 3. EPA FRS Facilities Query
```typescript
async function getNearbyFacilities(
  lat: number,
  lon: number,
  radiusMiles: number = 5,
  programFilter?: string // e.g., 'SEMS' for Superfund sites
) {
  let url = `https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_facilities?` +
    `latitude83=${lat}&longitude83=${lon}&search_radius=${radiusMiles}&output=JSON`;

  if (programFilter) {
    url += `&pgm_sys_acrnm=${programFilter}`;
  }

  const response = await fetch(url);
  const data = await response.json();
  return data.Results?.Facility || [];
}
```

### 4. EPA Congressional District Query
```typescript
async function getCongressionalDistrict(lat: number, lon: number) {
  const url = `https://frs-public.epa.gov/ords/frs_public2/frs_rest_services.get_cd_111?` +
    `latitude=${lat}&longitude=${lon}&hdatum=wgs84`;

  const response = await fetch(url);
  const xmlText = await response.text();

  // Parse XML response
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  return {
    state: xmlDoc.querySelector('State')?.textContent,
    district: xmlDoc.querySelector('CD')?.textContent,
    districtName: xmlDoc.querySelector('CDName')?.textContent
  };
}
```

### 5. USDA Wildfire Query (with Retry Logic)
```typescript
async function getWildfireHazard(
  lat: number,
  lon: number,
  retries: number = 3
): Promise<number | null> {
  const url = `https://apps.fs.usda.gov/fsgisx01/rest/services/RDW_Wildfire/` +
    `RMRS_WildfireHazardPotential_Continuous_2023/ImageServer/getSamples?` +
    `geometry={"x":${lon},"y":${lat},"spatialReference":{"wkid":4326}}&` +
    `geometryType=esriGeometryPoint&returnFirstValueOnly=false&f=json`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.samples?.[0]?.value;
    } catch (error) {
      if (i === retries - 1) {
        console.error('Wildfire API failed after retries:', error);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return null;
}
```

---

## Error Handling Best Practices

### 1. Handle Water Locations (USGS Elevation)
```typescript
const elevation = await getElevation(lat, lon);
if (elevation === 0) {
  console.warn('Location may be over water or have no elevation data');
}
```

### 2. Handle Low Seismicity Areas (USGS Earthquake)
```typescript
const earthquakes = await getEarthquakes(minLat, maxLat, minLon, maxLon, '2015-01-01');
if (earthquakes.length === 0) {
  console.info('No significant earthquakes in this region');
}
```

### 3. Handle Large Facility Results (EPA FRS)
```typescript
const facilities = await getNearbyFacilities(lat, lon, 5);
if (facilities.length > 100) {
  console.warn(`Large number of facilities found: ${facilities.length}`);
  // Consider pagination or filtering
}
```

### 4. Handle API Timeouts (USDA Wildfire)
```typescript
const hazard = await getWildfireHazard(lat, lon, 3);
if (hazard === null) {
  console.error('Wildfire hazard data unavailable - service timeout');
  // Fallback to cached data or skip this metric
}
```

---

## Rate Limiting Considerations

**Current Status:** No rate limits observed during testing for any API.

**Recommended Best Practices:**
1. Implement exponential backoff for failed requests
2. Cache responses to minimize API calls
3. Batch requests when possible
4. Monitor for 429 (Too Many Requests) status codes
5. Consider implementing request queuing for high-volume applications

---

## Data Freshness

| API | Data Currency | Update Frequency |
|-----|---------------|------------------|
| USGS Elevation | Static terrain data | Irregular (years) |
| USGS Earthquake | Real-time | Continuous |
| EPA FRS Facilities | Updated regularly | Weekly/monthly |
| EPA Congressional District | Current | After redistricting |
| USDA Wildfire Potential | 2020 landscape data | Annual (last: 2023) |

---

## Sources & References

### API Documentation
- [USGS Elevation Point Query Service](https://nationalmap.gov/epqs/)
- [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [EPA FRS API Documentation](https://www.epa.gov/frs/frs-api)
- [USDA Wildfire Hazard Potential](https://research.fs.usda.gov/firelab/products/dataandtools/wildfire-hazard-potential)
- [EPA Envirofacts API](https://www.epa.gov/enviro/envirofacts-data-service-api)

### Data Sources
- [EPA FRS REST Services GitHub Examples](https://github.com/USEPA/FRS-getfacilities-samples)
- [EPA Superfund NPL Data](https://www.epa.gov/superfund/superfund-national-priorities-list-npl)
- [EJScreen Alternative Access](https://screening-tools.com/epa-ejscreen)
- [Harvard Dataverse EJScreen Archive](https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/RLR5AX)

---

## Conclusion

Of the 5 claimed APIs, **3 are fully functional**, **1 is partially working** with timeout issues, and **1 is not available as a REST API**. The EPA Envirofacts SEMS endpoint is currently broken but can be replaced with the FRS API using SEMS filtering.

**Recommended for immediate integration:**
1. USGS Elevation API - Reliable elevation data
2. USGS Earthquake API - Comprehensive seismic history
3. EPA FRS Facilities API - Environmental hazard screening including Superfund sites

**Requires additional work:**
4. USDA Wildfire API - Implement robust error handling and retry logic
5. EPA EJScreen - Download historical datasets for local analysis
6. EPA SEMS - Use FRS API with SEMS filter instead of direct Envirofacts endpoint

---

**Report Generated:** December 6, 2025
**Testing Completed By:** Claude Code API Verification
**Next Review Date:** March 6, 2026 (or when API issues are resolved)

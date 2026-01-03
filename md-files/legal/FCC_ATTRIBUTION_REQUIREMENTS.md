# FCC API Attribution Requirements - MANDATORY COMPLIANCE

## Legal Notice

**This product uses FCC APIs and/or Data but is not endorsed or certified by the FCC.**

---

## STRICT RULES - DO NOT VIOLATE

### 1. Required Attribution
Any page, component, or output that displays FCC-sourced data MUST include:
```
"This product uses FCC APIs and/or Data but is not endorsed or certified by the FCC."
```

### 2. Data Integrity
- **NEVER modify FCC data and claim it's from FCC**
- **NEVER falsely represent FCC data**
- If we calculate/derive from FCC data, label it as "Calculated from FCC data" NOT "FCC data"

### 3. Logo/Name Usage
- MAY use FCC name to identify data source
- MAY NOT imply FCC endorsement of our product
- MAY NOT use FCC logo without following their guidelines

### 4. Fields Using FCC Data

| Field # | Field Name | FCC Data Used | Attribution Required |
|---------|------------|---------------|---------------------|
| 111 | internet_providers_top3 | FCC Broadband Map | YES |
| 112 | max_internet_speed | FCC Broadband Map | YES |
| TBD | internet_providers_count | FCC Broadband Map | YES |

### 5. Implementation Requirements

#### In Code (api/property/free-apis.ts):
```typescript
// FCC ATTRIBUTION REQUIRED - See FCC_ATTRIBUTION_REQUIREMENTS.md
// This product uses FCC APIs and/or Data but is not endorsed or certified by the FCC.
```

#### In UI (PropertyDetail component):
When displaying internet/broadband fields, include footer:
```jsx
<span className="text-xs text-gray-400">
  Internet data from FCC Broadband Map. This product uses FCC Data but is not endorsed by the FCC.
</span>
```

#### In API Response:
```typescript
{
  field_111_internet_providers: "Spectrum, AT&T, Xfinity",
  field_111_source: "FCC_BROADBAND_API",
  field_111_attribution: "FCC Broadband Map - Not endorsed by FCC"
}
```

---

## Consequences of Violation
- FCC can revoke API access
- Potential legal action for misrepresentation
- Reputation damage

---

## Review Checklist
- [ ] Attribution displayed on any page showing FCC data
- [ ] No modified FCC data claimed as original
- [ ] No FCC endorsement implied
- [ ] Source clearly labeled in API responses
- [ ] Code comments reference this document

---

*Document created: 2026-01-03*
*Last reviewed: 2026-01-03*

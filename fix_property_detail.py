import re

filepath = 'D:/Clues_Quantum_Property_Dashboard/app/src/pages/PropertyDetail.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Field key mappings - maps the property path to API key
field_mappings = {
    # Address & Identity
    'fullProperty.address.fullAddress': '1_full_address',
    'fullProperty.address.mlsPrimary': '2_mls_primary',
    'fullProperty.address.mlsSecondary': '3_mls_secondary',
    'fullProperty.address.listingStatus': '4_listing_status',
    'fullProperty.address.listingDate': '5_listing_date',
    'fullProperty.details.parcelId': '6_parcel_id',
    'fullProperty.address.listingPrice': '7_listing_price',
    'fullProperty.address.pricePerSqft': '8_price_per_sqft',
    'fullProperty.details.marketValueEstimate': '9_market_value_estimate',
    'fullProperty.details.lastSaleDate': '10_last_sale_date',
    'fullProperty.details.lastSalePrice': '11_last_sale_price',
    'fullProperty.details.bedrooms': '12_bedrooms',
    'fullProperty.details.fullBathrooms': '13_full_bathrooms',
    'fullProperty.details.halfBathrooms': '14_half_bathrooms',
    'fullProperty.details.totalBathrooms': '15_total_bathrooms',
    'fullProperty.details.livingSqft': '16_living_sqft',
    'fullProperty.details.totalSqftUnderRoof': '17_total_sqft_under_roof',
    'fullProperty.details.lotSizeSqft': '18_lot_size_sqft',
    'fullProperty.details.lotSizeAcres': '19_lot_size_acres',
    'fullProperty.details.yearBuilt': '20_year_built',
    'fullProperty.details.propertyType': '21_property_type',
    'fullProperty.details.stories': '22_stories',
    'fullProperty.details.garageSpaces': '23_garage_spaces',
    'fullProperty.details.parkingTotal': '24_parking_total',
    'fullProperty.details.hoaYn': '25_hoa_yn',
    'fullProperty.details.hoaFeeAnnual': '26_hoa_fee_annual',
    'fullProperty.details.ownershipType': '27_ownership_type',
    'fullProperty.address.county': '28_county',
    'fullProperty.details.annualTaxes': '29_annual_taxes',
    'fullProperty.details.taxYear': '30_tax_year',
    'fullProperty.details.assessedValue': '31_assessed_value',
    'fullProperty.financial.taxExemptions': '32_tax_exemptions',
    'fullProperty.financial.propertyTaxRate': '33_property_tax_rate',
    'fullProperty.structural.roofType': '36_roof_type',
    'fullProperty.structural.roofAgeEst': '37_roof_age_est',
    'fullProperty.structural.exteriorMaterial': '38_exterior_material',
    'fullProperty.structural.foundation': '39_foundation',
    'fullProperty.structural.hvacType': '40_hvac_type',
    'fullProperty.structural.hvacAge': '41_hvac_age',
    'fullProperty.structural.flooringType': '42_flooring_type',
    'fullProperty.structural.kitchenFeatures': '43_kitchen_features',
    'fullProperty.structural.appliancesIncluded': '44_appliances_included',
    'fullProperty.structural.fireplaceYn': '45_fireplace_yn',
    'fullProperty.structural.interiorCondition': '46_interior_condition',
    'fullProperty.structural.poolYn': '47_pool_yn',
    'fullProperty.structural.poolType': '48_pool_type',
    'fullProperty.structural.deckPatio': '49_deck_patio',
    'fullProperty.structural.fence': '50_fence',
    'fullProperty.structural.landscaping': '51_landscaping',
    'fullProperty.structural.recentRenovations': '52_recent_renovations',
    'fullProperty.structural.permitHistoryRoof': '53_permit_history_roof',
    'fullProperty.structural.permitHistoryHvac': '54_permit_history_hvac',
    'fullProperty.structural.permitHistoryPoolAdditions': '55_permit_history_other',
    'fullProperty.location.assignedElementary': '56_assigned_elementary',
    'fullProperty.location.elementaryRating': '57_elementary_rating',
    'fullProperty.location.elementaryDistanceMiles': '58_elementary_distance_miles',
    'fullProperty.location.assignedMiddle': '59_assigned_middle',
    'fullProperty.location.middleRating': '60_middle_rating',
    'fullProperty.location.middleDistanceMiles': '61_middle_distance_miles',
    'fullProperty.location.assignedHigh': '62_assigned_high',
    'fullProperty.location.highRating': '63_high_rating',
    'fullProperty.location.highDistanceMiles': '64_high_distance_miles',
    'fullProperty.location.walkScore': '65_walk_score',
    'fullProperty.location.transitScore': '66_transit_score',
    'fullProperty.location.bikeScore': '67_bike_score',
    'fullProperty.location.noiseLevel': '68_noise_level',
    'fullProperty.location.trafficLevel': '69_traffic_level',
    'fullProperty.location.walkabilityDescription': '70_walkability_description',
    'fullProperty.location.commuteTimeCityCenter': '71_commute_time_city_center',
    'fullProperty.location.publicTransitAccess': '72_public_transit_access',
    'fullProperty.location.distanceGroceryMiles': '73_distance_grocery_miles',
    'fullProperty.location.distanceHospitalMiles': '74_distance_hospital_miles',
    'fullProperty.location.distanceAirportMiles': '75_distance_airport_miles',
    'fullProperty.location.distanceParkMiles': '76_distance_park_miles',
    'fullProperty.location.distanceBeachMiles': '77_distance_beach_miles',
    'fullProperty.location.crimeIndexViolent': '78_crime_index_violent',
    'fullProperty.location.crimeIndexProperty': '79_crime_index_property',
    'fullProperty.location.neighborhoodSafetyRating': '80_neighborhood_safety_rating',
    'fullProperty.financial.medianHomePriceNeighborhood': '81_median_home_price_neighborhood',
    'fullProperty.financial.pricePerSqftRecentAvg': '82_price_per_sqft_recent_avg',
    'fullProperty.financial.daysOnMarketAvg': '83_days_on_market_avg',
    'fullProperty.financial.inventorySurplus': '84_inventory_surplus',
    'fullProperty.financial.rentalEstimateMonthly': '85_rental_estimate_monthly',
    'fullProperty.financial.rentalYieldEst': '86_rental_yield_est',
    'fullProperty.financial.vacancyRateNeighborhood': '87_vacancy_rate_neighborhood',
    'fullProperty.financial.capRateEst': '88_cap_rate_est',
    'fullProperty.financial.insuranceEstAnnual': '89_insurance_est_annual',
    'fullProperty.financial.financingTerms': '90_financing_terms',
    'fullProperty.financial.comparableSalesLast3': '91_comparable_sales',
    'fullProperty.utilities.electricProvider': '92_electric_provider',
    'fullProperty.utilities.waterProvider': '93_water_provider',
    'fullProperty.utilities.sewerProvider': '94_sewer_provider',
    'fullProperty.utilities.naturalGas': '95_natural_gas',
    'fullProperty.utilities.internetProvidersTop3': '96_internet_providers_top3',
    'fullProperty.utilities.maxInternetSpeed': '97_max_internet_speed',
    'fullProperty.utilities.cableTvProvider': '98_cable_tv_provider',
    'fullProperty.utilities.airQualityIndexCurrent': '99_air_quality_index_current',
    'fullProperty.utilities.floodZone': '100_flood_zone',
    'fullProperty.utilities.floodRiskLevel': '101_flood_risk_level',
    'fullProperty.utilities.climateRiskWildfireFlood': '102_climate_risk_summary',
    'fullProperty.utilities.noiseLevelDbEst': '103_noise_level_db_est',
    'fullProperty.utilities.solarPotential': '104_solar_potential',
    'fullProperty.utilities.evChargingYn': '105_ev_charging_yn',
    'fullProperty.utilities.smartHomeFeatures': '106_smart_home_features',
    'fullProperty.utilities.accessibilityMods': '107_accessibility_mods',
    'fullProperty.utilities.petPolicy': '108_pet_policy',
    'fullProperty.utilities.ageRestrictions': '109_age_restrictions',
    'fullProperty.utilities.notesConfidenceSummary': '110_notes_confidence_summary',
    # Extra fields
    'fullProperty.address.neighborhoodName': '41_neighborhood_name',
    'fullProperty.address.zipCode': 'zip',
    'fullProperty.location.schoolDistrictName': '65_school_district_name',
    'fullProperty.location.elevationFeet': '55_elevation_feet',
    'fullProperty.financial.redfinEstimate': '74_redfin_estimate',
    'fullProperty.financial.priceToRentRatio': '77_price_to_rent_ratio',
    'fullProperty.financial.priceVsMedianPercent': '79_price_vs_median_percent',
    'fullProperty.details.hoaName': '70_hoa_name',
    'fullProperty.details.hoaIncludes': '71_hoa_includes',
    'fullProperty.structural.waterHeaterType': '30_water_heater_type',
    'fullProperty.structural.garageType': '31_garage_type',
    'fullProperty.structural.laundryType': '39_laundry_type',
    'fullProperty.structural.fireplaceCount': '38_fireplace_count',
    'fullProperty.utilities.trashProvider': '85_trash_provider',
    'fullProperty.utilities.avgElectricBill': '90_avg_electric_bill',
    'fullProperty.utilities.avgWaterBill': '91_avg_water_bill',
    'fullProperty.utilities.fiberAvailable': '88_fiber_available',
    'fullProperty.utilities.cellCoverageQuality': '94_cell_coverage_quality',
    'fullProperty.utilities.emergencyServicesDistance': '95_emergency_services_distance',
    'fullProperty.utilities.airQualityGrade': '97_air_quality_grade',
    'fullProperty.utilities.wildfireRisk': '98_wildfire_risk',
    'fullProperty.utilities.earthquakeRisk': '99_earthquake_risk',
    'fullProperty.utilities.hurricaneRisk': '100_hurricane_risk',
    'fullProperty.utilities.tornadoRisk': '101_tornado_risk',
    'fullProperty.utilities.radonRisk': '102_radon_risk',
    'fullProperty.utilities.superfundNearby': '103_superfund_nearby',
    'fullProperty.utilities.seaLevelRiseRisk': '105_sea_level_rise_risk',
    'fullProperty.utilities.viewType': '108_view_type',
    'fullProperty.utilities.lotFeatures': '109_lot_features',
}

# Function to add fieldKey to renderDataField calls
def add_field_key(match):
    full_match = match.group(0)
    label = match.group(1)
    field_path = match.group(2)
    rest = match.group(3) if match.group(3) else ''

    # Get the API key for this field
    api_key = field_mappings.get(field_path, None)

    if api_key:
        # Check if rest already has parameters
        if rest.strip():
            # Has other params, add fieldKey at the end
            return f'renderDataField("{label}", {field_path}, {rest.strip()}, undefined, "{api_key}")'
        else:
            # No other params after field, add default format and fieldKey
            return f'renderDataField("{label}", {field_path}, "text", undefined, "{api_key}")'
    else:
        # No mapping found, return original
        return full_match

# Pattern to match renderDataField calls
# renderDataField("Label", fullProperty.path.field) or
# renderDataField("Label", fullProperty.path.field, 'format') or
# renderDataField("Label", fullProperty.path.field, 'format', <icon>)
pattern = r'renderDataField\("([^"]+)", (fullProperty\.[a-zA-Z.]+)(?:, ([^)]+))?\)'

# Replace all matches
new_content = re.sub(pattern, add_field_key, content)

# Also expand the paths mapping in handleRetryField
old_paths = '''          const paths: Record<string, [string, string]> = {
            '1_full_address': ['address', 'fullAddress'],
            '7_listing_price': ['address', 'listingPrice'],
            '12_bedrooms': ['details', 'bedrooms'],
            '16_living_sqft': ['details', 'livingSqft'],
            '65_walk_score': ['location', 'walkScore'],
            '100_flood_zone': ['utilities', 'floodZone'],
          };'''

new_paths = '''          const paths: Record<string, [string, string]> = {
            // Address & Identity
            '1_full_address': ['address', 'fullAddress'],
            '2_mls_primary': ['address', 'mlsPrimary'],
            '3_mls_secondary': ['address', 'mlsSecondary'],
            '4_listing_status': ['address', 'listingStatus'],
            '5_listing_date': ['address', 'listingDate'],
            '6_parcel_id': ['details', 'parcelId'],
            // Pricing
            '7_listing_price': ['address', 'listingPrice'],
            '8_price_per_sqft': ['address', 'pricePerSqft'],
            '9_market_value_estimate': ['details', 'marketValueEstimate'],
            '10_last_sale_date': ['details', 'lastSaleDate'],
            '11_last_sale_price': ['details', 'lastSalePrice'],
            // Property Basics
            '12_bedrooms': ['details', 'bedrooms'],
            '13_full_bathrooms': ['details', 'fullBathrooms'],
            '14_half_bathrooms': ['details', 'halfBathrooms'],
            '15_total_bathrooms': ['details', 'totalBathrooms'],
            '16_living_sqft': ['details', 'livingSqft'],
            '17_total_sqft_under_roof': ['details', 'totalSqftUnderRoof'],
            '18_lot_size_sqft': ['details', 'lotSizeSqft'],
            '19_lot_size_acres': ['details', 'lotSizeAcres'],
            '20_year_built': ['details', 'yearBuilt'],
            '21_property_type': ['details', 'propertyType'],
            '22_stories': ['details', 'stories'],
            '23_garage_spaces': ['details', 'garageSpaces'],
            '24_parking_total': ['details', 'parkingTotal'],
            // HOA & Ownership
            '25_hoa_yn': ['details', 'hoaYn'],
            '26_hoa_fee_annual': ['details', 'hoaFeeAnnual'],
            '27_ownership_type': ['details', 'ownershipType'],
            '28_county': ['address', 'county'],
            // Taxes
            '29_annual_taxes': ['details', 'annualTaxes'],
            '30_tax_year': ['details', 'taxYear'],
            '31_assessed_value': ['details', 'assessedValue'],
            '32_tax_exemptions': ['financial', 'taxExemptions'],
            '33_property_tax_rate': ['financial', 'propertyTaxRate'],
            // Structure
            '36_roof_type': ['structural', 'roofType'],
            '37_roof_age_est': ['structural', 'roofAgeEst'],
            '38_exterior_material': ['structural', 'exteriorMaterial'],
            '39_foundation': ['structural', 'foundation'],
            '40_hvac_type': ['structural', 'hvacType'],
            '41_hvac_age': ['structural', 'hvacAge'],
            '42_flooring_type': ['structural', 'flooringType'],
            '43_kitchen_features': ['structural', 'kitchenFeatures'],
            '44_appliances_included': ['structural', 'appliancesIncluded'],
            '45_fireplace_yn': ['structural', 'fireplaceYn'],
            '46_interior_condition': ['structural', 'interiorCondition'],
            '47_pool_yn': ['structural', 'poolYn'],
            '48_pool_type': ['structural', 'poolType'],
            '49_deck_patio': ['structural', 'deckPatio'],
            '50_fence': ['structural', 'fence'],
            '51_landscaping': ['structural', 'landscaping'],
            '52_recent_renovations': ['structural', 'recentRenovations'],
            '53_permit_history_roof': ['structural', 'permitHistoryRoof'],
            '54_permit_history_hvac': ['structural', 'permitHistoryHvac'],
            '55_permit_history_other': ['structural', 'permitHistoryPoolAdditions'],
            // Schools
            '56_assigned_elementary': ['location', 'assignedElementary'],
            '57_elementary_rating': ['location', 'elementaryRating'],
            '58_elementary_distance_miles': ['location', 'elementaryDistanceMiles'],
            '59_assigned_middle': ['location', 'assignedMiddle'],
            '60_middle_rating': ['location', 'middleRating'],
            '61_middle_distance_miles': ['location', 'middleDistanceMiles'],
            '62_assigned_high': ['location', 'assignedHigh'],
            '63_high_rating': ['location', 'highRating'],
            '64_high_distance_miles': ['location', 'highDistanceMiles'],
            // Location Scores
            '65_walk_score': ['location', 'walkScore'],
            '66_transit_score': ['location', 'transitScore'],
            '67_bike_score': ['location', 'bikeScore'],
            '68_noise_level': ['location', 'noiseLevel'],
            '69_traffic_level': ['location', 'trafficLevel'],
            '70_walkability_description': ['location', 'walkabilityDescription'],
            '71_commute_time_city_center': ['location', 'commuteTimeCityCenter'],
            '72_public_transit_access': ['location', 'publicTransitAccess'],
            // Distances
            '73_distance_grocery_miles': ['location', 'distanceGroceryMiles'],
            '74_distance_hospital_miles': ['location', 'distanceHospitalMiles'],
            '75_distance_airport_miles': ['location', 'distanceAirportMiles'],
            '76_distance_park_miles': ['location', 'distanceParkMiles'],
            '77_distance_beach_miles': ['location', 'distanceBeachMiles'],
            // Safety
            '78_crime_index_violent': ['location', 'crimeIndexViolent'],
            '79_crime_index_property': ['location', 'crimeIndexProperty'],
            '80_neighborhood_safety_rating': ['location', 'neighborhoodSafetyRating'],
            // Market & Investment
            '81_median_home_price_neighborhood': ['financial', 'medianHomePriceNeighborhood'],
            '82_price_per_sqft_recent_avg': ['financial', 'pricePerSqftRecentAvg'],
            '83_days_on_market_avg': ['financial', 'daysOnMarketAvg'],
            '84_inventory_surplus': ['financial', 'inventorySurplus'],
            '85_rental_estimate_monthly': ['financial', 'rentalEstimateMonthly'],
            '86_rental_yield_est': ['financial', 'rentalYieldEst'],
            '87_vacancy_rate_neighborhood': ['financial', 'vacancyRateNeighborhood'],
            '88_cap_rate_est': ['financial', 'capRateEst'],
            '89_insurance_est_annual': ['financial', 'insuranceEstAnnual'],
            '90_financing_terms': ['financial', 'financingTerms'],
            '91_comparable_sales': ['financial', 'comparableSalesLast3'],
            // Utilities
            '92_electric_provider': ['utilities', 'electricProvider'],
            '93_water_provider': ['utilities', 'waterProvider'],
            '94_sewer_provider': ['utilities', 'sewerProvider'],
            '95_natural_gas': ['utilities', 'naturalGas'],
            '96_internet_providers_top3': ['utilities', 'internetProvidersTop3'],
            '97_max_internet_speed': ['utilities', 'maxInternetSpeed'],
            '98_cable_tv_provider': ['utilities', 'cableTvProvider'],
            // Environment & Risk
            '99_air_quality_index_current': ['utilities', 'airQualityIndexCurrent'],
            '100_flood_zone': ['utilities', 'floodZone'],
            '101_flood_risk_level': ['utilities', 'floodRiskLevel'],
            '102_climate_risk_summary': ['utilities', 'climateRiskWildfireFlood'],
            '103_noise_level_db_est': ['utilities', 'noiseLevelDbEst'],
            '104_solar_potential': ['utilities', 'solarPotential'],
            // Additional Features
            '105_ev_charging_yn': ['utilities', 'evChargingYn'],
            '106_smart_home_features': ['utilities', 'smartHomeFeatures'],
            '107_accessibility_mods': ['utilities', 'accessibilityMods'],
            '108_pet_policy': ['utilities', 'petPolicy'],
            '109_age_restrictions': ['utilities', 'ageRestrictions'],
            '110_notes_confidence_summary': ['utilities', 'notesConfidenceSummary'],
          };'''

new_content = new_content.replace(old_paths, new_paths)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('SUCCESS: PropertyDetail.tsx has been updated with fieldKey parameters and expanded paths mapping')

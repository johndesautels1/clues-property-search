/**
 * CLUES Property Dashboard - MLS PDF Parser API
 * Extracts property data from Stellar MLS CustomerFull PDF sheets
 * Uses Claude to parse PDF content and map to 168-field schema
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel serverless config
export const config = {
  maxDuration: 120, // 2 minutes for PDF parsing
};

// MLS field mapping: Maps Stellar MLS field names to our numbered schema
// UPDATED: 2025-12-01 - Expanded mappings for better field coverage (168 fields)
const MLS_FIELD_MAPPING: Record<string, string> = {
  // ================================================================
  // GROUP 1: ADDRESS & IDENTITY (Fields 1-9)
  // ================================================================
  'Address': '1_full_address',
  'Full Address': '1_full_address',
  'Property Address': '1_full_address',
  'Street Address': '1_full_address',
  'Location': '1_full_address',
  'MLS#': '2_mls_primary',
  'MLS Number': '2_mls_primary',
  'MLS': '2_mls_primary',
  'Listing ID': '2_mls_primary',
  'List Number': '2_mls_primary',
  'Secondary MLS': '3_mls_secondary',
  'Other MLS': '3_mls_secondary',
  'MLS Secondary': '3_mls_secondary',
  'Cross MLS': '3_mls_secondary',
  'IDX': '3_mls_secondary',
  'Status': '4_listing_status',
  'Listing Status': '4_listing_status',
  'Property Status': '4_listing_status',
  'Listing Type': '4_listing_status',
  'List Date': '5_listing_date',
  'Original List Date': '5_listing_date',
  'Date Listed': '5_listing_date',
  'On Market Date': '5_listing_date',
  'Neighborhood': '6_neighborhood',
  'Area': '6_neighborhood',
  'Location Area': '6_neighborhood',
  'County': '7_county',
  'Zip': '8_zip_code',
  'Zip Code': '8_zip_code',
  'ZIP': '8_zip_code',
  'Postal Code': '8_zip_code',
  'Tax ID': '9_parcel_id',
  'Parcel ID': '9_parcel_id',
  'Parcel Number': '9_parcel_id',
  'Alt Key/Folio #': '9_parcel_id',
  'Folio Number': '9_parcel_id',
  'APN': '9_parcel_id',

  // ================================================================
  // GROUP 2: PRICING & VALUE (Fields 10-16)
  // ================================================================
  'List Price': '10_listing_price',
  'Listing Price': '10_listing_price',
  'Current Price': '10_listing_price',
  'Price': '10_listing_price',
  'Asking Price': '10_listing_price',
  'Original Price': '10_listing_price',
  'LP/SqFt': '11_price_per_sqft',
  'Price/SqFt': '11_price_per_sqft',
  '$/SqFt': '11_price_per_sqft',
  'Price Per Sq Ft': '11_price_per_sqft',
  'Cost Per Sq Ft': '11_price_per_sqft',
  'Zestimate': '12_market_value_estimate',
  'Estimated Value': '12_market_value_estimate',
  'Market Value': '12_market_value_estimate',
  'Appraised Value': '12_market_value_estimate',
  'Prior Sale Date': '13_last_sale_date',
  'Last Sale Date': '13_last_sale_date',
  'Previous Sale Date': '13_last_sale_date',
  'Sold Date': '13_last_sale_date',
  'Close Date': '13_last_sale_date',
  'Prior Sale Price': '14_last_sale_price',
  'Last Sale Price': '14_last_sale_price',
  'Previous Sale Price': '14_last_sale_price',
  'Sold Price': '14_last_sale_price',
  'Assessed Value': '15_assessed_value',
  'Tax Assessed Value': '15_assessed_value',
  'Just Value': '15_assessed_value',
  'Total Assessed Value': '15_assessed_value',
  'Redfin Estimate': '16_redfin_estimate',

  // ================================================================
  // GROUP 3: PROPERTY BASICS (Fields 17-29)
  // ================================================================
  'Beds': '17_bedrooms',
  'Bedrooms': '17_bedrooms',
  'BR': '17_bedrooms',
  'Bedrooms Total': '17_bedrooms',
  'Total Bedrooms': '17_bedrooms',
  'Bed': '17_bedrooms',
  'Full Baths': '18_full_bathrooms',
  'Full Bathrooms': '18_full_bathrooms',
  'Full Bath': '18_full_bathrooms',
  'Half Baths': '19_half_bathrooms',
  'Half Bathrooms': '19_half_bathrooms',
  'Half Bath': '19_half_bathrooms',
  'Partial Baths': '19_half_bathrooms',
  'Baths': '20_total_bathrooms',
  'Total Baths': '20_total_bathrooms',
  'Bathrooms Total': '20_total_bathrooms',
  'BA': '20_total_bathrooms',
  'Bathrooms': '20_total_bathrooms',
  'Heated Area': '21_living_sqft',
  'Living Area': '21_living_sqft',
  'Living SqFt': '21_living_sqft',
  'Heated SqFt': '21_living_sqft',
  'Interior SqFt': '21_living_sqft',
  'Sqft': '21_living_sqft',
  'Square Feet': '21_living_sqft',
  'Living Square Feet': '21_living_sqft',
  'Above Grade Finished Area': '21_living_sqft',
  'Total Area': '22_total_sqft_under_roof',
  'Total SqFt': '22_total_sqft_under_roof',
  'Building Area Total': '22_total_sqft_under_roof',
  'Under Roof': '22_total_sqft_under_roof',
  'Total Building Area': '22_total_sqft_under_roof',
  'Gross Area': '22_total_sqft_under_roof',
  'Lot Size': '23_lot_size_sqft',
  'Lot SqFt': '23_lot_size_sqft',
  'Lot Square Feet': '23_lot_size_sqft',
  'Land Area': '23_lot_size_sqft',
  'Lot Size Acres': '24_lot_size_acres',
  'Lot Acres': '24_lot_size_acres',
  'Total Acreage': '24_lot_size_acres',
  'Acres': '24_lot_size_acres',
  'Land Acres': '24_lot_size_acres',
  'Year Built': '25_year_built',
  'Built': '25_year_built',
  'Year Constructed': '25_year_built',
  'Construction Year': '25_year_built',
  'Property Style': '26_property_type',
  'Property Type': '26_property_type',
  'Type': '26_property_type',
  'Property Sub Type': '26_property_type',
  'Sub Type': '26_property_type',
  'Style': '26_property_type',
  'Building Type': '26_property_type',
  'Stories': '27_stories',
  'Levels': '27_stories',
  'Number of Stories': '27_stories',
  '# Stories': '27_stories',
  'Floors': '27_stories',
  'Garage': '28_garage_spaces',
  'Garage Spaces': '28_garage_spaces',
  'Spcs': '28_garage_spaces',
  'Garage Size': '28_garage_spaces',
  '# of Garages': '28_garage_spaces',
  'Parking Spaces': '29_parking_total',
  'Total Parking': '29_parking_total',
  'Parking': '29_parking_total',
  'Parking Total Spaces': '29_parking_total',

  // ================================================================
  // GROUP 4: HOA & TAXES (Fields 30-38)
  // ================================================================
  'HOA / Comm Assn': '30_hoa_yn',
  'HOA': '30_hoa_yn',
  'HOA Y/N': '30_hoa_yn',
  'Association': '30_hoa_yn',
  'Community Association': '30_hoa_yn',
  'HOA Fee': '31_hoa_fee_annual',
  'Monthly HOA Amount': '31_hoa_fee_annual',
  'HOA Monthly': '31_hoa_fee_annual',
  'HOA Annual': '31_hoa_fee_annual',
  'Total Annual Assoc Fees': '31_hoa_fee_annual',
  'Average Monthly Fees': '31_hoa_fee_annual',
  'Association Fee': '31_hoa_fee_annual',
  'Condo Fee': '31_hoa_fee_annual',
  'Maintenance Fee': '31_hoa_fee_annual',
  'HOA Name': '32_hoa_name',
  'Association Name': '32_hoa_name',
  'Master Assn/Name': '32_hoa_name',
  'HOA Company': '32_hoa_name',
  'Fee Includes': '33_hoa_includes',
  'HOA Includes': '33_hoa_includes',
  'Association Fee Includes': '33_hoa_includes',
  'Amenities Included': '33_hoa_includes',
  'Ownership': '34_ownership_type',
  'Ownership Type': '34_ownership_type',
  'Fee Simple': '34_ownership_type',
  'Taxes': '35_annual_taxes',
  'Annual Taxes': '35_annual_taxes',
  'Tax Amount': '35_annual_taxes',
  'Property Tax': '35_annual_taxes',
  'Real Estate Tax': '35_annual_taxes',
  'Tax Year': '36_tax_year',
  'Property Tax Year': '36_tax_year',
  'Mill Rate': '37_property_tax_rate',
  'Tax Rate': '37_property_tax_rate',
  'Property Tax Rate': '37_property_tax_rate',
  'Millage': '37_property_tax_rate',
  'Millage Rate': '37_property_tax_rate',
  'Tax Exemptions': '38_tax_exemptions',
  'Exemptions': '38_tax_exemptions',
  'Tax Exemption': '38_tax_exemptions',
  'HOA Pmt Sched': 'hoa_payment_schedule',

  // ================================================================
  // GROUP 5: STRUCTURE & SYSTEMS (Fields 39-48)
  // ================================================================
  'Roof': '39_roof_type',
  'Roof Type': '39_roof_type',
  'Roofing': '39_roof_type',
  'Roof Material': '39_roof_type',
  'Roof Age': '40_roof_age_est',
  'Roof Age Est': '40_roof_age_est',
  'Roof Year': '40_roof_age_est',
  'Year Roof': '40_roof_age_est',
  'Roof Installed': '40_roof_age_est',
  'Ext Construction': '41_exterior_material',
  'Exterior': '41_exterior_material',
  'Exterior Material': '41_exterior_material',
  'Construction': '41_exterior_material',
  'Construction Materials': '41_exterior_material',
  'Exterior Construction': '41_exterior_material',
  'Siding': '41_exterior_material',
  'Foundation': '42_foundation',
  'Foundation Type': '42_foundation',
  'Foundation Details': '42_foundation',
  'Water Heater': '43_water_heater_type',
  'Water Heater Type': '43_water_heater_type',
  'Hot Water': '43_water_heater_type',
  'Hot Water Heater': '43_water_heater_type',
  'Garage Type': '44_garage_type',
  'Garage Style': '44_garage_type',
  'Garage Description': '44_garage_type',
  'A/C': '45_hvac_type',
  'Heat/Fuel': '45_hvac_type',
  'HVAC': '45_hvac_type',
  'Heating': '45_hvac_type',
  'Cooling': '45_hvac_type',
  'Heating Type': '45_hvac_type',
  'Cooling Type': '45_hvac_type',
  'Central Air': '45_hvac_type',
  'Air Conditioning': '45_hvac_type',
  'HVAC Age': '46_hvac_age',
  'AC Age': '46_hvac_age',
  'Age of HVAC': '46_hvac_age',
  'HVAC Year': '46_hvac_age',
  'Laundry Features': '47_laundry_type',
  'Laundry': '47_laundry_type',
  'Laundry Room': '47_laundry_type',
  'Washer/Dryer': '47_laundry_type',
  'Property Condition': '48_interior_condition',
  'Interior Condition': '48_interior_condition',
  'Condition': '48_interior_condition',
  'Overall Condition': '48_interior_condition',

  // ================================================================
  // GROUP 6: INTERIOR FEATURES (Fields 49-53)
  // ================================================================
  'Flooring Covering': '49_flooring_type',
  'Flooring': '49_flooring_type',
  'Floor': '49_flooring_type',
  'Floor Covering': '49_flooring_type',
  'Floors': '49_flooring_type',
  'Kitchen': '50_kitchen_features',
  'Kitchen Features': '50_kitchen_features',
  'Kitchen Description': '50_kitchen_features',
  'Appliances Incl': '51_appliances_included',
  'Appliances': '51_appliances_included',
  'Appliances Included': '51_appliances_included',
  'Equipment': '51_appliances_included',
  'Fireplace': '52_fireplace_yn',
  'Fireplace Y/N': '52_fireplace_yn',
  'Has Fireplace': '52_fireplace_yn',
  'Fireplaces': '53_fireplace_count',
  '# Fireplaces': '53_fireplace_count',
  'Number of Fireplaces': '53_fireplace_count',
  'Fireplace Count': '53_fireplace_count',

  // ================================================================
  // GROUP 7: EXTERIOR FEATURES (Fields 54-58)
  // ================================================================
  'Pool': '54_pool_yn',
  'Pool Y/N': '54_pool_yn',
  'Has Pool': '54_pool_yn',
  'Private Pool': '54_pool_yn',
  'Pool Type': '55_pool_type',
  'Pool Features': '55_pool_type',
  'Pool Description': '55_pool_type',
  'Deck': '56_deck_patio',
  'Patio': '56_deck_patio',
  'Deck/Patio': '56_deck_patio',
  'Patio And Porch Features': '56_deck_patio',
  'Porch': '56_deck_patio',
  'Outdoor Living': '56_deck_patio',
  'Fence': '57_fence',
  'Fencing': '57_fence',
  'Fence Type': '57_fence',
  'Fenced': '57_fence',
  'Landscaping': '58_landscaping',
  'Landscape': '58_landscaping',
  'Lot Description': '58_landscaping',
  'Yard': '58_landscaping',

  // ================================================================
  // GROUP 8: PERMITS & RENOVATIONS (Fields 59-62)
  // ================================================================
  'Recent Renovations': '59_recent_renovations',
  'Renovations': '59_recent_renovations',
  'Updates': '59_recent_renovations',
  'Improvements': '59_recent_renovations',
  'Recent Updates': '59_recent_renovations',
  'Upgrades': '59_recent_renovations',
  'Remodeled': '59_recent_renovations',
  'Roof Permit': '60_permit_history_roof',
  'Permit History Roof': '60_permit_history_roof',
  'HVAC Permit': '61_permit_history_hvac',
  'Permit History HVAC': '61_permit_history_hvac',
  'Other Permits': '62_permit_history_other',
  'Building Permits': '62_permit_history_other',
  'Permit History': '62_permit_history_other',

  // ================================================================
  // GROUP 9: SCHOOLS (Fields 63-73)
  // ================================================================
  'School District': '63_school_district',
  'District': '63_school_district',
  'School District Name': '63_school_district',
  'Elevation': '64_elevation_feet',
  'Elevation Feet': '64_elevation_feet',
  'Property Elevation': '64_elevation_feet',
  'Feet Above Sea Level': '64_elevation_feet',
  'Elementary School': '65_elementary_school',
  'Elementary': '65_elementary_school',
  'Assigned Elementary': '65_elementary_school',
  'Elementary Rating': '66_elementary_rating',
  'Elementary School Rating': '66_elementary_rating',
  'Elementary Distance': '67_elementary_distance_mi',
  'Elementary Distance Miles': '67_elementary_distance_mi',
  'Middle School': '68_middle_school',
  'Middle': '68_middle_school',
  'Assigned Middle': '68_middle_school',
  'Middle Rating': '69_middle_rating',
  'Middle School Rating': '69_middle_rating',
  'Middle Distance': '70_middle_distance_mi',
  'Middle Distance Miles': '70_middle_distance_mi',
  'High School': '71_high_school',
  'High': '71_high_school',
  'Assigned High': '71_high_school',
  'High Rating': '72_high_rating',
  'High School Rating': '72_high_rating',
  'High Distance': '73_high_distance_mi',
  'High Distance Miles': '73_high_distance_mi',

  // ================================================================
  // GROUP 10: LOCATION SCORES (Fields 74-82)
  // ================================================================
  'Walk Score': '74_walk_score',
  'WalkScore': '74_walk_score',
  'Transit Score': '75_transit_score',
  'TransitScore': '75_transit_score',
  'Bike Score': '76_bike_score',
  'BikeScore': '76_bike_score',
  'Safety Score': '77_safety_score',
  'Safety': '77_safety_score',
  'Noise Level': '78_noise_level',
  'Noise': '78_noise_level',
  'Sound Score': '78_noise_level',
  'Traffic Level': '79_traffic_level',
  'Traffic': '79_traffic_level',
  'Walkability Description': '80_walkability_description',
  'Walkability': '80_walkability_description',
  'Public Transit Access': '81_public_transit_access',
  'Transit Access': '81_public_transit_access',
  'Public Transit': '81_public_transit_access',
  'Commute to City Center': '82_commute_to_city_center',
  'Commute Time': '82_commute_to_city_center',
  'Downtown Commute': '82_commute_to_city_center',

  // ================================================================
  // GROUP 11: DISTANCES & AMENITIES (Fields 83-87)
  // ================================================================
  'Distance to Grocery': '83_distance_grocery_mi',
  'Grocery Distance': '83_distance_grocery_mi',
  'Nearest Grocery': '83_distance_grocery_mi',
  'Distance to Hospital': '84_distance_hospital_mi',
  'Hospital Distance': '84_distance_hospital_mi',
  'Nearest Hospital': '84_distance_hospital_mi',
  'Distance to Airport': '85_distance_airport_mi',
  'Airport Distance': '85_distance_airport_mi',
  'Nearest Airport': '85_distance_airport_mi',
  'Distance to Park': '86_distance_park_mi',
  'Park Distance': '86_distance_park_mi',
  'Nearest Park': '86_distance_park_mi',
  'Distance to Beach': '87_distance_beach_mi',
  'Beach Distance': '87_distance_beach_mi',
  'Nearest Beach': '87_distance_beach_mi',
  'Beach Access': '87_distance_beach_mi',

  // ================================================================
  // GROUP 12: SAFETY & CRIME (Fields 88-90)
  // ================================================================
  'Violent Crime Index': '88_violent_crime_index',
  'Violent Crime': '88_violent_crime_index',
  'Property Crime Index': '89_property_crime_index',
  'Property Crime': '89_property_crime_index',
  'Neighborhood Safety Rating': '90_neighborhood_safety_rating',
  'Safety Rating': '90_neighborhood_safety_rating',
  'Crime Rating': '90_neighborhood_safety_rating',

  // ================================================================
  // GROUP 13: MARKET & INVESTMENT (Fields 91-103)
  // ================================================================
  'Median Home Price': '91_median_home_price_neighborhood',
  'Neighborhood Median Price': '91_median_home_price_neighborhood',
  'Area Median Price': '91_median_home_price_neighborhood',
  'Price Per SqFt Avg': '92_price_per_sqft_recent_avg',
  'Average Price Per SqFt': '92_price_per_sqft_recent_avg',
  'Area Price Per SqFt': '92_price_per_sqft_recent_avg',
  'Price to Rent Ratio': '93_price_to_rent_ratio',
  'Price vs Median': '94_price_vs_median_percent',
  'ADOM': '95_days_on_market_avg',
  'CDOM': '95_days_on_market_avg',
  'Days on Market': '95_days_on_market_avg',
  'DOM': '95_days_on_market_avg',
  'Average Days on Market': '95_days_on_market_avg',
  'Market Days': '95_days_on_market_avg',
  'Inventory': '96_inventory_surplus',
  'Market Inventory': '96_inventory_surplus',
  'Insurance Estimate': '97_insurance_est_annual',
  'Insurance': '97_insurance_est_annual',
  'Annual Insurance': '97_insurance_est_annual',
  'Rental Estimate': '98_rental_estimate_monthly',
  'Rent Estimate': '98_rental_estimate_monthly',
  'Monthly Rent': '98_rental_estimate_monthly',
  'Rental Income': '98_rental_estimate_monthly',
  'Rental Yield': '99_rental_yield_est',
  'Yield': '99_rental_yield_est',
  'Vacancy Rate': '100_vacancy_rate_neighborhood',
  'Cap Rate': '101_cap_rate_est',
  'Capitalization Rate': '101_cap_rate_est',
  'Financing Terms': '102_financing_terms',
  'Financing': '102_financing_terms',
  'Loan Terms': '102_financing_terms',
  'Comparable Sales': '103_comparable_sales',
  'Comps': '103_comparable_sales',
  'Recent Sales': '103_comparable_sales',

  // ================================================================
  // GROUP 14: UTILITIES & CONNECTIVITY (Fields 104-116)
  // ================================================================
  'Electric Provider': '104_electric_provider',
  'Electric Company': '104_electric_provider',
  'Power Company': '104_electric_provider',
  'Electric': '104_electric_provider',
  'Avg Electric Bill': '105_avg_electric_bill',
  'Electric Bill': '105_avg_electric_bill',
  'Average Electric': '105_avg_electric_bill',
  'Water Provider': '106_water_provider',
  'Water Company': '106_water_provider',
  'Water Source': '106_water_provider',
  'Water': '106_water_provider',
  'Avg Water Bill': '107_avg_water_bill',
  'Water Bill': '107_avg_water_bill',
  'Average Water': '107_avg_water_bill',
  'Sewer Provider': '108_sewer_provider',
  'Sewer Company': '108_sewer_provider',
  'Sewer': '108_sewer_provider',
  'Sewer Type': '108_sewer_provider',
  'Natural Gas': '109_natural_gas',
  'Gas': '109_natural_gas',
  'Gas Service': '109_natural_gas',
  'Gas Provider': '109_natural_gas',
  'Trash Provider': '110_trash_provider',
  'Garbage Service': '110_trash_provider',
  'Trash Service': '110_trash_provider',
  'Waste Management': '110_trash_provider',
  'Internet Providers': '111_internet_providers_top3',
  'Internet': '111_internet_providers_top3',
  'ISP': '111_internet_providers_top3',
  'Max Internet Speed': '112_max_internet_speed',
  'Internet Speed': '112_max_internet_speed',
  'Broadband Speed': '112_max_internet_speed',
  'Fiber Available': '113_fiber_available',
  'Fiber': '113_fiber_available',
  'Fiber Optic': '113_fiber_available',
  'Cable TV Provider': '114_cable_tv_provider',
  'Cable Provider': '114_cable_tv_provider',
  'Cable': '114_cable_tv_provider',
  'Cell Coverage Quality': '115_cell_coverage_quality',
  'Cell Coverage': '115_cell_coverage_quality',
  'Mobile Coverage': '115_cell_coverage_quality',
  'Emergency Services Distance': '116_emergency_services_distance',
  'Emergency Services': '116_emergency_services_distance',
  'Fire Station Distance': '116_emergency_services_distance',

  // ================================================================
  // GROUP 15: ENVIRONMENT & RISK (Fields 117-130)
  // ================================================================
  'Air Quality Index': '117_air_quality_index',
  'AQI': '117_air_quality_index',
  'Air Quality': '117_air_quality_index',
  'Air Quality Grade': '118_air_quality_grade',
  'Flood Zone': '119_flood_zone',
  'Flood Zone Code': '119_flood_zone',
  'FEMA Flood Zone': '119_flood_zone',
  'Flood Risk Level': '120_flood_risk_level',
  'Flood Risk': '120_flood_risk_level',
  'Climate Risk': '121_climate_risk',
  'Climate': '121_climate_risk',
  'Wildfire Risk': '122_wildfire_risk',
  'Fire Risk': '122_wildfire_risk',
  'Earthquake Risk': '123_earthquake_risk',
  'Seismic Risk': '123_earthquake_risk',
  'Hurricane Risk': '124_hurricane_risk',
  'Storm Risk': '124_hurricane_risk',
  'Tornado Risk': '125_tornado_risk',
  'Radon Risk': '126_radon_risk',
  'Radon': '126_radon_risk',
  'Superfund Site Nearby': '127_superfund_site_nearby',
  'Superfund': '127_superfund_site_nearby',
  'Environmental Hazard': '127_superfund_site_nearby',
  'Sea Level Rise Risk': '128_sea_level_rise_risk',
  'Sea Level Rise': '128_sea_level_rise_risk',
  'Coastal Flood Risk': '128_sea_level_rise_risk',
  'Noise Level dB': '129_noise_level_db_est',
  'Noise dB': '129_noise_level_db_est',
  'Decibel Level': '129_noise_level_db_est',
  'Solar Potential': '130_solar_potential',
  'Solar': '130_solar_potential',
  'Solar Score': '130_solar_potential',
  'Flood Zone Date': 'flood_zone_date',
  'Flood Zone Panel': 'flood_zone_panel',

  // ================================================================
  // LOCATION (parsed separately)
  // ================================================================
  'City': 'city',
  'State': 'state',
  'Subdiv': '149_subdivision_name',
  'Subdivision': '149_subdivision_name',
  'Subdivision Name': '149_subdivision_name',
  'SE/TP/RG': 'section_township_range',
  'Zoning': 'zoning',
  'Future Land Use': 'future_land_use',

  // ================================================================
  // STELLAR MLS - PARKING (Fields 139-143)
  // ================================================================
  'Carport': '139_carport_yn',
  'Carport Y/N': '139_carport_yn',
  'Carport Spcs': '140_carport_spaces',
  'Carport Spaces': '140_carport_spaces',
  'Attch': '141_garage_attached_yn',
  'Garage Attached': '141_garage_attached_yn',
  'Attached Garage': '141_garage_attached_yn',
  'Garage/Parking Features': '142_parking_features',
  'Parking Features': '142_parking_features',
  'Assigned Spcs': '143_assigned_parking_spaces',
  'Assigned Parking': '143_assigned_parking_spaces',

  // ================================================================
  // STELLAR MLS - BUILDING (Fields 144-148)
  // ================================================================
  'Floor #': '144_floor_number',
  'Floor Number': '144_floor_number',
  'Unit Floor': '144_floor_number',
  'Total # of Floors': '145_building_total_floors',
  'Building Floors': '145_building_total_floors',
  'Total Floors': '145_building_total_floors',
  'Bldg Name/#': '146_building_name_number',
  'Building Name': '146_building_name_number',
  'Building Number': '146_building_name_number',
  'Building Elevator Y/N': '147_building_elevator_yn',
  'Elevator': '147_building_elevator_yn',
  'Elevator Y/N': '147_building_elevator_yn',
  'Floors in Unit/Home': '148_floors_in_unit',
  'Floors In Unit': '148_floors_in_unit',

  // ================================================================
  // STELLAR MLS - LEGAL (Fields 149-154)
  // ================================================================
  'Legal Desc': '150_legal_description',
  'Legal Description': '150_legal_description',
  'Legal': '150_legal_description',
  'Homestead': '151_homestead_yn',
  'Homestead Y/N': '151_homestead_yn',
  'CDD': '152_cdd_yn',
  'CDD Y/N': '152_cdd_yn',
  'Annual CDD Fee': '153_annual_cdd_fee',
  'CDD Fee': '153_annual_cdd_fee',
  'Annual CDD': '153_annual_cdd_fee',
  'Front Exposure': '154_front_exposure',
  'Exposure': '154_front_exposure',
  'Direction Faces': '154_front_exposure',

  // ================================================================
  // STELLAR MLS - WATERFRONT (Fields 155-159)
  // ================================================================
  'Water Frontage': '155_water_frontage_yn',
  'Waterfront': '155_water_frontage_yn',
  'Waterfront Y/N': '155_water_frontage_yn',
  'Waterfront Ft': '156_waterfront_feet',
  'Waterfront Feet': '156_waterfront_feet',
  'Water Feet': '156_waterfront_feet',
  'Frontage Feet': '156_waterfront_feet',
  'Water Access': '157_water_access_yn',
  'Water Access Y/N': '157_water_access_yn',
  'Water View': '158_water_view_yn',
  'Water View Y/N': '158_water_view_yn',
  'Water Name': '159_water_body_name',
  'Water Body': '159_water_body_name',
  'Body of Water': '159_water_body_name',
  'Water Extras': 'water_extras',
  'Addtl Water Info': 'additional_water_info',

  // ================================================================
  // STELLAR MLS - LEASING (Fields 160-165)
  // ================================================================
  'Can Property be Leased': '160_can_be_leased_yn',
  'Can Be Leased': '160_can_be_leased_yn',
  'Lease': '160_can_be_leased_yn',
  'Lease Allowed': '160_can_be_leased_yn',
  'Minimum Lease Period': '161_minimum_lease_period',
  'Minimum Lease': '161_minimum_lease_period',
  'Min Lease': '161_minimum_lease_period',
  'Lease Period': '161_minimum_lease_period',
  'Lease Restrictions': '162_lease_restrictions_yn',
  'Pet Size': '163_pet_size_limit',
  'Pet Limit': '163_pet_size_limit',
  '# of Pets': '163_pet_size_limit',
  'Max Pet Wt': '164_max_pet_weight',
  'Max Pet Weight': '164_max_pet_weight',
  'Pet Weight': '164_max_pet_weight',
  'Pet Restrictions': 'pet_restrictions',
  'Association Approval Required': '165_association_approval_yn',
  'Association Approval': '165_association_approval_yn',
  'HOA Approval': '165_association_approval_yn',
  'Approval Process': 'approval_process',
  'Years of Ownership Prior to Leasing Required': 'years_ownership_before_lease',

  // ================================================================
  // STELLAR MLS - FEATURES (Fields 166-168)
  // ================================================================
  'Community Features': '166_community_features',
  'Community Amenities': '166_community_features',
  'HOA Amenities': '166_community_features',
  'Neighborhood Amenities': '166_community_features',
  'Interior Feat': '167_interior_features',
  'Interior Features': '167_interior_features',
  'Interior': '167_interior_features',
  'Interior Amenities': '167_interior_features',
  'Ext Features': '168_exterior_features',
  'Exterior Features': '168_exterior_features',
  'Outdoor Features': '168_exterior_features',

  // ================================================================
  // GROUP 16: ADDITIONAL FEATURES (Fields 131-138)
  // ================================================================
  'View': '131_view_type',
  'View Type': '131_view_type',
  'Property View': '131_view_type',
  'Views': '131_view_type',
  'Lot Features': '132_lot_features',
  'Lot Description': '132_lot_features',
  'Lot Characteristics': '132_lot_features',
  'EV Charging': '133_ev_charging',
  'Electric Vehicle Charging': '133_ev_charging',
  'EV Charger': '133_ev_charging',
  'Electric Car Charging': '133_ev_charging',
  'Smart Home Features': '134_smart_home_features',
  'Smart Home': '134_smart_home_features',
  'Home Automation': '134_smart_home_features',
  'Smart Features': '134_smart_home_features',
  'Accessibility Features': '135_accessibility_modifications',
  'Accessibility': '135_accessibility_modifications',
  'Accessibility Modifications': '135_accessibility_modifications',
  'ADA Features': '135_accessibility_modifications',
  'Handicap Features': '135_accessibility_modifications',
  'Pets': '136_pet_policy',
  'Pet Policy': '136_pet_policy',
  'Pet Rules': '136_pet_policy',
  'Pets Allowed': '136_pet_policy',
  'Age Restrictions': '137_age_restrictions',
  'Age Restriction': '137_age_restrictions',
  'Senior Community': '137_age_restrictions',
  '55+': '137_age_restrictions',
  '55+ Community': '137_age_restrictions',
  'Special Assessments': '138_special_assessments',
  'Special Assessment': '138_special_assessments',
  'Assessments': '138_special_assessments',

  // ================================================================
  // ADDITIONAL UNMAPPED FIELDS (kept for reference)
  // ================================================================
  'Patio And Porch Features': '56_deck_patio',
  'New Construction': 'new_construction_yn',
  'Home Warranty Y/N': 'home_warranty_yn',
  'Utilities': 'utilities',
  'Security Feat': 'security_features',
  'Window Features': 'window_features',
  'Furnishings': 'furnishings',
  'Road Surface Type': 'road_surface',
  'Special Sale': 'special_sale_type',
  'Max Times per Yr': 'max_lease_times_per_year',
};

// Helper to normalize field names for matching
function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Detect source type based on extracted field names
function detectSourceType(rawFields: Record<string, any>): 'stellar_mls' | 'zillow' | 'realtor' | 'redfin' | 'unknown' {
  const fieldNames = Object.keys(rawFields).map(k => k.toLowerCase());
  const fieldNamesJoined = fieldNames.join(' ');

  // Stellar MLS indicators (from CustomerFull PDF)
  const stellarMLSIndicators = [
    'subdiv', 'adom', 'cdom', 'bldg name', 'floor #', 'ext construction',
    'heated area', 'total annual assoc fees', 'hoa / comm assn',
    'legal desc', 'se/tp/rg', 'tax id', 'homestead', 'cdd',
    'flooring covering', 'interior feat', 'ext features', 'appliances incl'
  ];

  // Zillow indicators
  const zillowIndicators = [
    'zestimate', 'rent zestimate', 'zillow home id', 'zillow url',
    'zillow estimate', 'home value', 'property taxes'
  ];

  // Realtor.com indicators
  const realtorIndicators = [
    'realtor listing id', 'realtor.com', 'property history',
    'listing courtesy', 'mls information'
  ];

  // Redfin indicators
  const redfinIndicators = [
    'redfin estimate', 'redfin listing', 'hot home', 'redfin'
  ];

  // Count matches
  let stellarCount = stellarMLSIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let zillowCount = zillowIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let realtorCount = realtorIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;
  let redfinCount = redfinIndicators.filter(ind => fieldNamesJoined.includes(ind)).length;

  // Return highest match (Stellar MLS is most likely for PDF uploads)
  if (stellarCount >= 3) return 'stellar_mls';
  if (zillowCount >= 2) return 'zillow';
  if (realtorCount >= 2) return 'realtor';
  if (redfinCount >= 2) return 'redfin';

  // Default to stellar_mls for PDF uploads since that's the primary use case
  return 'stellar_mls';
}

// Map raw extracted fields to our schema
function mapFieldsToSchema(rawFields: Record<string, any>): { fields: Record<string, any>; sourceType: string; mappedCount: number; unmappedCount: number } {
  const mappedFields: Record<string, any> = {};
  let mappedCount = 0;
  let unmappedCount = 0;

  // Detect source type
  const sourceType = detectSourceType(rawFields);
  const sourceName = sourceType === 'stellar_mls' ? 'Stellar MLS PDF' :
                     sourceType === 'zillow' ? 'Zillow' :
                     sourceType === 'realtor' ? 'Realtor.com' :
                     sourceType === 'redfin' ? 'Redfin' : 'MLS PDF';

  for (const [rawKey, value] of Object.entries(rawFields)) {
    // Skip null/empty values
    if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'n/a') {
      continue;
    }

    // Try exact match first
    let schemaKey = MLS_FIELD_MAPPING[rawKey];

    // Try case-insensitive match
    if (!schemaKey) {
      for (const [mlsKey, sKey] of Object.entries(MLS_FIELD_MAPPING)) {
        if (normalizeFieldName(mlsKey) === normalizeFieldName(rawKey)) {
          schemaKey = sKey;
          break;
        }
      }
    }

    // If we found a mapping, add to result
    if (schemaKey) {
      mappedFields[schemaKey] = {
        value: value,
        source: sourceName,
        confidence: 'High',
      };
      mappedCount++;
    } else {
      // Keep unmapped fields with original key (might be useful)
      const cleanKey = rawKey.toLowerCase().replace(/\s+/g, '_');
      mappedFields[cleanKey] = {
        value: value,
        source: sourceName,
        confidence: 'Medium',
      };
      unmappedCount++;
    }
  }

  return { fields: mappedFields, sourceType, mappedCount, unmappedCount };
}

// Parse PDF using Claude's vision capability
async function parsePdfWithClaude(pdfBase64: string): Promise<Record<string, any>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are a Stellar MLS data extraction expert. Extract ALL property data from this Stellar MLS CustomerFull PDF sheet.

CRITICAL: Use the EXACT field names as they appear in the Stellar MLS PDF. Here are the standard Stellar MLS field names to look for:

**Header Section:**
- MLS# (e.g., "TB8449505")
- Address (full street address from header)
- County, Status, List Price
- Subdiv (subdivision name)
- Beds, Baths (format: "2/0" for full/half)
- Year Built, Property Style, Pool
- ADOM, CDOM (days on market)
- Pets, Minimum Lease Period
- Garage, Attch (attached), Spcs (spaces), Carport, Carport Spcs
- Garage/Parking Features, Assigned Spcs
- LP/SqFt, Heated Area, Total Area
- Flood Zone Code, Total Annual Assoc Fees, Average Monthly Fees

**Land, Site, and Tax Information:**
- Legal Desc, SE/TP/RG, Zoning
- Tax ID, Taxes, Tax Year
- Homestead, CDD, Annual CDD Fee
- Front Exposure, Lot Size Acres, Lot Size
- Water Frontage, Waterfront Ft, Water Access, Water View, Water Name
- Floor #, Total # of Floors, Bldg Name/#, Floors in Unit/Home
- Flood Zone, Flood Zone Date, Flood Zone Panel

**Interior Information:**
- A/C, Heat/Fuel, Flooring Covering
- Laundry Features, Fireplace, Furnishings
- Utilities, Water, Sewer
- Interior Feat, Appliances Incl

**Exterior Information:**
- Ext Construction, Roof, Foundation
- Ext Features, Pool, Pool Features
- Road Surface Type

**Community Information:**
- Community Features, Fee Includes
- HOA / Comm Assn, HOA Fee, HOA Pmt Sched
- Monthly HOA Amount
- Pet Size, Max Pet Wt, # of Pets
- Can Property be Leased, Building Elevator Y/N
- Association Approval Required, Lease Restrictions
- Minimum Lease Period

Extract EVERY field you can find. Return a JSON object using the EXACT field names from the PDF.

Example output format:
{
  "MLS#": "TB8449505",
  "Address": "3200 GULF BLVD, #203, ST PETE BEACH, FL 33706",
  "County": "Pinellas",
  "Status": "Active",
  "Subdiv": "MARINA BAY OF ST PETERSBURG BEACH",
  "List Price": 1285000,
  "Beds": 3,
  "Baths": "2/0",
  "Year Built": 1982,
  "Property Style": "Condominium",
  "Pool": "Community",
  "ADOM": 8,
  "CDOM": 8,
  "Heated Area": 1345,
  "Total Area": 1345,
  "LP/SqFt": 955.39,
  "Carport": "Yes",
  "Carport Spcs": 2,
  "Garage/Parking Features": "Assigned Parking, Covered Parking, Ground Level, Guest Parking",
  "Assigned Spcs": 2,
  "Total Annual Assoc Fees": 13764.00,
  "Tax ID": "07-32-16-55250-100-2030",
  "Taxes": 11220,
  "Tax Year": 2024,
  "Homestead": "Yes",
  "CDD": "No",
  "Front Exposure": "South",
  "Floor #": 3,
  "Total # of Floors": 4,
  "Bldg Name/#": "100",
  "Floors in Unit/Home": "One",
  "Water Frontage": "No",
  "Waterfront Ft": 0,
  "Water Access": "No",
  "Water View": "No",
  "A/C": "Central Air",
  "Heat/Fuel": "Central",
  "Flooring Covering": "Luxury Vinyl, Tile, Wood",
  "Fireplace": "No",
  "Ext Construction": "Block, Stucco",
  "Roof": "Built-Up",
  "Foundation": "Stilt/On Piling",
  "Interior Feat": "Cathedral Ceiling(s), Primary Bedroom Main Floor, Walk-In Closet(s)",
  "Appliances Incl": "Dishwasher, Dryer, Range, Refrigerator, Washer",
  "Ext Features": "Balcony, Outdoor Shower, Sidewalk, Sliding Doors",
  "Community Features": "Association Recreation - Owned, Buyer Approval Required, Deed Restrictions, Golf Carts OK, Pool, Sidewalk",
  "Fee Includes": "Community Pool, Escrow Reserves Fund, Maintenance Exterior, Maintenance Grounds, Pool Maintenance, Sewer, Trash, Water",
  "HOA / Comm Assn": "Yes",
  "HOA Fee": 1147,
  "Monthly HOA Amount": 1147,
  "Pet Size": "Small (16-35 Lbs.)",
  "Max Pet Wt": 35,
  "Can Property be Leased": "Yes",
  "Building Elevator Y/N": "No",
  "Association Approval Required": "Yes",
  "Lease Restrictions": "Yes",
  "Minimum Lease Period": "3 Months",
  "Flood Zone": "AE",
  "Legal Desc": "MARINA BAY OF ST PETERSBURG BEACH CONDO BLDG 100, UNIT 203"
}

Return ONLY the JSON object, no markdown or explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[PDF PARSER] Claude API error:', response.status, errorData);
      throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('[PDF PARSER] Claude response received');

    if (data.content?.[0]?.text) {
      const text = data.content[0].text;

      // Try to extract JSON from response
      let jsonStr = text;

      // Remove markdown code blocks if present
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Find JSON object in text
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('[PDF PARSER] Extracted', Object.keys(parsed).length, 'raw fields');
        return parsed;
      }
    }

    throw new Error('Failed to parse Claude response');
  } catch (error) {
    console.error('[PDF PARSER] Error:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfBase64, filename } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: 'PDF data required' });
  }

  console.log('[PDF PARSER] Processing:', filename || 'unnamed.pdf');

  try {
    // Parse PDF with Claude
    const rawFields = await parsePdfWithClaude(pdfBase64);

    // Map to our schema with source detection
    const { fields: mappedFields, sourceType, mappedCount, unmappedCount } = mapFieldsToSchema(rawFields);

    const sourceName = sourceType === 'stellar_mls' ? 'Stellar MLS PDF' :
                       sourceType === 'zillow' ? 'Zillow' :
                       sourceType === 'realtor' ? 'Realtor.com' :
                       sourceType === 'redfin' ? 'Redfin' : 'MLS PDF';

    console.log(`[PDF PARSER] Source detected: ${sourceName}`);
    console.log(`[PDF PARSER] Mapped ${mappedCount} fields, ${unmappedCount} unmapped`);

    return res.status(200).json({
      success: true,
      fields: mappedFields,
      rawFieldCount: Object.keys(rawFields).length,
      mappedFieldCount: mappedCount,
      unmappedFieldCount: unmappedCount,
      sourceType: sourceType,
      source: sourceName,
    });
  } catch (error) {
    console.error('[PDF PARSER] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse PDF',
      fields: {},
      sourceType: 'unknown',
      source: 'Unknown',
    });
  }
}

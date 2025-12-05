/**
 * Bridge Interactive API to CLUES Schema Field Mapper
 * Maps RESO Web API fields from Bridge Interactive to our 168-field schema
 * SOURCE OF TRUTH: src/types/fields-schema.ts
 */

import type { BridgeProperty } from './bridge-api-client.js';

export interface MappedField {
  value: any;
  source: string;
  confidence: 'High' | 'Medium-High' | 'Medium' | 'Low';
}

export interface MappedPropertyData {
  fields: Record<string, MappedField>;
  rawData?: BridgeProperty;
  mappedCount: number;
  unmappedCount: number;
}

/**
 * Convert HOA fee to annual if frequency is provided
 */
function convertToAnnualHOA(fee: number, frequency?: string): number {
  if (!frequency) return fee;

  const freq = frequency.toLowerCase();
  if (freq.includes('month')) return fee * 12;
  if (freq.includes('quarter')) return fee * 4;
  if (freq.includes('week')) return fee * 52;
  if (freq.includes('year') || freq.includes('annual')) return fee;

  // Default to monthly if unclear
  return fee * 12;
}

/**
 * Map Bridge Interactive RESO property to CLUES schema
 */
export function mapBridgePropertyToSchema(property: BridgeProperty): MappedPropertyData {
  const fields: Record<string, MappedField> = {};
  let mappedCount = 0;
  let unmappedCount = 0;

  const source = 'Stellar MLS';

  // Helper to add field
  const addField = (key: string, value: any, confidence: 'High' | 'Medium-High' | 'Medium' | 'Low' = 'High') => {
    if (value !== null && value !== undefined && value !== '') {
      fields[key] = { value, source, confidence };
      mappedCount++;
    }
  };

  // ================================================================
  // GROUP 1: Address & Identity (Fields 1-9)
  // ================================================================
  addField('1_full_address', property.UnparsedAddress);
  addField('2_mls_primary', property.ListingId || property.ListingKey);
  addField('4_listing_status', property.StandardStatus || property.MlsStatus);
  addField('5_listing_date', property.ListingContractDate || property.OnMarketDate);
  addField('6_neighborhood', property.SubdivisionName);
  addField('7_county', property.County);
  addField('8_zip_code', property.PostalCode);
  addField('9_parcel_id', property.ParcelNumber);

  // ================================================================
  // GROUP 2: Pricing & Value (Fields 10-16)
  // ================================================================
  addField('10_listing_price', property.ListPrice);

  // Calculate price per sqft if not provided
  if (property.ListPrice && property.LivingArea && property.LivingArea > 0) {
    const pricePerSqft = property.ListPrice / property.LivingArea;
    addField('11_price_per_sqft', Math.round(pricePerSqft * 100) / 100);
  }

  addField('13_last_sale_date', property.CloseDate);
  addField('14_last_sale_price', property.ClosePrice);
  addField('15_assessed_value', property.TaxAssessedValue);

  // ================================================================
  // GROUP 3: Property Basics (Fields 17-29)
  // ================================================================
  addField('17_bedrooms', property.BedroomsTotal);
  addField('18_full_bathrooms', property.BathroomsFull);
  addField('19_half_bathrooms', property.BathroomsHalf);
  addField('20_total_bathrooms', property.BathroomsTotalInteger);
  addField('21_living_sqft', property.LivingArea);
  addField('22_total_sqft_under_roof', property.BuildingAreaTotal);
  addField('23_lot_size_sqft', property.LotSizeSquareFeet);
  addField('24_lot_size_acres', property.LotSizeAcres);
  addField('25_year_built', property.YearBuilt);
  addField('26_property_type', property.PropertyType || property.PropertySubType);
  addField('27_stories', property.Stories || property.StoriesTotal);
  addField('28_garage_spaces', property.GarageSpaces);
  addField('29_parking_total', property.ParkingTotal);

  // ================================================================
  // GROUP 4: HOA & Taxes (Fields 30-38)
  // ================================================================
  addField('30_hoa_yn', property.AssociationYN);

  // Convert HOA fee to annual
  if (property.AssociationFee) {
    const annualFee = convertToAnnualHOA(property.AssociationFee, property.AssociationFeeFrequency);
    addField('31_hoa_fee_annual', annualFee);
  }

  addField('32_hoa_name', property.AssociationName);

  // HOA includes (from multiple possible fields)
  if (property.AssociationFeeIncludes && Array.isArray(property.AssociationFeeIncludes)) {
    addField('33_hoa_includes', property.AssociationFeeIncludes.join(', '));
  }

  addField('34_ownership_type', property.Ownership);
  addField('35_annual_taxes', property.TaxAnnualAmount);
  addField('36_tax_year', property.TaxYear);

  // ================================================================
  // GROUP 5: Structure & Systems (Fields 39-48)
  // ================================================================
  if (property.RoofType && Array.isArray(property.RoofType)) {
    addField('39_roof_type', property.RoofType[0]); // Take first roof type
  } else if (property.Roof) {
    addField('39_roof_type', property.Roof);
  }

  // Field 40: Calculate roof age from year
  if (property.RoofYear || property.YearRoofInstalled) {
    const roofYear = property.RoofYear || property.YearRoofInstalled;
    const currentYear = new Date().getFullYear();
    const age = currentYear - roofYear;
    addField('40_roof_age_est', `${age} years (installed ${roofYear})`);
  } else if (property.PermitRoof) {
    addField('40_roof_age_est', `Recent permit: ${property.PermitRoof}`, 'Medium');
  }

  if (property.ConstructionMaterials && Array.isArray(property.ConstructionMaterials)) {
    addField('41_exterior_material', property.ConstructionMaterials.join(', '));
  } else if (property.ExteriorFeatures && Array.isArray(property.ExteriorFeatures)) {
    addField('41_exterior_material', property.ExteriorFeatures[0]);
  }

  if (property.FoundationType && Array.isArray(property.FoundationType)) {
    addField('42_foundation', property.FoundationType[0]);
  } else if (property.FoundationDetails) {
    addField('42_foundation', property.FoundationDetails);
  }

  addField('43_water_heater_type', property.WaterHeaterType);
  addField('44_garage_type', property.GarageType);

  // HVAC - combine heating and cooling
  const hvacParts = [];
  if (property.Heating && Array.isArray(property.Heating)) {
    hvacParts.push(...property.Heating);
  }
  if (property.Cooling && Array.isArray(property.Cooling)) {
    hvacParts.push(...property.Cooling);
  }
  if (hvacParts.length > 0) {
    addField('45_hvac_type', hvacParts.join(', '));
  }

  addField('46_hvac_age', property.CoolingYN);

  if (property.LaundryFeatures && Array.isArray(property.LaundryFeatures)) {
    addField('47_laundry_type', property.LaundryFeatures.join(', '));
  }

  addField('48_interior_condition', property.PropertyCondition);

  // ================================================================
  // GROUP 6: Interior Features (Fields 49-53)
  // ================================================================
  if (property.Flooring && Array.isArray(property.Flooring)) {
    addField('49_flooring_type', property.Flooring.join(', '));
  }

  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    // Extract kitchen features if mentioned
    const kitchenFeats = property.InteriorFeatures.filter(f =>
      f.toLowerCase().includes('kitchen') ||
      f.toLowerCase().includes('granite') ||
      f.toLowerCase().includes('stainless')
    );
    if (kitchenFeats.length > 0) {
      addField('50_kitchen_features', kitchenFeats.join(', '));
    }
  }

  if (property.Appliances && Array.isArray(property.Appliances)) {
    addField('51_appliances_included', property.Appliances.join(', '));
  }

  addField('52_fireplace_yn', property.FireplaceYN);
  addField('53_fireplace_count', property.FireplacesTotal);

  // ================================================================
  // GROUP 7: Exterior Features (Fields 54-58)
  // ================================================================
  addField('54_pool_yn', property.PoolPrivateYN);

  if (property.PoolFeatures && Array.isArray(property.PoolFeatures)) {
    addField('55_pool_type', property.PoolFeatures[0]);
  }

  if (property.PatioAndPorchFeatures && Array.isArray(property.PatioAndPorchFeatures)) {
    addField('56_deck_patio', property.PatioAndPorchFeatures.join(', '));
  }

  if (property.Fencing && Array.isArray(property.Fencing)) {
    addField('57_fence', property.Fencing.join(', '));
  }

  if (property.LotFeatures && Array.isArray(property.LotFeatures)) {
    addField('58_landscaping', property.LotFeatures.join(', '));
  }

  // ================================================================
  // GROUP 8: Permits & Renovations (Fields 59-62)
  // ================================================================
  addField('60_permit_history_roof', property.PermitRoof);
  addField('61_permit_history_hvac', property.PermitHVAC);
  addField('62_permit_history_other', property.PermitAdditions);

  // Alternative: Extract from remarks if not in structured fields
  if (!property.PermitRoof && property.PublicRemarks) {
    const roofMatch = property.PublicRemarks.match(/roof.*(?:permit|replace|install|new).*(20\d{2})/i);
    if (roofMatch) {
      addField('60_permit_history_roof', `Roof work mentioned: ${roofMatch[0]}`, 'Medium');
    }
  }

  // ================================================================
  // GROUP 9: Schools (Fields 63-73)
  // ================================================================
  addField('63_school_district', property.SchoolDistrict);
  addField('64_elevation_feet', property.Elevation);
  addField('65_elementary_school', property.ElementarySchool);
  addField('68_middle_school', property.MiddleOrJuniorSchool);
  addField('71_high_school', property.HighSchool);

  // ================================================================
  // GROUP 13: Market & Investment (Fields 91-103)
  // ================================================================
  addField('95_days_on_market_avg', property.DaysOnMarket || property.CumulativeDaysOnMarket);

  // ================================================================
  // GROUP 15: Environment & Risk (Fields 117-130)
  // ================================================================
  addField('119_flood_zone', property.FloodZone);

  // ================================================================
  // GROUP 16: View & Location (Fields 131-138)
  // ================================================================
  if (property.View && Array.isArray(property.View)) {
    addField('131_view_type', property.View.join(', '));
  }

  if (property.LotFeatures && Array.isArray(property.LotFeatures)) {
    addField('132_lot_features', property.LotFeatures.join(', '));
  }

  // EV Charging
  if (property.GreenEnergyGeneration && Array.isArray(property.GreenEnergyGeneration)) {
    const evFeatures = property.GreenEnergyGeneration.filter(f =>
      f.toLowerCase().includes('electric vehicle') || f.toLowerCase().includes('ev')
    );
    if (evFeatures.length > 0) {
      addField('133_ev_charging', evFeatures.join(', '));
    }
  }

  // Smart Home
  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    const smartFeatures = property.InteriorFeatures.filter(f =>
      f.toLowerCase().includes('smart') || f.toLowerCase().includes('automation')
    );
    if (smartFeatures.length > 0) {
      addField('134_smart_home_features', smartFeatures.join(', '));
    }
  }

  // Accessibility
  if (property.AccessibilityFeatures && Array.isArray(property.AccessibilityFeatures)) {
    addField('135_accessibility_modifications', property.AccessibilityFeatures.join(', '));
  }

  // Pet policy
  if (property.PetsAllowed && Array.isArray(property.PetsAllowed)) {
    addField('136_pet_policy', property.PetsAllowed.join(', '));
  }

  // ================================================================
  // GROUP 18: Parking Details (Fields 139-143) - Stellar MLS
  // ================================================================
  addField('139_carport_yn', property.CarportYN);
  addField('140_carport_spaces', property.CarportSpaces);
  addField('141_garage_attached_yn', property.AttachedGarageYN);

  if (property.ParkingFeatures && Array.isArray(property.ParkingFeatures)) {
    addField('142_parking_features', property.ParkingFeatures.join(', '));
  }

  addField('143_assigned_parking_spaces', property.AssignedParkingSpaces);

  // ================================================================
  // GROUP 19: Building Details (Fields 144-148)
  // ================================================================
  addField('144_floor_number', property.UnitFloor);
  addField('145_building_total_floors', property.BuildingFloors);
  addField('146_building_name_number', property.BuildingName || property.BuildingNumber);
  addField('147_building_elevator_yn', property.ElevatorYN);
  addField('148_floors_in_unit', property.FloorsInUnit);

  // ================================================================
  // GROUP 20: Legal & Compliance (Fields 149-154)
  // ================================================================
  addField('149_subdivision_name', property.SubdivisionName);
  addField('150_legal_description', property.LegalDescription);
  addField('151_homestead_yn', property.HomesteadYN);
  addField('152_cdd_yn', property.CDDYN);
  addField('153_annual_cdd_fee', property.CDDAnnualFee);
  addField('154_front_exposure', property.DirectionFaces);

  // ================================================================
  // GROUP 21: Waterfront (Fields 155-159)
  // ================================================================
  addField('155_water_frontage_yn', property.WaterfrontYN);
  addField('156_waterfront_feet', property.WaterfrontFeet);
  addField('157_water_access_yn', property.WaterAccessYN);
  addField('158_water_view_yn', property.WaterViewYN);
  addField('159_water_body_name', property.WaterBodyName);

  // ================================================================
  // GROUP 22: Leasing (Fields 160-165)
  // ================================================================
  addField('160_can_be_leased_yn', property.LeaseConsideredYN);
  addField('161_minimum_lease_period', property.MinimumLeaseType || property.LeaseTerm);
  addField('162_lease_restrictions_yn', property.LeaseRestrictionsYN);
  addField('163_pet_size_limit', property.PetSizeLimit);
  addField('164_max_pet_weight', property.MaxPetWeight);
  addField('165_association_approval_yn', property.BuyerFinancingYN);

  // ================================================================
  // GROUP 23: Community & Features (Fields 166-168)
  // ================================================================
  if (property.CommunityFeatures && Array.isArray(property.CommunityFeatures)) {
    addField('166_community_features', property.CommunityFeatures.join(', '));
  }

  if (property.InteriorFeatures && Array.isArray(property.InteriorFeatures)) {
    addField('167_interior_features', property.InteriorFeatures.join(', '));
  }

  if (property.ExteriorFeatures && Array.isArray(property.ExteriorFeatures)) {
    addField('168_exterior_features', property.ExteriorFeatures.join(', '));
  }

  // ================================================================
  // Additional metadata
  // ================================================================
  if (property.PublicRemarks || property.Remarks) {
    addField('property_description', property.PublicRemarks || property.Remarks, 'Medium');
  }

  if (property.Latitude && property.Longitude) {
    addField('latitude', property.Latitude, 'High');
    addField('longitude', property.Longitude, 'High');
  }

  // ================================================================
  // PHOTOS - Extract from Media resource (Field 169)
  // ================================================================
  if (property.Media && Array.isArray(property.Media) && property.Media.length > 0) {
    console.log(`[Bridge Mapper] Found ${property.Media.length} photos for listing`);

    // Sort by order
    const sortedMedia = property.Media
      .filter(m => m.MediaURL)  // Only photos with URLs
      .sort((a, b) => (a.Order || 999) - (b.Order || 999));

    // Find preferred photo (marked by MLS)
    const preferredPhoto = sortedMedia.find(m => m.PreferredPhotoYN === true);

    // Use preferred photo, or first photo if no preferred
    const primaryPhotoUrl = preferredPhoto?.MediaURL || sortedMedia[0]?.MediaURL;

    if (primaryPhotoUrl) {
      addField('property_photo_url', primaryPhotoUrl, 'High');
      console.log('[Bridge Mapper] ✅ Primary photo URL extracted');
    }

    // Store all photo URLs for future gallery feature
    const allPhotoUrls = sortedMedia.map(m => m.MediaURL).filter(Boolean) as string[];
    if (allPhotoUrls.length > 0) {
      addField('property_photos', allPhotoUrls, 'High');
      console.log(`[Bridge Mapper] ✅ Stored ${allPhotoUrls.length} photos in gallery`);
    }
  }

  // Count unmapped fields
  const allPropertyKeys = Object.keys(property);
  unmappedCount = allPropertyKeys.length - mappedCount;

  return {
    fields,
    rawData: property,
    mappedCount,
    unmappedCount,
  };
}

/**
 * Map multiple Bridge properties to schema
 */
export function mapBridgePropertiesToSchema(properties: BridgeProperty[]): MappedPropertyData[] {
  return properties.map(property => mapBridgePropertyToSchema(property));
}

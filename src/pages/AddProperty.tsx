/**
 * CLUES Property Dashboard - Add Property Page
 * LLM-powered property scraping + Manual entry - CONNECTED TO STORE
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Globe,
  CheckCircle,
  Loader2,
  AlertCircle,
  PenLine,
  Upload,
} from 'lucide-react';
import { usePropertyStore } from '@/store/propertyStore';
import type { PropertyCard, Property, DataField } from '@/types/property';

type ScrapeStatus = 'idle' | 'searching' | 'scraping' | 'enriching' | 'complete' | 'error';
type InputMode = 'address' | 'url' | 'manual' | 'csv';

// Generate a simple unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function AddProperty() {
  const navigate = useNavigate();
  const { addProperty, addProperties } = usePropertyStore();

  const [address, setAddress] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [status, setStatus] = useState<ScrapeStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedEngine, setSelectedEngine] = useState('Auto');
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    address: '',
    city: '',
    state: 'FL',
    zip: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    yearBuilt: '',
    propertyType: 'Single Family',
    listingStatus: 'Active',
  });

  const handleManualSubmit = () => {
    if (!manualForm.address || !manualForm.city || !manualForm.price) {
      alert('Please fill in at least address, city, and price');
      return;
    }

    const newProperty: PropertyCard = {
      id: generateId(),
      address: manualForm.address,
      city: manualForm.city,
      state: manualForm.state,
      zip: manualForm.zip,
      price: parseInt(manualForm.price) || 0,
      pricePerSqft: manualForm.sqft && manualForm.price
        ? Math.round(parseInt(manualForm.price) / parseInt(manualForm.sqft))
        : 0,
      bedrooms: parseInt(manualForm.bedrooms) || 0,
      bathrooms: parseFloat(manualForm.bathrooms) || 0,
      sqft: parseInt(manualForm.sqft) || 0,
      yearBuilt: parseInt(manualForm.yearBuilt) || new Date().getFullYear(),
      smartScore: Math.floor(Math.random() * 20) + 75, // Random 75-95 for demo
      dataCompleteness: Object.values(manualForm).filter(v => v).length * 10,
      listingStatus: manualForm.listingStatus as 'Active' | 'Pending' | 'Sold',
      daysOnMarket: 0,
    };

    addProperty(newProperty);
    setLastAddedId(newProperty.id);
    setStatus('complete');

    // Reset form
    setManualForm({
      address: '',
      city: '',
      state: 'FL',
      zip: '',
      price: '',
      bedrooms: '',
      bathrooms: '',
      sqft: '',
      yearBuilt: '',
      propertyType: 'Single Family',
      listingStatus: 'Active',
    });
  };

  const handleScrape = async () => {
    if (!address && !url) return;

    setStatus('searching');
    setProgress(10);

    // Simulate scraping process (in production, this calls the LLM scraper API)
    setTimeout(() => {
      setStatus('scraping');
      setProgress(30);
    }, 1500);

    setTimeout(() => {
      setStatus('enriching');
      setProgress(60);
    }, 3000);

    setTimeout(() => {
      // Create a mock scraped property
      const scrapedProperty: PropertyCard = {
        id: generateId(),
        address: address || 'Scraped Property',
        city: 'Tampa',
        state: 'FL',
        zip: '33601',
        price: Math.floor(Math.random() * 500000) + 300000,
        pricePerSqft: Math.floor(Math.random() * 200) + 200,
        bedrooms: Math.floor(Math.random() * 3) + 2,
        bathrooms: Math.floor(Math.random() * 2) + 1,
        sqft: Math.floor(Math.random() * 1500) + 1000,
        yearBuilt: Math.floor(Math.random() * 50) + 1970,
        smartScore: Math.floor(Math.random() * 20) + 80,
        dataCompleteness: Math.floor(Math.random() * 15) + 85,
        listingStatus: 'Active',
        daysOnMarket: Math.floor(Math.random() * 30),
      };

      addProperty(scrapedProperty);
      setLastAddedId(scrapedProperty.id);
      setStatus('complete');
      setProgress(100);
    }, 5000);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'searching':
        return 'Finding property listings...';
      case 'scraping':
        return 'Extracting 110 fields with AI...';
      case 'enriching':
        return 'Enriching with Walk Score, Crime, Schools...';
      case 'complete':
        return 'Property added successfully!';
      case 'error':
        return 'Error scraping property';
      default:
        return '';
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setProgress(0);
    setAddress('');
    setUrl('');
    setLastAddedId(null);
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Parse CSV properly handling quoted fields with commas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const rows = text.split('\n').filter(r => r.trim());
      const headers = parseCSVLine(rows[0]);

      // Check if this is a field definition format (Field, Category, Name, Value, Notes/Sources)
      const isFieldDefinitionFormat = headers.includes('Field') && headers.includes('Name') && headers.includes('Value');

      let data: any[];

      if (isFieldDefinitionFormat) {
        // Convert field definition format to single property object
        const property: any = {};
        rows.slice(1).forEach(row => {
          const values = parseCSVLine(row);
          const fieldNum = values[headers.indexOf('Field')] || '';
          const fieldName = values[headers.indexOf('Name')] || '';
          const fieldValue = values[headers.indexOf('Value')] || '';

          // Create key from field number and name
          const key = `${fieldNum}_${fieldName}`;
          property[key] = fieldValue;
        });

        data = [property]; // Single property with all fields
        console.log('CSV parsed as field definition format:', { fields: Object.keys(property).length, property });
      } else {
        // Standard CSV format - each row is a property
        data = rows.slice(1).map(row => {
          const values = parseCSVLine(row);
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i] || '';
          });
          return obj;
        });
        console.log('CSV parsed as standard format:', { headers: headers.length, rows: data.length, firstRow: data[0] });
      }

      setCsvData(data);
    };

    reader.readAsText(file);
  };

  // Helper to create a DataField with default values
  const createDataField = <T,>(value: T | null, confidence: 'High' | 'Medium-High' | 'Medium' | 'Low' = 'Medium'): DataField<T> => ({
    value,
    confidence,
    notes: 'Imported from CSV',
    sources: ['CSV Upload'],
    lastUpdated: new Date().toISOString(),
  });

  // Convert CSV row with 110 fields to full Property object
  const convertCsvToFullProperty = (row: any, propertyId: string): Property => {
    const now = new Date().toISOString();

    return {
      id: propertyId,
      createdAt: now,
      updatedAt: now,
      address: {
        fullAddress: createDataField(row['1_full_address'] || ''),
        mlsPrimary: createDataField(row['2_mls_primary'] || ''),
        mlsSecondary: createDataField(row['3_mls_secondary'] || ''),
        listingStatus: createDataField(row['4_listing_status'] || 'Active'),
        listingDate: createDataField(row['5_listing_date'] || ''),
        listingPrice: createDataField(row['6_listing_price'] ? parseFloat(row['6_listing_price'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqft: createDataField(row['7_price_per_sqft'] ? parseFloat(row['7_price_per_sqft'].toString().replace(/[^0-9.]/g, '')) : null),
        streetAddress: createDataField(row['street_address'] || row['1_full_address'] || ''),
        city: createDataField(row['city'] || ''),
        state: createDataField(row['state'] || 'FL'),
        zipCode: createDataField(row['zip'] || row['zipCode'] || ''),
        county: createDataField(row['county'] || ''),
        latitude: createDataField(row['latitude'] ? parseFloat(row['latitude']) : null),
        longitude: createDataField(row['longitude'] ? parseFloat(row['longitude']) : null),
      },
      details: {
        bedrooms: createDataField(row['12_bedrooms'] ? parseInt(row['12_bedrooms']) : null),
        fullBathrooms: createDataField(row['13_full_bathrooms'] ? parseInt(row['13_full_bathrooms']) : null),
        halfBathrooms: createDataField(row['14_half_bathrooms'] ? parseInt(row['14_half_bathrooms']) : null),
        totalBathrooms: createDataField(row['15_total_bathrooms'] ? parseFloat(row['15_total_bathrooms']) : null),
        livingSqft: createDataField(row['16_living_sqft'] ? parseInt(row['16_living_sqft']) : null),
        totalSqftUnderRoof: createDataField(row['17_total_sqft_under_roof'] ? parseInt(row['17_total_sqft_under_roof']) : null),
        lotSizeSqft: createDataField(row['18_lot_size_sqft'] ? parseInt(row['18_lot_size_sqft']) : null),
        lotSizeAcres: createDataField(row['19_lot_size_acres'] ? parseFloat(row['19_lot_size_acres']) : null),
        yearBuilt: createDataField(row['20_year_built'] ? parseInt(row['20_year_built']) : null),
        propertyType: createDataField(row['21_property_type'] || 'Single Family'),
        stories: createDataField(row['22_stories'] ? parseInt(row['22_stories']) : null),
        garageSpaces: createDataField(row['23_garage_spaces'] ? parseInt(row['23_garage_spaces']) : null),
        parkingTotal: createDataField(row['24_parking_total'] || ''),
        hoaYn: createDataField(row['25_hoa_yn'] ? row['25_hoa_yn'].toLowerCase() === 'yes' || row['25_hoa_yn'] === 'true' : null),
        hoaFeeAnnual: createDataField(row['26_hoa_fee_annual'] ? parseFloat(row['26_hoa_fee_annual'].toString().replace(/[^0-9.]/g, '')) : null),
        annualTaxes: createDataField(row['27_annual_taxes'] ? parseFloat(row['27_annual_taxes'].toString().replace(/[^0-9.]/g, '')) : null),
        taxYear: createDataField(row['28_tax_year'] ? parseInt(row['28_tax_year']) : null),
        assessedValue: createDataField(row['29_assessed_value'] ? parseFloat(row['29_assessed_value'].toString().replace(/[^0-9.]/g, '')) : null),
        marketValueEstimate: createDataField(row['30_market_value_estimate'] ? parseFloat(row['30_market_value_estimate'].toString().replace(/[^0-9.]/g, '')) : null),
        lastSaleDate: createDataField(row['31_last_sale_date'] || ''),
        lastSalePrice: createDataField(row['32_last_sale_price'] ? parseFloat(row['32_last_sale_price'].toString().replace(/[^0-9.]/g, '')) : null),
        ownershipType: createDataField(row['33_ownership_type'] || ''),
        parcelId: createDataField(row['34_parcel_id'] || ''),
      },
      structural: {
        roofType: createDataField(row['35_roof_type'] || ''),
        roofAgeEst: createDataField(row['36_roof_age_est'] || ''),
        exteriorMaterial: createDataField(row['37_exterior_material'] || ''),
        foundation: createDataField(row['38_foundation'] || ''),
        hvacType: createDataField(row['39_hvac_type'] || ''),
        hvacAge: createDataField(row['40_hvac_age'] || ''),
        flooringType: createDataField(row['41_flooring_type'] || ''),
        kitchenFeatures: createDataField(row['42_kitchen_features'] || ''),
        appliancesIncluded: createDataField(row['43_appliances_included'] ? row['43_appliances_included'].split(',').map((s: string) => s.trim()) : []),
        fireplaceYn: createDataField(row['44_fireplace_yn'] ? row['44_fireplace_yn'].toLowerCase() === 'yes' || row['44_fireplace_yn'] === 'true' : null),
        poolYn: createDataField(row['45_pool_yn'] ? row['45_pool_yn'].toLowerCase() === 'yes' || row['45_pool_yn'] === 'true' : null),
        poolType: createDataField(row['46_pool_type'] || ''),
        deckPatio: createDataField(row['47_deck_patio'] || ''),
        fence: createDataField(row['48_fence'] || ''),
        landscaping: createDataField(row['49_landscaping'] || ''),
        recentRenovations: createDataField(row['50_recent_renovations'] || ''),
        permitHistoryRoof: createDataField(row['51_permit_history_roof'] || ''),
        permitHistoryHvac: createDataField(row['52_permit_history_hvac'] || ''),
        permitHistoryPoolAdditions: createDataField(row['53_permit_history_pool_additions'] || ''),
        interiorCondition: createDataField(row['54_interior_condition'] || ''),
      },
      location: {
        assignedElementary: createDataField(row['55_assigned_elementary'] || ''),
        elementaryRating: createDataField(row['56_elementary_rating'] || ''),
        elementaryDistanceMiles: createDataField(row['57_elementary_distance_miles'] ? parseFloat(row['57_elementary_distance_miles']) : null),
        assignedMiddle: createDataField(row['58_assigned_middle'] || ''),
        middleRating: createDataField(row['59_middle_rating'] || ''),
        middleDistanceMiles: createDataField(row['60_middle_distance_miles'] ? parseFloat(row['60_middle_distance_miles']) : null),
        assignedHigh: createDataField(row['61_assigned_high'] || ''),
        highRating: createDataField(row['62_high_rating'] || ''),
        highDistanceMiles: createDataField(row['63_high_distance_miles'] ? parseFloat(row['63_high_distance_miles']) : null),
        walkScore: createDataField(row['64_walk_score'] ? parseInt(row['64_walk_score']) : null),
        transitScore: createDataField(row['65_transit_score'] ? parseInt(row['65_transit_score']) : null),
        bikeScore: createDataField(row['66_bike_score'] ? parseInt(row['66_bike_score']) : null),
        distanceGroceryMiles: createDataField(row['67_distance_grocery_miles'] ? parseFloat(row['67_distance_grocery_miles']) : null),
        distanceHospitalMiles: createDataField(row['68_distance_hospital_miles'] ? parseFloat(row['68_distance_hospital_miles']) : null),
        distanceAirportMiles: createDataField(row['69_distance_airport_miles'] ? parseFloat(row['69_distance_airport_miles']) : null),
        distanceParkMiles: createDataField(row['70_distance_park_miles'] ? parseFloat(row['70_distance_park_miles']) : null),
        distanceBeachMiles: createDataField(row['71_distance_beach_miles'] ? parseFloat(row['71_distance_beach_miles']) : null),
        crimeIndexViolent: createDataField(row['72_crime_index_violent'] || ''),
        crimeIndexProperty: createDataField(row['73_crime_index_property'] || ''),
        neighborhoodSafetyRating: createDataField(row['74_neighborhood_safety_rating'] || ''),
        noiseLevel: createDataField(row['75_noise_level'] || ''),
        trafficLevel: createDataField(row['76_traffic_level'] || ''),
        walkabilityDescription: createDataField(row['77_walkability_description'] || ''),
        commuteTimeCityCenter: createDataField(row['78_commute_time_city_center'] || ''),
        publicTransitAccess: createDataField(row['79_public_transit_access'] || ''),
      },
      financial: {
        annualPropertyTax: createDataField(row['80_annual_property_tax'] ? parseFloat(row['80_annual_property_tax'].toString().replace(/[^0-9.]/g, '')) : null),
        taxExemptions: createDataField(row['81_tax_exemptions'] || ''),
        propertyTaxRate: createDataField(row['82_property_tax_rate'] ? parseFloat(row['82_property_tax_rate']) : null),
        recentTaxPaymentHistory: createDataField(row['83_recent_tax_payment_history'] || ''),
        medianHomePriceNeighborhood: createDataField(row['84_median_home_price_neighborhood'] ? parseFloat(row['84_median_home_price_neighborhood'].toString().replace(/[^0-9.]/g, '')) : null),
        pricePerSqftRecentAvg: createDataField(row['85_price_per_sqft_recent_avg'] ? parseFloat(row['85_price_per_sqft_recent_avg'].toString().replace(/[^0-9.]/g, '')) : null),
        daysOnMarketAvg: createDataField(row['86_days_on_market_avg'] ? parseFloat(row['86_days_on_market_avg']) : null),
        inventorySurplus: createDataField(row['87_inventory_surplus'] || ''),
        rentalEstimateMonthly: createDataField(row['88_rental_estimate_monthly'] ? parseFloat(row['88_rental_estimate_monthly'].toString().replace(/[^0-9.]/g, '')) : null),
        rentalYieldEst: createDataField(row['89_rental_yield_est'] ? parseFloat(row['89_rental_yield_est']) : null),
        vacancyRateNeighborhood: createDataField(row['90_vacancy_rate_neighborhood'] ? parseFloat(row['90_vacancy_rate_neighborhood']) : null),
        capRateEst: createDataField(row['91_cap_rate_est'] ? parseFloat(row['91_cap_rate_est']) : null),
        insuranceEstAnnual: createDataField(row['92_insurance_est_annual'] ? parseFloat(row['92_insurance_est_annual'].toString().replace(/[^0-9.]/g, '')) : null),
        financingTerms: createDataField(row['93_financing_terms'] || ''),
        comparableSalesLast3: createDataField(row['94_comparable_sales_last_3'] ? row['94_comparable_sales_last_3'].split(',').map((s: string) => s.trim()) : []),
      },
      utilities: {
        electricProvider: createDataField(row['95_electric_provider'] || ''),
        waterProvider: createDataField(row['96_water_provider'] || ''),
        sewerProvider: createDataField(row['97_sewer_provider'] || ''),
        naturalGas: createDataField(row['98_natural_gas'] || ''),
        internetProvidersTop3: createDataField(row['99_internet_providers_top_3'] ? row['99_internet_providers_top_3'].split(',').map((s: string) => s.trim()) : []),
        maxInternetSpeed: createDataField(row['100_max_internet_speed'] || ''),
        cableTvProvider: createDataField(row['101_cable_tv_provider'] || ''),
        airQualityIndexCurrent: createDataField(row['102_air_quality_index_current'] || ''),
        floodZone: createDataField(row['103_flood_zone'] || ''),
        floodRiskLevel: createDataField(row['104_flood_risk_level'] || ''),
        climateRiskWildfireFlood: createDataField(row['105_climate_risk_wildfire_flood'] || ''),
        noiseLevelDbEst: createDataField(row['106_noise_level_db_est'] || ''),
        solarPotential: createDataField(row['107_solar_potential'] || ''),
        evChargingYn: createDataField(row['108_ev_charging_yn'] || ''),
        smartHomeFeatures: createDataField(row['109_smart_home_features'] || ''),
        accessibilityMods: createDataField(row['110_accessibility_mods'] || ''),
        petPolicy: createDataField(row['pet_policy'] || ''),
        ageRestrictions: createDataField(row['age_restrictions'] || ''),
        specialAssessments: createDataField(row['special_assessments'] || ''),
        notesConfidenceSummary: createDataField(row['notes_confidence_summary'] || ''),
      },
    };
  };

  const handleCsvImport = () => {
    if (csvData.length === 0) {
      alert('No data to import');
      return;
    }

    let imported = 0;
    const propertyCards: PropertyCard[] = [];
    const fullProperties: Property[] = [];

    csvData.forEach(row => {
      // Generate ID for this property
      const propertyId = generateId();

      // Try to extract address from 110-field format or standard format
      const address = row['1_full_address'] || row['address'] || row['Address'] || '';
      const city = row['city'] || row['City'] || '';
      const state = row['state'] || row['State'] || 'FL';
      const zip = row['zip'] || row['ZIP'] || '';

      // Extract price (support both field definition format and standard)
      const listingPrice = row['6_listing_price'] || row['7_listing_price'] || row['price'] || row['Price'] || '0';
      const price = parseInt(String(listingPrice).replace(/[^0-9]/g, '')) || 0;

      // Extract bedrooms/bathrooms
      const bedrooms = parseInt(row['12_bedrooms'] || row['bedrooms'] || row['Bedrooms'] || '0');
      const bathrooms = parseFloat(row['15_total_bathrooms'] || row['bathrooms'] || row['Bathrooms'] || '0');

      // Extract sqft
      const sqft = parseInt(row['16_living_sqft'] || row['sqft'] || row['Sqft'] || '0');

      // Extract year built
      const yearBuilt = parseInt(row['20_year_built'] || row['yearBuilt'] || row['Year Built'] || new Date().getFullYear().toString());

      // Extract status
      const status = row['4_listing_status'] || row['status'] || row['Status'] || 'Active';

      // Count non-empty fields for data completeness
      const filledFieldsCount = Object.values(row).filter(v => v && v !== '').length;

      const propertyCard: PropertyCard = {
        id: propertyId,
        address,
        city,
        state,
        zip,
        price,
        pricePerSqft: sqft && price ? Math.round(price / sqft) : 0,
        bedrooms,
        bathrooms,
        sqft,
        yearBuilt,
        smartScore: Math.floor(Math.random() * 20) + 75,
        dataCompleteness: Math.min(100, filledFieldsCount), // Cap at 100
        listingStatus: status as 'Active' | 'Pending' | 'Sold',
        daysOnMarket: 0,
      };

      console.log('Importing property:', propertyCard);
      console.log('CSV row has', filledFieldsCount, 'filled fields');
      console.log('📝 RAW CSV DATA SAMPLE:');
      console.log('  - 1_full_address:', row['1_full_address']);
      console.log('  - 2_mls_number_primary:', row['2_mls_number_primary']);
      console.log('  - 12_bedrooms:', row['12_bedrooms']);
      console.log('  - 16_living_sqft:', row['16_living_sqft']);
      console.log('  - 55_assigned_elementary:', row['55_assigned_elementary']);

      // Create full property with all 110 fields
      const fullProperty = convertCsvToFullProperty(row, propertyId);
      console.log('🔍 Full property created:', fullProperty.id);
      console.log('📍 Address fields:', fullProperty.address);
      console.log('🏗️ Details fields:', fullProperty.details);
      console.log('🔍 CONVERTED VALUES:');
      console.log('  - Full Address:', fullProperty.address.fullAddress.value);
      console.log('  - MLS Primary:', fullProperty.address.mlsPrimary.value);
      console.log('  - Bedrooms:', fullProperty.details.bedrooms.value);
      console.log('  - Living Sqft:', fullProperty.details.livingSqft.value);

      if (propertyCard.address || propertyCard.price > 0) {
        propertyCards.push(propertyCard);
        fullProperties.push(fullProperty);
        imported++;
      }
    });

    // Add all properties to the store at once
    if (propertyCards.length > 0) {
      console.log('✅ Adding to store:', propertyCards.length, 'cards and', fullProperties.length, 'full properties');
      console.log('📦 First full property being saved:', fullProperties[0]);
      addProperties(propertyCards, fullProperties);
    }

    setStatus('complete');
    alert(`Successfully imported ${imported} properties with all 110 fields preserved`);
    setCsvFile(null);
    setCsvData([]);

    // Navigate to property list
    setTimeout(() => navigate('/properties'), 1500);
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-2xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Add Property
        </h1>
        <p className="text-gray-400">
          AI-powered extraction or manual entry
        </p>
      </div>

      {/* Input Mode Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/10 mb-6">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'manual'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <PenLine className="w-4 h-4" />
          Manual
        </button>
        <button
          onClick={() => setInputMode('address')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'address'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Address
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'url'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          URL
        </button>
        <button
          onClick={() => setInputMode('csv')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
            inputMode === 'csv'
              ? 'bg-quantum-cyan/20 text-quantum-cyan'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload CSV
        </button>
      </div>

      {/* Input Form */}
      <div className="glass-card p-6 mb-6">
        {inputMode === 'csv' ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Upload className="w-16 h-16 mx-auto mb-4 text-quantum-cyan" />
              <h3 className="text-lg font-semibold mb-2">Upload Property CSV</h3>
              <p className="text-sm text-gray-400 mb-6">
                Import multiple properties at once. CSV should include: address, city, state, zip, price, bedrooms, bathrooms, sqft
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="btn-quantum inline-flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                Choose CSV File
              </label>
            </div>

            {csvFile && (
              <div className="border border-quantum-cyan/20 rounded-xl p-4 bg-quantum-cyan/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">{csvFile.name}</p>
                    <p className="text-sm text-gray-400">{csvData.length} properties found</p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-quantum-cyan" />
                </div>

                {csvData.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Preview (first 3 properties):</p>
                    <div className="bg-black/30 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                      {csvData.slice(0, 3).map((row, i) => {
                        const address = row['1_full_address'] || row['address'] || row['Address'] || 'No address';
                        const city = row['city'] || row['City'] || '';
                        const state = row['state'] || row['State'] || '';
                        const priceRaw = row['6_listing_price'] || row['7_listing_price'] || row['price'] || row['Price'] || '0';
                        const price = parseInt(String(priceRaw).replace(/[^0-9]/g, '')) || 0;
                        const fieldCount = Object.values(row).filter(v => v && v !== '').length;

                        return (
                          <div key={i} className="mb-2">
                            {address} - {city}{city && state ? ', ' : ''}{state} - ${price.toLocaleString()} ({fieldCount} fields)
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCsvImport}
                  className="btn-quantum w-full"
                >
                  <CheckCircle className="w-5 h-5" />
                  Import {csvData.length} Properties
                </button>
              </div>
            )}
          </div>
        ) : inputMode === 'manual' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  placeholder="280 41st Ave"
                  value={manualForm.address}
                  onChange={(e) => setManualForm({ ...manualForm, address: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="St Pete Beach"
                  value={manualForm.city}
                  onChange={(e) => setManualForm({ ...manualForm, city: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    State
                  </label>
                  <select
                    value={manualForm.state}
                    onChange={(e) => setManualForm({ ...manualForm, state: e.target.value })}
                    className="input-glass"
                  >
                    <option value="FL">FL</option>
                    <option value="GA">GA</option>
                    <option value="TX">TX</option>
                    <option value="CA">CA</option>
                    <option value="NY">NY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    ZIP
                  </label>
                  <input
                    type="text"
                    placeholder="33706"
                    value={manualForm.zip}
                    onChange={(e) => setManualForm({ ...manualForm, zip: e.target.value })}
                    className="input-glass"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  placeholder="549000"
                  value={manualForm.price}
                  onChange={(e) => setManualForm({ ...manualForm, price: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Sq Ft
                </label>
                <input
                  type="number"
                  placeholder="1426"
                  value={manualForm.sqft}
                  onChange={(e) => setManualForm({ ...manualForm, sqft: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bedrooms
                </label>
                <select
                  value={manualForm.bedrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bedrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Bathrooms
                </label>
                <select
                  value={manualForm.bathrooms}
                  onChange={(e) => setManualForm({ ...manualForm, bathrooms: e.target.value })}
                  className="input-glass"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Year Built
                </label>
                <input
                  type="number"
                  placeholder="1958"
                  value={manualForm.yearBuilt}
                  onChange={(e) => setManualForm({ ...manualForm, yearBuilt: e.target.value })}
                  className="input-glass"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Status
                </label>
                <select
                  value={manualForm.listingStatus}
                  onChange={(e) => setManualForm({ ...manualForm, listingStatus: e.target.value })}
                  className="input-glass"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleManualSubmit}
              className="btn-quantum w-full mt-4"
            >
              <CheckCircle className="w-5 h-5" />
              Add Property
            </button>
          </div>
        ) : inputMode === 'address' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Property Address
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="280 41st Ave, St Pete Beach, FL 33706"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>

            {/* LLM Selection */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Auto', 'Claude', 'GPT', 'Hybrid'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => setSelectedEngine(engine)}
                    className={`p-3 rounded-xl border transition-colors ${
                      engine === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold">{engine}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Listing URL
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  placeholder="https://www.zillow.com/homedetails/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="input-glass pl-12"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Supports: Zillow, Redfin, Trulia, Realtor.com, Compass, homes.com
            </p>

            {/* LLM Selection */}
            <div className="mt-6">
              <label className="block text-sm text-gray-400 mb-2">
                AI Engine
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Auto', 'Claude', 'GPT', 'Hybrid'].map((engine) => (
                  <button
                    key={engine}
                    onClick={() => setSelectedEngine(engine)}
                    className={`p-3 rounded-xl border transition-colors ${
                      engine === selectedEngine
                        ? 'border-quantum-cyan bg-quantum-cyan/10 text-quantum-cyan'
                        : 'border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm font-semibold">{engine}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleScrape}
              disabled={status !== 'idle' && status !== 'complete' && status !== 'error'}
              className="btn-quantum w-full mt-6"
            >
              {status === 'idle' || status === 'complete' || status === 'error' ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract Property Data
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress Display - for scraping modes */}
      {status !== 'idle' && inputMode !== 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white">
              {getStatusMessage()}
            </span>
            {status === 'complete' ? (
              <CheckCircle className="w-6 h-6 text-quantum-green" />
            ) : status === 'error' ? (
              <AlertCircle className="w-6 h-6 text-quantum-red" />
            ) : (
              <Loader2 className="w-6 h-6 text-quantum-cyan animate-spin" />
            )}
          </div>

          <div className="progress-quantum h-2 mb-4">
            <motion.div
              className="progress-quantum-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Field Categories Progress */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 20 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 20 ? 'text-white' : 'text-gray-500'}>
                Core Property Data (Fields 1-30)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 40 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 40 ? 'text-white' : 'text-gray-500'}>
                Structural Details (Fields 31-50)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 60 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 60 ? 'text-white' : 'text-gray-500'}>
                Location & Schools (Fields 51-75)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 80 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 80 ? 'text-white' : 'text-gray-500'}>
                Financial Data (Fields 76-90)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${progress >= 100 ? 'text-quantum-green' : 'text-gray-600'}`} />
              <span className={progress >= 100 ? 'text-white' : 'text-gray-500'}>
                Utilities & Environment (Fields 91-110)
              </span>
            </div>
          </div>

          {status === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 pt-4 border-t border-white/10"
            >
              <div className="flex gap-4">
                <button
                  onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
                  className="btn-quantum flex-1"
                >
                  View Property
                </button>
                <button
                  onClick={resetForm}
                  className="btn-glass flex-1"
                >
                  Add Another
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Success message for manual entry */}
      {status === 'complete' && inputMode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-5d p-6"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-quantum-green" />
            <span className="font-semibold text-white text-lg">
              Property Added Successfully!
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => lastAddedId && navigate(`/property/${lastAddedId}`)}
              className="btn-quantum flex-1"
            >
              View Property
            </button>
            <button
              onClick={resetForm}
              className="btn-glass flex-1"
            >
              Add Another
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

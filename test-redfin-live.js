const API_KEY = 'e33105fef6mshfbf6e2452ef8610p1c1df2jsnb5b79b4ccf3b';
const API_HOST = 'redfin5.p.rapidapi.com';

async function testRedfin() {
  console.log('🧪 Testing Redfin API Integration...\n');

  // Test address: Florida property
  const address = '7791 W Gulf Blvd, Treasure Island, FL 33706';
  console.log('📍 Test Address:', address);
  console.log('');

  try {
    // Step 1: Autocomplete - Get Redfin URL
    console.log('Step 1: Auto-complete API (address → Redfin URL)');
    const autocompleteUrl = `https://${API_HOST}/auto-complete?query=${encodeURIComponent(address)}`;

    const autocompleteResponse = await fetch(autocompleteUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    if (!autocompleteResponse.ok) {
      console.log('❌ Autocomplete failed:', autocompleteResponse.status);
      const errorText = await autocompleteResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const autocompleteData = await autocompleteResponse.json();
    console.log('✅ Autocomplete success');
    console.log('Response structure:', Object.keys(autocompleteData));

    const redfinUrl = autocompleteData.payload?.exactMatch?.url;
    if (!redfinUrl) {
      console.log('❌ No Redfin URL found in response');
      console.log('Payload:', JSON.stringify(autocompleteData.payload, null, 2).substring(0, 500));
      return;
    }

    console.log('✅ Redfin URL:', redfinUrl);
    console.log('');

    // Step 2: Property Details
    console.log('Step 2: Property details API');
    const detailsUrl = `https://${API_HOST}/properties/get-info?url=${encodeURIComponent(redfinUrl)}`;

    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    if (!detailsResponse.ok) {
      console.log('❌ Details failed:', detailsResponse.status);
      const errorText = await detailsResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const detailsData = await detailsResponse.json();
    console.log('✅ Details success');

    const addressInfo = detailsData.aboveTheFold?.addressSectionInfo;
    if (!addressInfo) {
      console.log('❌ No addressSectionInfo in response');
      console.log('Response keys:', Object.keys(detailsData));
      return;
    }

    console.log('\n✅ Field mapping verification:');
    console.log('  Field 16 (redfin_estimate):', addressInfo.avmInfo?.predictedValue || 'N/A');
    console.log('  Field 14 (last_sale_price):', addressInfo.latestPriceInfo?.amount || 'N/A');
    console.log('  Field 13 (last_sale_date):', addressInfo.soldDate ? new Date(addressInfo.soldDate).toISOString().split('T')[0] : 'N/A');
    console.log('  Field 17 (bedrooms):', addressInfo.beds || 'N/A');
    console.log('  Field 18 (bathrooms):', addressInfo.baths || 'N/A');
    console.log('  Field 21 (living_sqft):', addressInfo.sqFt?.value || 'N/A');
    console.log('  Field 23 (lot_size_sqft):', addressInfo.lotSize || 'N/A');
    console.log('  Field 25 (year_built):', addressInfo.yearBuilt || 'N/A');
    console.log('  Field 34 (parcel_id):', addressInfo.apn || 'N/A');
    console.log('');

    // Count how many fields have data
    let fieldsWithData = 0;
    if (addressInfo.avmInfo?.predictedValue) fieldsWithData++;
    if (addressInfo.latestPriceInfo?.amount) fieldsWithData++;
    if (addressInfo.soldDate) fieldsWithData++;
    if (addressInfo.beds) fieldsWithData++;
    if (addressInfo.baths) fieldsWithData++;
    if (addressInfo.sqFt?.value) fieldsWithData++;
    if (addressInfo.lotSize) fieldsWithData++;
    if (addressInfo.yearBuilt) fieldsWithData++;
    if (addressInfo.apn) fieldsWithData++;

    console.log(`📊 Fields populated: ${fieldsWithData}/9 property details`);
    console.log('');

    // Step 3: WalkScore
    console.log('Step 3: WalkScore API');
    const walkScoreUrl = `https://${API_HOST}/properties/get-walk-score?url=${encodeURIComponent(redfinUrl)}`;

    const walkScoreResponse = await fetch(walkScoreUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    if (!walkScoreResponse.ok) {
      console.log('⚠️  WalkScore failed:', walkScoreResponse.status, '(optional - not critical)');
    } else {
      const walkScoreData = await walkScoreResponse.json();
      console.log('✅ WalkScore success');
      console.log('  Field 61 (walk_score):', walkScoreData.walkScore?.value || 'N/A');
      console.log('  Field 62 (transit_score):', walkScoreData.transitScore?.value || 'N/A');
      console.log('  Field 63 (bike_score):', walkScoreData.bikeScore?.value || 'N/A');

      let scoreFields = 0;
      if (walkScoreData.walkScore?.value) scoreFields++;
      if (walkScoreData.transitScore?.value) scoreFields++;
      if (walkScoreData.bikeScore?.value) scoreFields++;

      console.log(`📊 Scores populated: ${scoreFields}/3`);
    }

    console.log('');
    console.log('✅ REDFIN API TEST COMPLETE');
    console.log(`📈 Total fields: ${fieldsWithData + (scoreFields || 0)}/12 successfully populated`);

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testRedfin().catch(console.error);

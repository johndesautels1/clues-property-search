const API_KEY = 'e33105fef6mshfbf6e2452ef8610p1c1df2jsnb5b79b4ccf3b';
const API_HOST = 'redfin5.p.rapidapi.com';

async function testRedfin() {
  console.log('🧪 Testing Redfin API - Clearwater Property\n');

  const address = '2015 Hillwood Dr, Clearwater, FL 33764';
  console.log('📍 Test Address:', address);
  console.log('');

  try {
    // Step 1: Autocomplete
    console.log('Step 1: Auto-complete API');
    const autocompleteUrl = `https://${API_HOST}/auto-complete?query=${encodeURIComponent(address)}`;

    const autocompleteResponse = await fetch(autocompleteUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    const autocompleteData = await autocompleteResponse.json();
    console.log('Status:', autocompleteData.errorMessage);

    const exactMatch = autocompleteData.payload?.exactMatch;
    if (!exactMatch) {
      console.log('❌ No exact match found');
      console.log('Sections:', autocompleteData.payload?.sections?.length || 0);
      if (autocompleteData.payload?.sections?.[0]?.rows) {
        console.log('First result:', autocompleteData.payload.sections[0].rows[0]);
      }
      return;
    }

    console.log('✅ Match found!');
    console.log('  Type:', exactMatch.type);
    console.log('  Name:', exactMatch.name);
    console.log('  URL:', exactMatch.url);
    console.log('');

    const redfinUrl = exactMatch.url;

    // Step 2: Property Details
    console.log('Step 2: Get property details');
    const detailsUrl = `https://${API_HOST}/properties/get-info?url=${encodeURIComponent(redfinUrl)}`;

    const detailsResponse = await fetch(detailsUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    const detailsData = await detailsResponse.json();

    if (!detailsData.aboveTheFold) {
      console.log('❌ No aboveTheFold data');
      console.log('Response keys:', Object.keys(detailsData));
      return;
    }

    const addressInfo = detailsData.aboveTheFold.addressSectionInfo;
    if (!addressInfo) {
      console.log('❌ No addressSectionInfo');
      console.log('aboveTheFold keys:', Object.keys(detailsData.aboveTheFold));
      return;
    }

    console.log('✅ Property data retrieved!\n');
    console.log('═══════════════════════════════════════════');
    console.log('FIELD MAPPING VERIFICATION:');
    console.log('═══════════════════════════════════════════');
    console.log('Field 16 (redfin_estimate):   $' + (addressInfo.avmInfo?.predictedValue?.toLocaleString() || 'N/A'));
    console.log('Field 14 (last_sale_price):   $' + (addressInfo.latestPriceInfo?.amount?.toLocaleString() || 'N/A'));
    console.log('Field 13 (last_sale_date):     ' + (addressInfo.soldDate ? new Date(addressInfo.soldDate).toLocaleDateString() : 'N/A'));
    console.log('Field 17 (bedrooms):           ' + (addressInfo.beds || 'N/A'));
    console.log('Field 18 (bathrooms):          ' + (addressInfo.baths || 'N/A'));
    console.log('Field 21 (living_sqft):        ' + (addressInfo.sqFt?.value?.toLocaleString() || 'N/A'));
    console.log('Field 23 (lot_size_sqft):      ' + (addressInfo.lotSize?.toLocaleString() || 'N/A'));
    console.log('Field 25 (year_built):         ' + (addressInfo.yearBuilt || 'N/A'));
    console.log('Field 34 (parcel_id):          ' + (addressInfo.apn || 'N/A'));
    console.log('Field 11 (price_per_sqft):     $' + (addressInfo.pricePerSqFt?.toLocaleString() || 'N/A'));
    console.log('═══════════════════════════════════════════');

    // Count fields
    let count = 0;
    if (addressInfo.avmInfo?.predictedValue) count++;
    if (addressInfo.latestPriceInfo?.amount) count++;
    if (addressInfo.soldDate) count++;
    if (addressInfo.beds) count++;
    if (addressInfo.baths) count++;
    if (addressInfo.sqFt?.value) count++;
    if (addressInfo.lotSize) count++;
    if (addressInfo.yearBuilt) count++;
    if (addressInfo.apn) count++;
    if (addressInfo.pricePerSqFt) count++;

    console.log(`\n✅ ${count}/10 property fields populated\n`);

    // Step 3: WalkScore
    console.log('Step 3: Get WalkScore data');
    const walkScoreUrl = `https://${API_HOST}/properties/get-walk-score?url=${encodeURIComponent(redfinUrl)}`;

    const walkScoreResponse = await fetch(walkScoreUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    if (walkScoreResponse.ok) {
      const walkScoreData = await walkScoreResponse.json();
      console.log('✅ WalkScore data retrieved!\n');
      console.log('Field 61 (walk_score):         ' + (walkScoreData.walkScore?.value || 'N/A'));
      console.log('Field 62 (transit_score):      ' + (walkScoreData.transitScore?.value || 'N/A'));
      console.log('Field 63 (bike_score):         ' + (walkScoreData.bikeScore?.value || 'N/A'));

      let scoreCount = 0;
      if (walkScoreData.walkScore?.value) scoreCount++;
      if (walkScoreData.transitScore?.value) scoreCount++;
      if (walkScoreData.bikeScore?.value) scoreCount++;

      console.log(`\n✅ ${scoreCount}/3 score fields populated`);
      count += scoreCount;
    } else {
      console.log('⚠️  WalkScore API failed (optional)');
    }

    console.log('\n═══════════════════════════════════════════');
    console.log(`✅ REDFIN TEST COMPLETE: ${count}/13 fields populated`);
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n❌ TEST FAILED');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }
}

testRedfin().catch(console.error);

/**
 * Redfin API Endpoint Testing
 * Testing all available endpoints from RapidAPI documentation
 */

const API_KEY = 'e33105fef6mshfbf6e2452ef8610p1c1df2jsnb5b79b4ccf3b';
const API_HOST = 'redfin5.p.rapidapi.com';

async function testRedfinEndpoints() {
  console.log('🧪 Testing Redfin API Endpoints...\n');

  // Test 1: Properties List (Search)
  console.log('===== Test 1: properties/list =====');
  try {
    const response = await fetch(
      'https://redfin5.p.rapidapi.com/properties/list?region_id=30749&region_type=6&uipt=1%2C2%2C3%2C4%2C5%2C6%2C7%2C8&status=9&sf=1%2C2%2C3%2C5%2C6%2C7&num_homes=5&ord=redfin-recommended-asc&start=0',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Response keys:', Object.keys(data));
      if (data.homes && data.homes.length > 0) {
        const firstHome = data.homes[0];
        console.log('\nFirst property preview:');
        console.log('  - URL:', firstHome.url);
        console.log('  - Property ID:', firstHome.propertyId);
        console.log('  - Listing ID:', firstHome.listingId);
        console.log('  - Price:', firstHome.price);
        console.log('  - Beds:', firstHome.beds);
        console.log('  - Baths:', firstHome.baths);
        console.log('  - SqFt:', firstHome.sqFt);
        console.log('  - Address:', firstHome.streetLine?.value);
        console.log('Full first home:', JSON.stringify(firstHome, null, 2).substring(0, 2000));
      }
    } else {
      console.log('❌ FAILED:', response.status);
      console.log(await response.text());
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n\n===== Test 2: properties/get-main-info =====');
  // We'll use the URL from the example: /NY/Glendale/7017-69th-Pl-11385/home/20877896
  try {
    const response = await fetch(
      'https://redfin5.p.rapidapi.com/properties/get-main-info?url=%2FNY%2FGlendale%2F7017-69th-Pl-11385%2Fhome%2F20877896',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Response keys:', Object.keys(data));
      console.log('Main info sample:', JSON.stringify(data, null, 2).substring(0, 2000));
    } else {
      console.log('❌ FAILED:', response.status);
      console.log(await response.text());
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n\n===== Test 3: properties/get-info =====');
  try {
    const response = await fetch(
      'https://redfin5.p.rapidapi.com/properties/get-info?url=%2FNY%2FGlendale%2F7017-69th-Pl-11385%2Fhome%2F20877896',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Response keys:', Object.keys(data));
      console.log('Extended info sample:', JSON.stringify(data, null, 2).substring(0, 2000));
    } else {
      console.log('❌ FAILED:', response.status);
      console.log(await response.text());
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n\n===== Test 4: properties/get-walk-score =====');
  try {
    const response = await fetch(
      'https://redfin5.p.rapidapi.com/properties/get-walk-score?url=%2FNY%2FGlendale%2F7017-69th-Pl-11385%2Fhome%2F20877896',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Walk score data:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED:', response.status);
      console.log(await response.text());
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }

  console.log('\n\n===== Test 5: auto-complete (find Tampa property) =====');
  try {
    const response = await fetch(
      'https://redfin5.p.rapidapi.com/auto-complete?query=123%20Main%20St%2C%20Tampa%2C%20FL',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS');
      console.log('Autocomplete result:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ FAILED:', response.status);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testRedfinEndpoints().catch(console.error);

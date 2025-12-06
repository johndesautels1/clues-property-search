/**
 * Redfin API Test Script
 * Tests the RapidAPI Redfin5 endpoints with proper authentication
 */

const API_KEY = 'e33105fef6mshfbf6e2452ef8610p1c1df2jsnb5b79b4ccf3b';
const API_HOST = 'redfin5.p.rapidapi.com';

async function testRedfinAPI() {
  console.log('🧪 Testing Redfin API via RapidAPI...\n');

  // Test 1: Try property/get-details endpoint
  console.log('Test 1: Testing property/get-details...');
  try {
    const detailsResponse = await fetch(
      'https://redfin5.p.rapidapi.com/property/get-details?propertyId=1343634&listingId=133483116',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('✅ Property Details Response:', JSON.stringify(detailsData, null, 2).substring(0, 1000), '...');
    } else {
      console.log('❌ Details failed:', detailsResponse.status, detailsResponse.statusText);
      const errorText = await detailsResponse.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ Details error:', error.message);
  }

  // Test 1b: Try search/query endpoint
  console.log('\n\nTest 1b: Testing search/query...');
  try {
    const queryResponse = await fetch(
      'https://redfin5.p.rapidapi.com/search/query?query=Tampa%2C%20FL%2033602',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (queryResponse.ok) {
      const queryData = await queryResponse.json();
      console.log('✅ Search Query Response:', JSON.stringify(queryData, null, 2));
    } else {
      console.log('❌ Query failed:', queryResponse.status);
      const errorText = await queryResponse.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Query error:', error.message);
  }

  // Test 2: Get Property Details (if we have an ID)
  console.log('\n\nTest 2: Getting property details...');
  // We'll need a specific property ID from the search results
  // For now, let's try a generic property lookup endpoint

  // Test 3: Check available endpoints
  console.log('\n\nTest 3: Testing autocomplete endpoint...');
  try {
    const autocompleteResponse = await fetch(
      'https://redfin5.p.rapidapi.com/auto-complete?query=Tampa%2C%20FL',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': API_HOST,
          'x-rapidapi-key': API_KEY
        }
      }
    );

    if (autocompleteResponse.ok) {
      const autocompleteData = await autocompleteResponse.json();
      console.log('✅ Autocomplete Response:', JSON.stringify(autocompleteData, null, 2));
    } else {
      console.log('❌ Autocomplete failed:', autocompleteResponse.status);
    }
  } catch (error) {
    console.error('❌ Autocomplete error:', error.message);
  }
}

// Run the tests
testRedfinAPI().catch(console.error);

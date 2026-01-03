const API_KEY = 'e33105fef6mshfbf6e2452ef8610p1c1df2jsnb5b79b4ccf3b';
const API_HOST = 'redfin5.p.rapidapi.com';

async function testRedfin() {
  console.log('🧪 Debugging Redfin Autocomplete...\n');

  const address = '2015 Hillwood Dr, Clearwater, FL 33764';
  console.log('📍 Test Address:', address);
  console.log('');

  try {
    const autocompleteUrl = `https://${API_HOST}/auto-complete?query=${encodeURIComponent(address)}`;

    const autocompleteResponse = await fetch(autocompleteUrl, {
      headers: {
        'x-rapidapi-host': API_HOST,
        'x-rapidapi-key': API_KEY
      }
    });

    const autocompleteData = await autocompleteResponse.json();

    console.log('Full autocomplete response:');
    console.log(JSON.stringify(autocompleteData, null, 2));

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testRedfin().catch(console.error);

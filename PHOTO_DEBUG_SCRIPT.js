/**
 * PHOTO DEBUG SCRIPT
 * Copy and paste this into browser console (F12) after searching for a property
 * This will tell you EXACTLY why photos aren't displaying
 */

console.log('🔍 PHOTO DEBUG - Checking photo integration...');
console.log('================================================');

// Check 1: Do we have properties in the store?
const checkStore = () => {
  try {
    const storeElement = document.querySelector('[data-property-store]');
    if (!storeElement) {
      console.log('❌ Could not access property store');
      return null;
    }
    return true;
  } catch (e) {
    console.log('❌ Error accessing store:', e.message);
    return null;
  }
};

// Check 2: Inspect PropertyCard components
const checkPropertyCards = () => {
  const cards = document.querySelectorAll('[data-testid="property-card"], .glass-card-hover');
  console.log(`\n📋 Found ${cards.length} property cards on page`);

  cards.forEach((card, index) => {
    console.log(`\n--- Property Card ${index + 1} ---`);

    // Check for image element
    const img = card.querySelector('img');
    const placeholder = card.querySelector('svg'); // MapPin icon

    if (img) {
      console.log('✅ Has <img> element');
      console.log('   src:', img.src);
      console.log('   alt:', img.alt);
      console.log('   naturalWidth:', img.naturalWidth);
      console.log('   complete:', img.complete);

      if (img.complete && img.naturalWidth === 0) {
        console.log('   ❌ IMAGE FAILED TO LOAD (broken URL or CORS issue)');
      } else if (img.complete && img.naturalWidth > 0) {
        console.log('   ✅ IMAGE LOADED SUCCESSFULLY');
      } else {
        console.log('   ⏳ IMAGE STILL LOADING...');
      }
    } else if (placeholder) {
      console.log('❌ No image - showing placeholder icon (MapPin)');
      console.log('   This means thumbnail property is undefined or empty');
    } else {
      console.log('❌ No image or placeholder found');
    }
  });
};

// Check 3: Inspect localStorage for property data
const checkPropertyData = () => {
  try {
    const propertiesJson = localStorage.getItem('property-store');
    if (!propertiesJson) {
      console.log('\n❌ No properties in localStorage');
      return;
    }

    const store = JSON.parse(propertiesJson);
    const properties = store.state?.properties || [];

    console.log(`\n💾 Found ${properties.length} properties in localStorage`);

    properties.forEach((prop, index) => {
      console.log(`\n--- Property ${index + 1} ---`);
      console.log('   Address:', prop.address);
      console.log('   ID:', prop.id);
      console.log('   Has thumbnail:', !!prop.thumbnail);
      if (prop.thumbnail) {
        console.log('   Thumbnail URL:', prop.thumbnail);
        console.log('   URL starts with https:', prop.thumbnail.startsWith('https'));
      } else {
        console.log('   ❌ NO THUMBNAIL PROPERTY');
      }
    });

  } catch (e) {
    console.log('\n❌ Error reading localStorage:', e.message);
  }
};

// Check 4: Check last API response in console logs
const checkConsoleHistory = () => {
  console.log('\n📝 Look for these console logs in your history:');
  console.log('   1. "[Bridge Mapper] ✅ Primary photo URL extracted"');
  console.log('   2. "📸 Property photo extracted from Stellar MLS"');
  console.log('   3. Search for "Media" to see if Bridge API returned photos');
  console.log('\nIf you DON\'T see these logs, photos are not being extracted from API.');
};

// Check 5: Test a sample Bridge API call
const testBridgeAPI = () => {
  console.log('\n🧪 To test Bridge API directly:');
  console.log('   1. Go to Network tab in DevTools');
  console.log('   2. Filter by "bridge-mls"');
  console.log('   3. Search for a property');
  console.log('   4. Click the bridge-mls request');
  console.log('   5. Check Preview tab - look for "Media" array in response');
  console.log('   6. If Media array is empty/missing, Stellar MLS is not returning photos');
};

// Run all checks
console.log('\n🚀 Running checks...\n');
checkStore();
checkPropertyCards();
checkPropertyData();
checkConsoleHistory();
testBridgeAPI();

console.log('\n================================================');
console.log('✅ Debug complete - review results above');
console.log('================================================');

// Export function to re-run
window.debugPhotos = () => {
  console.clear();
  checkPropertyCards();
  checkPropertyData();
};

console.log('\n💡 TIP: After searching for a property, run: debugPhotos()');

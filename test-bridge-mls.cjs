/**
 * Test script to call Bridge MLS API and see raw data returned
 * MLS#: TB8456939 (17352 Kennedy Dr)
 */

const https = require('https');

// Your deployed Vercel URL - update if different
const VERCEL_URL = 'https://clues-property-search1.vercel.app';

const mlsNumber = 'TB8456939';

const data = JSON.stringify({
  mlsNumber: mlsNumber
});

const options = {
  hostname: VERCEL_URL.replace('https://', ''),
  port: 443,
  path: '/api/property/bridge-mls',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('========================================');
console.log('CALLING BRIDGE MLS API');
console.log('========================================');
console.log('MLS Number:', mlsNumber);
console.log('Endpoint:', `${VERCEL_URL}/api/property/bridge-mls`);
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('========================================');
    console.log('RESPONSE RECEIVED');
    console.log('========================================');
    console.log('Status Code:', res.statusCode);
    console.log('');

    try {
      const parsed = JSON.parse(responseData);

      if (parsed.success) {
        console.log('✅ SUCCESS');
        console.log('Mapped Field Count:', parsed.mappedFieldCount);
        console.log('Unmapped Field Count:', parsed.unmappedFieldCount);
        console.log('');
        console.log('========================================');
        console.log('FIELDS RETURNED FROM STELLAR MLS');
        console.log('========================================');

        // Show all fields returned
        const fields = parsed.fields || {};
        const fieldKeys = Object.keys(fields).sort();

        console.log(`Total fields in response: ${fieldKeys.length}`);
        console.log('');

        // Group by field number
        const numbered = fieldKeys.filter(k => /^\d+_/.test(k)).sort((a, b) => {
          const aNum = parseInt(a.split('_')[0]);
          const bNum = parseInt(b.split('_')[0]);
          return aNum - bNum;
        });

        const other = fieldKeys.filter(k => !/^\d+_/.test(k));

        console.log('NUMBERED FIELDS (Our 168-field schema):');
        console.log('─'.repeat(80));
        numbered.forEach(key => {
          const field = fields[key];
          const value = typeof field.value === 'object' ? JSON.stringify(field.value).substring(0, 50) + '...' : field.value;
          console.log(`${key.padEnd(35)} = ${value}`);
        });

        console.log('');
        console.log('OTHER FIELDS (Extended MLS data):');
        console.log('─'.repeat(80));
        other.forEach(key => {
          const field = fields[key];
          if (key !== '_extendedMLSData') {
            const value = typeof field.value === 'object' ? JSON.stringify(field.value).substring(0, 50) + '...' : field.value;
            console.log(`${key.padEnd(35)} = ${value}`);
          }
        });

        // Check for specific fields we're interested in
        console.log('');
        console.log('========================================');
        console.log('CRITICAL FIELD CHECK');
        console.log('========================================');

        const criticalFields = {
          '40_roof_age_est': 'Roof Age',
          '44_garage_type': 'Garage Type',
          '46_hvac_age': 'HVAC Age',
          '60_permit_history_roof': 'Permit History - Roof',
          '61_permit_history_hvac': 'Permit History - HVAC',
          '62_permit_history_other': 'Permit History - Other',
          '151_homestead_yn': 'Homestead Exemption',
          '152_cdd_yn': 'CDD Y/N',
          '156_waterfront_feet': 'Waterfront Feet',
          '157_water_access_yn': 'Water Access Y/N',
          '158_water_view_yn': 'Water View Y/N'
        };

        Object.entries(criticalFields).forEach(([fieldKey, fieldName]) => {
          const status = fields[fieldKey] ? `✅ ${fields[fieldKey].value}` : '❌ NULL';
          console.log(`${fieldName.padEnd(30)} : ${status}`);
        });

        // Save full response to file for detailed analysis
        require('fs').writeFileSync(
          'bridge-mls-response-TB8456939.json',
          JSON.stringify(parsed, null, 2)
        );
        console.log('');
        console.log('✅ Full response saved to: bridge-mls-response-TB8456939.json');

      } else {
        console.log('❌ ERROR');
        console.log('Error message:', parsed.error);
      }

    } catch (error) {
      console.log('❌ ERROR PARSING RESPONSE');
      console.log('Raw response:', responseData);
      console.log('Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ REQUEST ERROR');
  console.log('Error:', error.message);
});

req.write(data);
req.end();

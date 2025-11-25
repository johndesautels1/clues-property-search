import re

filepath = 'D:/Clues_Quantum_Property_Dashboard/app/src/pages/PropertyDetail.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_pattern = r'''if \(newFieldData\) \{
          // Update the property with the new field value
          alert\(`✅ \$\{llmName\} found data for \$\{fieldKey\}: \$\{newFieldData\.value\}`\);
          // TODO: Update fullProperty in store with new field data
        \} else \{
          alert\(`❌ \$\{llmName\} could not find data for \$\{fieldKey\}`\);
        \}'''

new_code = '''if (newFieldData && newFieldData.value != null) {
          const updated = JSON.parse(JSON.stringify(fullProperty));
          const paths: Record<string, [string, string]> = {
            '1_full_address': ['address', 'fullAddress'],
            '7_listing_price': ['address', 'listingPrice'],
            '12_bedrooms': ['details', 'bedrooms'],
            '16_living_sqft': ['details', 'livingSqft'],
            '65_walk_score': ['location', 'walkScore'],
            '100_flood_zone': ['utilities', 'floodZone'],
          };
          const path = paths[fieldKey];
          if (path && updated[path[0]]) {
            updated[path[0]][path[1]] = { value: newFieldData.value, confidence: 'Medium', notes: `Updated by ${llmName}`, sources: [llmName] };
            updateFullProperty(id, updated);
            alert(`✅ ${llmName}: ${newFieldData.value}`);
          } else { alert(`✅ ${llmName}: ${newFieldData.value}`); }
        } else {
          alert(`❌ ${llmName} found no data`);
        }'''

new_content = re.sub(old_pattern, new_code, content)

if new_content != content:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('SUCCESS: File patched')
else:
    print('Pattern not matched - trying simple replace')
    old_simple = '''if (newFieldData) {
          // Update the property with the new field value
          alert(`✅ ${llmName} found data for ${fieldKey}: ${newFieldData.value}`);
          // TODO: Update fullProperty in store with new field data
        } else {
          alert(`❌ ${llmName} could not find data for ${fieldKey}`);
        }'''
    if old_simple in content:
        new_content = content.replace(old_simple, new_code)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('SUCCESS: File patched with simple replace')
    else:
        print('ERROR: Could not find pattern')

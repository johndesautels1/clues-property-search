#!/usr/bin/env python3
"""
Batch update all DataField calls to use renderDataField helper
"""
import re

# Read the file
with open('src/pages/PropertyDetail.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: <DataField label="X" value={fullProperty.category.field.value} />
pattern1 = r'<DataField label="([^"]+)" value=\{fullProperty\.([^.]+)\.([^.]+)\.value\} />'
replacement1 = r'{renderDataField("\1", fullProperty.\2.\3)}'
content = re.sub(pattern1, replacement1, content)

# Pattern 2: <DataField label="X" value={fullProperty.category.field.value} format="Y" />
pattern2 = r'<DataField label="([^"]+)" value=\{fullProperty\.([^.]+)\.([^.]+)\.value\} format="([^"]+)" />'
replacement2 = r'{renderDataField("\1", fullProperty.\2.\3, "\4")}'
content = re.sub(pattern2, replacement2, content)

# Pattern 3: With icon prop
pattern3 = r'<DataField label="([^"]+)" value=\{fullProperty\.([^.]+)\.([^.]+)\.value\} icon=\{([^}]+)\} />'
replacement3 = r'{renderDataField("\1", fullProperty.\2.\3, "text", \4)}'
content = re.sub(pattern3, replacement3, content)

# Pattern 4: With format and icon
pattern4 = r'<DataField label="([^"]+)" value=\{fullProperty\.([^.]+)\.([^.]+)\.value\} format="([^"]+)" icon=\{([^}]+)\} />'
replacement4 = r'{renderDataField("\1", fullProperty.\2.\3, "\4", \5)}'
content = re.sub(pattern4, replacement4, content)

# Write back
with open('src/pages/PropertyDetail.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated all DataField calls to use renderDataField")
print(f"📊 File size: {len(content)} characters")

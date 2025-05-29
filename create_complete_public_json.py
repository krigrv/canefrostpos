import json

# Read the formatted inventory with size data
with open('formatted_inventory.json', 'r') as f:
    formatted_data = json.load(f)

# Transform to public JSON format
public_data = []
for item in formatted_data:
    public_item = {
        "Item Name": item['name'],
        "Category": item['category'],
        "MRP": item['price'],
        "Barcode": item['barcode'],
        "Tax percentage": item['taxPercentage']
    }
    
    # Add size field if it exists and is not null
    if item.get('size') and item['size'] != 'null':
        public_item['size'] = item['size']
    
    public_data.append(public_item)

# Write to public JSON file
with open('public/Canefrost_Inventory_Upload.json', 'w') as f:
    json.dump(public_data, f, indent=2)

print(f"Successfully created public JSON with {len(public_data)} products")
print(f"Products with size: {len([p for p in public_data if 'size' in p])}")
print(f"Products without size: {len([p for p in public_data if 'size' not in p])}")
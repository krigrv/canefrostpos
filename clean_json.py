import json
import math

# Read the original JSON file
with open(r'c:\Users\Krishna Gaurav\GitHub\POS\Canefrost_Inventory_Upload.json', 'r') as f:
    data = json.load(f)

# Clean the data by removing unnecessary fields
cleaned_data = []
for item in data:
    cleaned_item = {
        'Item Name': item.get('Item Name'),
        'Category': item.get('Category'),
        'MRP': item.get('MRP'),
        'Barcode': item.get('Barcode'),
        'Tax type': item.get('Tax type'),
        'Tax percentage': item.get('Tax percentage')
    }
    
    # Remove None values and NaN values
    final_item = {}
    for k, v in cleaned_item.items():
        if v is not None:
            # Check if value is NaN (for numbers)
            if isinstance(v, float) and math.isnan(v):
                continue
            # Skip string 'NaN' values
            if str(v) == 'NaN':
                continue
            final_item[k] = v
    
    if final_item:  # Only add if there's actual data
        cleaned_data.append(final_item)

# Write the cleaned data back to the file
with open(r'c:\Users\Krishna Gaurav\GitHub\POS\Canefrost_Inventory_Upload.json', 'w') as f:
    json.dump(cleaned_data, f, indent=2)

print(f'Cleaned JSON file. Removed unnecessary fields. Total items: {len(cleaned_data)}')
print('Sample cleaned item:')
if cleaned_data:
    print(json.dumps(cleaned_data[0], indent=2))
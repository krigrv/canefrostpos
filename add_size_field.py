import json

# Load the formatted inventory
with open('formatted_inventory.json', 'r') as f:
    products = json.load(f)

# Define size mapping based on barcode ranges
def get_product_size(barcode):
    if not barcode or not barcode.startswith('CFRST'):
        return None
    
    try:
        # Extract number from barcode (e.g., CFRST01 -> 1)
        barcode_num = int(barcode.replace('CFRST', ''))
        
        if 1 <= barcode_num <= 27:
            return '240ml'
        elif 28 <= barcode_num <= 55:
            return '500ml'
        elif barcode == 'CFRST92':  # Water bottle 500ml
            return '500ml'
        elif barcode == 'CFRST91':  # Water bottle 1 litre
            return '1 Litre'
        elif barcode_num in [90, 93]:  # Tender coconut variants
            return '90ml' if barcode_num == 90 else '50ml'
        else:
            return None
    except ValueError:
        return None

# Add size field to each product
for product in products:
    size = get_product_size(product.get('barcode', ''))
    if size:
        product['size'] = size
    else:
        # For products without clear size mapping, try to infer from name or set default
        name = product.get('name', '').lower()
        if 'canesicle' in name:
            product['size'] = None  # Canesicles don't have standard liquid sizes
        elif 'blast' in name:
            product['size'] = None  # Blast products don't have standard liquid sizes
        elif 'barfi' in name or 'packaging' in name:
            product['size'] = None  # Non-liquid products
        else:
            product['size'] = None

# Sort products by size first, then by name
def sort_key(product):
    size = product.get('size')
    name = product.get('name', '')
    
    # Define size order priority
    size_priority = {
        '240ml': 1,
        '500ml': 2,
        '50ml': 3,
        '90ml': 4,
        '1 Litre': 5,
        None: 6  # Products without size go last
    }
    
    return (size_priority.get(size, 6), name.lower())

# Sort the products
products.sort(key=sort_key)

# Save the updated inventory
with open('formatted_inventory.json', 'w') as f:
    json.dump(products, f, indent=2)

print("Size field added and products sorted successfully!")

# Print summary
size_counts = {}
for product in products:
    size = product.get('size', 'No Size')
    size_counts[size] = size_counts.get(size, 0) + 1

print("\nProduct count by size:")
# Sort with None values handled properly
sorted_sizes = sorted(size_counts.items(), key=lambda x: (x[0] is None, x[0] or 'zzz'))
for size, count in sorted_sizes:
    size_display = size if size is not None else 'No Size'
    print(f"  {size_display}: {count} products")
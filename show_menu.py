import json

def show_menu_items():
    try:
        # Read the cleaned JSON file
        with open(r'c:\Users\Krishna Gaurav\GitHub\POS\Canefrost_Inventory_Upload.json', 'r') as f:
            products = json.load(f)
        
        print("=" * 60)
        print("CANEFROST POS - MENU ITEMS")
        print("=" * 60)
        print(f"Total Products Available: {len(products)}")
        print("=" * 60)
        
        # Group products by category
        categories = {}
        for product in products:
            category = product.get('Category', 'Unknown')
            if category not in categories:
                categories[category] = []
            categories[category].append(product)
        
        # Display products by category
        for category, items in categories.items():
            print(f"\n📂 {category.upper()} ({len(items)} items)")
            print("-" * 50)
            
            for i, item in enumerate(items, 1):
                name = item.get('Item Name', 'Unknown')
                price = item.get('MRP', 0)
                barcode = item.get('Barcode', 'N/A')
                tax = item.get('Tax percentage', 12)
                
                print(f"{i:2d}. {name:<30} ₹{price:>3} | {barcode} | Tax: {tax}%")
        
        print("\n" + "=" * 60)
        print("SUMMARY BY CATEGORY:")
        print("=" * 60)
        for category, items in categories.items():
            print(f"{category:<20}: {len(items):>3} items")
        
        # Create formatted data for POS system
        formatted_products = []
        for product in products:
            formatted_product = {
                'name': product.get('Item Name', ''),
                'category': product.get('Category', ''),
                'price': product.get('MRP', 0),
                'barcode': product.get('Barcode', ''),
                'taxPercentage': product.get('Tax percentage', 12),
                'stock': 50  # Default stock level
            }
            formatted_products.append(formatted_product)
        
        # Save formatted data
        with open(r'c:\Users\Krishna Gaurav\GitHub\POS\formatted_inventory.json', 'w') as f:
            json.dump(formatted_products, f, indent=2)
        
        print("\n" + "=" * 60)
        print("✅ Formatted inventory saved to 'formatted_inventory.json'")
        print("\nTo see these items in your POS system:")
        print("1. The system should load default products automatically")
        print("2. Check the Dashboard at http://localhost:3000/")
        print("3. If products don't appear, check browser console for errors")
        print("4. Products are loaded from InventoryContext.jsx default data")
        
        return formatted_products
        
    except Exception as e:
        print(f"Error reading menu file: {e}")
        return None

if __name__ == "__main__":
    show_menu_items()
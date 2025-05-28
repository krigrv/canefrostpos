# Python script to load inventory data to Firestore
import json
import os

# Try to import Firebase Admin SDK (optional)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Note: Firebase Admin SDK not installed. Install with: pip install firebase-admin")
    print("This script will still format the data for manual import.\n")

# Note: This script requires Firebase Admin SDK setup
# You'll need to download your Firebase service account key and update the path below

def load_inventory_to_firestore():
    try:
        if FIREBASE_AVAILABLE:
            # Initialize Firebase Admin (you'll need to add your service account key)
            # cred = credentials.Certificate('path/to/your/serviceAccountKey.json')
            # firebase_admin.initialize_app(cred)
            
            print("Note: Firebase Admin SDK setup required for direct Firestore upload.")
            print("Alternative: Use the Product Management interface in the web app.")
        else:
            print("Firebase Admin SDK not available. Formatting data for manual import...")
        
        # Read the cleaned JSON file
        json_file_path = os.path.join(os.path.dirname(__file__), 'Canefrost_Inventory_Upload.json')
        
        if not os.path.exists(json_file_path):
            print(f"Error: JSON file not found at {json_file_path}")
            return None
            
        with open(json_file_path, 'r', encoding='utf-8') as f:
            products = json.load(f)
        
        print(f"Found {len(products)} products in the JSON file:")
        print("\nSample products:")
        
        # Show first 10 products
        for i, product in enumerate(products[:10]):
            print(f"{i+1}. {product.get('Item Name')} - {product.get('Category')} - ₹{product.get('MRP')}")
        
        print(f"\n... and {len(products) - 10} more products")
        
        # Convert to format expected by the POS system
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
        
        # Save formatted data for manual import
        output_file_path = os.path.join(os.path.dirname(__file__), 'formatted_inventory.json')
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(formatted_products, f, indent=2, ensure_ascii=False)
        
        print("\nFormatted inventory saved to 'formatted_inventory.json'")
        print("\nTo load this data into your POS system:")
        print("1. Open the POS web application")
        print("2. Go to Product Management")
        print("3. Use the 'Add Product' feature to manually add items")
        print("4. Or implement a bulk import feature in the web interface")
        
        return formatted_products
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    load_inventory_to_firestore()
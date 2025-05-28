# Canefrost POS - Juice Shop Management System

A modern Point of Sale (POS) system built specifically for Canefrost Juice Shop. This application provides a comprehensive solution for managing inventory, processing sales, and tracking business performance.

## Features

### 🔐 Authentication
- Firebase Authentication integration
- Secure login/logout functionality
- Demo credentials for testing

### 🛒 Point of Sale
- Intuitive product selection with card-based UI (similar to PetPooja)
- Real-time cart management
- Tax calculation
- Multiple payment methods support
- Receipt generation

### 📦 Inventory Management
- Add, edit, and delete products
- Category-based organization
- Stock level tracking
- Barcode management
- Bulk product import from CSV

### 📊 Sales Analytics
- Daily sales tracking
- Revenue analytics
- Order history
- Customer transaction records
- Sales performance metrics

### 🎨 Modern UI/UX
- Material-UI components
- Responsive design
- Mobile-friendly interface
- Real-time updates
- Toast notifications

## Technology Stack

- **Frontend**: React 18, Material-UI
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Build Tool**: Vite
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Styling**: Material-UI + Custom CSS

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd POS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   
   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   
   b. Enable Authentication and Firestore Database
   
   c. Copy your Firebase configuration and update `src/firebase/config.js`:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   }
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

### Demo Credentials

For testing purposes, you can use these demo credentials:
- **Email**: demo@canefrost.com
- **Password**: demo123

*Note: You'll need to create this user in your Firebase Authentication console or modify the authentication logic to handle demo users.*

## Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   └── Login.jsx
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── Layout/
│   │   └── Layout.jsx
│   ├── ProductManagement/
│   │   └── ProductManagement.jsx
│   └── Sales/
│       └── SalesHistory.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── InventoryContext.jsx
├── firebase/
│   └── config.js
├── App.jsx
├── main.jsx
└── index.css
```

## Key Components

### Dashboard (POS Interface)
- Product grid with category filtering
- Search functionality
- Shopping cart with real-time updates
- Checkout process with payment simulation

### Product Management
- CRUD operations for products
- Category management
- Stock level monitoring
- Barcode scanning support

### Sales History
- Transaction history
- Sales analytics
- Revenue tracking
- Customer information

## Firebase Configuration

### Firestore Collections

The app uses the following Firestore collections:

1. **products**
   ```javascript
   {
     name: string,
     category: string,
     price: number,
     barcode: string,
     taxPercentage: number,
     stock: number
   }
   ```

2. **sales** (optional - for persistent sales data)
   ```javascript
   {
     items: array,
     subtotal: number,
     tax: number,
     total: number,
     timestamp: timestamp,
     paymentMethod: string,
     customerName: string
   }
   ```

### Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase hosting:
   ```bash
   firebase init hosting
   ```

4. Deploy:
   ```bash
   firebase deploy
   ```

## Features in Detail

### Product Cards UI
- Card-based product display similar to PetPooja
- Category-wise filtering
- Quick add to cart functionality
- Stock level indicators
- Price display with tax information

### Cart Management
- Real-time cart updates
- Quantity adjustment
- Item removal
- Tax calculation
- Total computation

### Stock Management
- Low stock alerts
- Inventory tracking
- Automatic stock updates on sales
- Manual stock adjustments

### Sales Processing
- Multiple payment methods
- Receipt generation
- Customer information capture
- Transaction logging

## Customization

### Adding New Product Categories
Update the `categories` array in `ProductManagement.jsx`:

```javascript
const categories = ['Cane Blend', 'Cane Fusion', 'Cane Pops', 'Cane Special', 'Others', 'Your New Category']
```

### Modifying Tax Rates
Update the default tax percentage in the product form or modify the tax calculation logic in `InventoryContext.jsx`.

### Customizing UI Theme
Modify the Material-UI theme in `main.jsx` to match your brand colors.

## Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Verify your Firebase configuration
   - Check if Firestore is enabled
   - Ensure authentication is properly set up

2. **Build Errors**
   - Clear node_modules and reinstall dependencies
   - Check for version compatibility issues

3. **Authentication Problems**
   - Verify Firebase Auth configuration
   - Check if the demo user exists in Firebase Auth

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for Canefrost Juice Shop**
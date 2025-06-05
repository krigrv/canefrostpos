# CaneFrost POS - Modern Juice Shop Management System

A comprehensive Point of Sale (POS) system built specifically for CaneFrost Juice Shop. This modern application provides a complete solution for managing inventory, processing sales, tracking business performance, and ensuring secure operations with enterprise-grade features.

## 🚀 Features

### 🔐 Authentication & Security
- **Dual Authentication**: Firebase Authentication with Supabase integration
- **Secure Environment Variables**: All API keys protected via environment variables
- **Role-based Access Control**: Admin and staff user management
- **Security Audit System**: Built-in security monitoring and audit trails
- **Data Encryption**: Encrypted backup and sensitive data protection

### 🛒 Advanced Point of Sale
- **Intuitive Product Selection**: Card-based UI with category filtering
- **Real-time Cart Management**: Live updates with quantity adjustments
- **Smart Tax Calculation**: Configurable tax rates with inclusive/exclusive options
- **Multiple Payment Methods**: Cash, card, and digital payment support
- **Thermal Receipt Printing**: Professional receipt generation with customizable templates
- **Customer Management**: Customer profiles and transaction history

### 📦 Comprehensive Inventory Management
- **Product CRUD Operations**: Add, edit, delete, and bulk manage products
- **Advanced Category System**: Hierarchical category organization
- **Real-time Stock Tracking**: Live inventory updates with low-stock alerts
- **Barcode Management**: Barcode scanning and generation support
- **Bulk Import/Export**: CSV-based product import with data validation
- **Stock Adjustment Tools**: Manual stock corrections and audit trails

### 📊 Business Analytics & Reporting
- **Sales Dashboard**: Real-time sales metrics and performance indicators
- **Revenue Analytics**: Daily, weekly, and monthly revenue tracking
- **Inventory Reports**: Stock levels, movement, and valuation reports
- **Customer Analytics**: Customer behavior and purchase patterns
- **Tax Reports**: GST/tax compliance reporting
- **Export Capabilities**: Data export for accounting and analysis

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Accessibility Features**: WCAG 2.1 compliant with screen reader support
- **Dark/Light Themes**: Customizable themes with brand color options
- **Real-time Notifications**: Toast notifications and system alerts
- **Progressive Web App**: Offline capabilities and app-like experience
- **Touch-friendly Interface**: Optimized for touch devices and POS terminals

### 🔧 System Features
- **Database Cleanup System**: Automated data maintenance and optimization
- **Backup & Restore**: Cloud backup with encryption
- **Error Boundary Protection**: Graceful error handling and recovery
- **Performance Monitoring**: Built-in performance analytics
- **Development Tools**: Debug panels and log analysis tools

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool with hot module replacement
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Modern icon library
- **Framer Motion**: Smooth animations and transitions

### Backend & Database
- **Supabase**: Primary database with real-time capabilities
- **Firebase**: Authentication and legacy data support
- **PostgreSQL**: Robust relational database via Supabase
- **Real-time Subscriptions**: Live data updates

### Development & Build
- **TypeScript Support**: Type-safe development
- **ESLint & Prettier**: Code quality and formatting
- **Hot Module Replacement**: Fast development experience
- **Bundle Analysis**: Performance optimization tools

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Supabase Account** (primary database)
- **Firebase Account** (authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/canefrost-pos.git
   cd canefrost-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration (Authentication)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Supabase Configuration (Database)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Security
   REACT_APP_BACKUP_ENCRYPTION_KEY=your_encryption_key
   ```

4. **Database Setup**
   
   Run the database setup scripts:
   ```bash
   # Create required tables
   node create_missing_tables.mjs
   
   # Setup categories
   node setup_categories_admin.mjs
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3001`

### Demo Credentials

For testing purposes, you can create a demo user through the Firebase Authentication console or use the built-in admin setup.

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/                    # Authentication components
│   ├── Dashboard/               # Main POS interface
│   ├── ProductManagement/       # Inventory management
│   ├── Sales/                   # Sales history and reports
│   ├── Customer/                # Customer management
│   ├── Staff/                   # Staff management
│   ├── Settings/                # System configuration
│   ├── Reports/                 # Analytics and reporting
│   ├── DevTools/                # Development utilities
│   ├── ErrorBoundary/           # Error handling
│   └── ui/                      # Reusable UI components
├── contexts/
│   ├── AuthContext.jsx          # Authentication state
│   ├── InventoryContext.jsx     # Inventory management
│   ├── SettingsContext.jsx      # Application settings
│   ├── CustomerContext.jsx      # Customer data
│   ├── StaffContext.jsx         # Staff management
│   └── SyncContext.jsx          # Data synchronization
├── firebase/
│   └── config.js                # Firebase configuration
├── supabase/
│   └── config.js                # Supabase configuration
├── services/
│   ├── cloudBackupService.js    # Backup operations
│   └── securityAuditService.js  # Security monitoring
├── utils/
│   ├── databaseCleanup.js       # Database maintenance
│   ├── duplicatePrevention.js   # Data integrity
│   ├── logAnalyzer.js           # Performance monitoring
│   └── accessibility.js        # Accessibility utilities
├── hooks/
│   ├── useInventory.js          # Inventory hooks
│   └── useDeviceDetection.js    # Device detection
└── styles/
    ├── accessibility.css        # Accessibility styles
    └── index.css                # Global styles
```

## 🗄️ Database Schema

### Supabase Tables

#### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  barcode VARCHAR UNIQUE,
  tax_percentage DECIMAL(5,2) DEFAULT 18.00,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 10,
  size VARCHAR,
  unit VARCHAR DEFAULT 'piece',
  description TEXT,
  image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR NOT NULL
);
```

#### Sales
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number VARCHAR UNIQUE NOT NULL,
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR NOT NULL,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR NOT NULL
);
```

#### Categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR,
  color VARCHAR,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR NOT NULL
);
```

## 🔧 Configuration

### Settings Management

The application includes comprehensive settings management:

- **Store Information**: Name, address, contact details, GST number
- **Tax Configuration**: Default rates, inclusive/exclusive settings
- **Receipt Settings**: Header/footer text, logo, thermal printer settings
- **Inventory Settings**: Low stock thresholds, auto-deduct options
- **Theme Customization**: Colors, fonts, layout preferences
- **Security Settings**: Backup frequency, audit logging

### Thermal Printer Configuration

```javascript
// Thermal printer settings
const thermalSettings = {
  printerWidth: '80mm',
  fontSize: 'medium',
  characterWidth: 32,
  printDensity: 'normal',
  paperCutType: 'full'
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables**
   Add all environment variables in Vercel dashboard

3. **Build Configuration**
   The project includes `vercel.json` for optimal deployment

### Manual Deployment

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting provider**
   Upload the `dist` folder to your web server

## 🔒 Security Features

### Environment Variable Protection
- All sensitive data stored in environment variables
- `.env` files excluded from version control
- Validation for required environment variables

### Database Security
- Row Level Security (RLS) enabled on all Supabase tables
- User-based data isolation
- Encrypted data transmission

### Authentication Security
- Firebase Authentication with email verification
- Session management and automatic token refresh
- Role-based access control

## 🧪 Development Tools

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Database Management
node create_missing_tables.mjs    # Create database tables
node setup_categories_admin.mjs   # Setup product categories

# Maintenance
npm run cleanup-db       # Clean up database
npm run cleanup-enhanced # Enhanced cleanup with analytics
```

### Debug Tools

- **Log Analyzer**: Real-time performance monitoring
- **Error Boundary**: Graceful error handling
- **Development Panel**: Debug information in development mode
- **Database Inspector**: Query and data analysis tools

## 📱 Mobile & Accessibility

### Mobile Optimization
- Touch-friendly interface
- Responsive breakpoints
- Offline capabilities
- Progressive Web App features

### Accessibility Features
- WCAG 2.1 AA compliance
- Screen reader support
- Keyboard navigation
- High contrast themes
- Focus management

## 🔄 Data Migration

The project includes comprehensive migration tools:

- **Firebase to Supabase**: Automated data migration scripts
- **CSV Import**: Bulk product import with validation
- **Backup & Restore**: Complete data backup solutions

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables**
   ```bash
   # Check if .env file exists and contains required variables
   cat .env
   ```

2. **Database Connection**
   ```javascript
   // Test Supabase connection
   import { testSupabaseConnection } from './src/supabase/config.js'
   await testSupabaseConnection()
   ```

3. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Performance Optimization

- Enable database indexing for frequently queried fields
- Use pagination for large datasets
- Implement proper caching strategies
- Monitor bundle size with included analyzer

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure accessibility compliance
- Test on multiple devices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Email: support@canefrost.com
- 📱 Phone: +91 9876543210
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/canefrost-pos/issues)
- 📖 Documentation: [Wiki](https://github.com/your-username/canefrost-pos/wiki)

## 🙏 Acknowledgments

- **Supabase** for the excellent database platform
- **Firebase** for authentication services
- **Vercel** for seamless deployment
- **Radix UI** for accessible components
- **Tailwind CSS** for utility-first styling

---

**Built with ❤️ for CaneFrost Juice Shop**

*Empowering small businesses with enterprise-grade POS solutions*
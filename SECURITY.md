# Security Guidelines

## Environment Variables

This project has been configured to use environment variables for sensitive configuration data instead of hardcoded values.

### Setup Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the `.env` file with your actual values:**
   - Replace `your_api_key_here` with your actual Firebase API key
   - Replace `your_project_id` with your actual Firebase project ID
   - Update other Firebase configuration values as needed
   - Change the admin credentials for production use

### Environment Variables Used

#### Firebase Configuration
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (optional)

#### Development Credentials
- `VITE_ADMIN_EMAIL` - Admin email for development
- `VITE_ADMIN_PASSWORD` - Admin password for development

### Security Best Practices

1. **Never commit `.env` files to version control**
   - The `.env` file is already added to `.gitignore`
   - Always use `.env.example` as a template

2. **Use different credentials for different environments**
   - Development: Use test credentials
   - Production: Use strong, unique credentials

3. **Rotate credentials regularly**
   - Change passwords periodically
   - Regenerate API keys when needed

4. **Limit access to environment variables**
   - Only share credentials with authorized team members
   - Use secure channels for sharing sensitive information

### Files Updated

The following files have been updated to use environment variables:

- `src/firebase/config.js` - Main Firebase configuration
- `src/contexts/AuthContext.jsx` - Authentication context
- `authenticated-upload.js` - Authenticated upload script
- `simple-firebase-upload.js` - Simple upload script
- `upload-to-firebase.js` - Upload to Firebase script
- `firebase-upload.js` - Firebase upload script

### Deployment

For deployment platforms like Vercel:

1. Add environment variables in your deployment platform's settings
2. Do not include the `.env` file in your deployment
3. Use the platform's secure environment variable storage

### Emergency Response

If credentials are accidentally exposed:

1. **Immediately rotate all exposed credentials**
2. **Check logs for unauthorized access**
3. **Update all affected systems**
4. **Review and improve security practices**

## Additional Security Measures

- Enable Firebase Security Rules
- Use HTTPS for all communications
- Implement proper authentication and authorization
- Regular security audits and updates
- Monitor for suspicious activities
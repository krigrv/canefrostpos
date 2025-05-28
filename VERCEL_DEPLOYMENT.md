# 🚀 Vercel Deployment Guide

This guide will help you deploy the Canefrost POS system to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Firebase Project**: Set up your Firebase project with proper configuration

## 🔧 Environment Variables

Before deploying, you need to set up the following environment variables in your Vercel dashboard:

### Firebase Configuration
```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🚀 Deployment Steps

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run vercel-build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

3. **Add Environment Variables**:
   - In the "Environment Variables" section
   - Add all Firebase configuration variables listed above
   - Make sure to select "Production", "Preview", and "Development" for each variable

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### Method 2: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   # ... add all other variables
   ```

5. **Redeploy with Environment Variables**:
   ```bash
   vercel --prod
   ```

## 📁 Project Structure for Vercel

The project is now configured with:

- ✅ `vercel.json` - Vercel configuration
- ✅ `.vercelignore` - Files to exclude from deployment
- ✅ `package.json` - Updated with `vercel-build` script
- ✅ `vite.config.js` - Optimized for production builds

## 🔒 Security Notes

1. **Environment Variables**: Never commit Firebase keys to your repository
2. **Firebase Rules**: Ensure your Firestore security rules are properly configured
3. **Authentication**: Test authentication flows in the deployed environment

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Verify environment variables are set correctly
- Check the build logs in Vercel dashboard

### Firebase Connection Issues
- Verify all Firebase environment variables are set
- Check Firebase project settings and permissions
- Ensure Firebase hosting domain is added to authorized domains

### Routing Issues
- The `vercel.json` file handles SPA routing
- All routes should redirect to `index.html` for client-side routing

## 📊 Performance Optimization

The deployment is optimized with:
- Static asset caching
- Gzip compression
- Tree shaking for smaller bundle sizes
- Code splitting for faster loading

## 🔄 Automatic Deployments

Once connected to GitHub:
- **Production**: Deploys automatically on pushes to `main` branch
- **Preview**: Creates preview deployments for pull requests
- **Development**: Can be configured for other branches

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify Firebase configuration
3. Test locally with `npm run build && npm run preview`
4. Check browser console for errors

---

**🎉 Your Canefrost POS system is now ready for Vercel deployment!**
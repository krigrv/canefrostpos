# Troubleshooting Guide

## Product Duplication Issue

The product duplication issue was caused by a circular import between `InventoryContext.jsx` and `useInventory.js`. This has been fixed by:

1. Moving the `InventoryContext` creation to `InventoryContext.jsx`
2. Exporting it from there
3. Importing it in `useInventory.js`
4. Disabling the auto-sync functionality that was running every 30 seconds

## Firebase Connection Error (ERR_BLOCKED_BY_CLIENT)

The `net::ERR_BLOCKED_BY_CLIENT` error is typically caused by:

### 1. Browser Ad Blockers
- **uBlock Origin**: May block Firebase requests
- **AdBlock Plus**: Can interfere with Firebase connections
- **Brave Browser**: Built-in shields may block Firebase

**Solution**: Temporarily disable ad blockers or add `localhost:3000` and `*.googleapis.com` to the whitelist.

### 2. Browser Extensions
- Privacy extensions (Privacy Badger, Ghostery)
- Security extensions
- VPN extensions

**Solution**: Try running the app in an incognito/private window or disable extensions.

### 3. Network/Firewall Issues
- Corporate firewalls
- Antivirus software
- Router settings

**Solution**: Check firewall settings and ensure Firebase domains are allowed.

## How to Check Browser Console

1. Open the application in your browser
2. Press `F12` or right-click and select "Inspect"
3. Go to the "Console" tab
4. Look for any red error messages
5. Check the "Network" tab for failed requests

## Testing Steps

1. Open the app in an incognito window
2. Disable all browser extensions
3. Check if products are duplicating
4. Look for Firebase connection errors in console
5. Try a different browser (Chrome, Firefox, Safari)

## If Issues Persist

1. Clear browser cache and cookies
2. Restart the development server
3. Check Firebase project settings
4. Verify environment variables in `.env` file
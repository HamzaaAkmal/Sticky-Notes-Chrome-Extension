# 🔧 Troubleshooting OAuth Authentication

## Common Error: "Auth error: [object Object]"

This error occurs when the Chrome Identity API encounters an issue. Here's how to fix it:

---

## ✅ Step-by-Step Fix

### 1. Check Extension ID

1. Go to `chrome://extensions/`
2. Find "Sticky Notes" extension
3. Copy the **Extension ID** (long string like `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
   Replace `YOUR_EXTENSION_ID` with the actual ID from step 1
5. Click **Save**

### 3. Verify OAuth Consent Screen

1. Go to **OAuth consent screen**
2. Check status - should be "Testing" or "Published"
3. Ensure your email is added as a test user (if in Testing mode)
4. Verify these scopes are added:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`

### 4. Check Manifest Configuration

Open `manifest.json` and verify:

```json
"permissions": [
  "storage",
  "activeTab",
  "scripting",
  "contextMenus",
  "identity"  // ← This must be present
],
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",  // ← Must match Google Cloud Console
  "scopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ]
}
```

### 5. Reload Extension

1. Go to `chrome://extensions/`
2. Find "Sticky Notes"
3. Click the **Reload** button (circular arrow icon)
4. Try signing in again

---

## 🐛 Specific Error Messages

### "OAuth2 not granted or revoked"

**Cause:** Extension ID not added to OAuth redirect URIs

**Fix:**
1. Get Extension ID from `chrome://extensions/`
2. Add redirect URI in Google Cloud Console (see Step 2 above)
3. Reload extension

### "Access blocked: This app's request is invalid"

**Cause:** Client ID mismatch or incorrect scopes

**Fix:**
1. Double-check Client ID in `manifest.json` matches Google Cloud Console
2. Verify scopes are exactly:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. Reload extension

### "Failed to get user information from Google"

**Cause:** Insufficient permissions or API not enabled

**Fix:**
1. Go to Google Cloud Console → **APIs & Services** → **Library**
2. Search for "Google+ API" or "People API"
3. Click **Enable**
4. Try again

### "Failed to authenticate with server"

**Cause:** Backend not accessible or CORS issue

**Fix:**
1. Verify backend URL: Open `https://pay.agent0s.dev/` in browser
2. Should see API documentation JSON
3. Check `.htaccess` file has CORS headers
4. Verify SSL certificate is active

---

## 🔍 Debug Mode

To get detailed error information:

1. Open browser console (F12)
2. Go to **Console** tab
3. Try signing in
4. Look for error messages with details

Common console messages:

```
Auth error: OAuth2 not granted or revoked.
```
→ Extension ID not in OAuth redirect URIs

```
Failed to get user info. Status: 401
```
→ Invalid or expired Google token

```
Backend auth failed. Status: 500
```
→ Server-side error, check PHP logs in cPanel

---

## 📋 Pre-Flight Checklist

Before attempting sign-in:

- [ ] Google Cloud project created
- [ ] OAuth credentials created
- [ ] Client ID copied to manifest.json
- [ ] Extension loaded in Chrome
- [ ] Extension ID copied
- [ ] Extension ID added to OAuth redirect URIs in Google Cloud Console
- [ ] OAuth consent screen configured
- [ ] Test users added (if in Testing mode)
- [ ] Required APIs enabled (Google+ API or People API)
- [ ] Extension reloaded after manifest changes

---

## 🔐 OAuth Flow Visualization

```
1. User clicks "Sign in with Google"
   ↓
2. Extension requests token via chrome.identity.getAuthToken()
   ↓
3. Chrome checks:
   - Is identity permission granted? ✓
   - Is Client ID valid? ✓
   - Is redirect URI authorized? ✓
   ↓
4. Google shows consent screen (if first time)
   ↓
5. User approves
   ↓
6. Google returns access token to extension
   ↓
7. Extension fetches user info from Google API
   ↓
8. Extension sends token + user info to backend
   ↓
9. Backend verifies token with Google
   ↓
10. Backend creates user token and returns it
   ↓
11. Extension stores user token locally
   ↓
12. Success! User is signed in ✓
```

---

## 🛠️ Testing OAuth Configuration

### Test 1: Check Identity Permission

```javascript
// Run in browser console on storage.html page
chrome.permissions.contains({permissions: ['identity']}, (result) => {
  console.log('Identity permission:', result);
});
```

Expected: `Identity permission: true`

### Test 2: Test Token Request

```javascript
// Run in browser console on storage.html page
chrome.identity.getAuthToken({interactive: true}, (token) => {
  if (chrome.runtime.lastError) {
    console.error('Error:', chrome.runtime.lastError.message);
  } else {
    console.log('Token received:', token ? 'Yes' : 'No');
  }
});
```

Expected: Token received successfully or specific error message

### Test 3: Verify Client ID Format

```javascript
// Run in browser console
fetch(chrome.runtime.getURL('manifest.json'))
  .then(r => r.json())
  .then(m => console.log('Client ID:', m.oauth2.client_id));
```

Expected: Client ID ending in `.apps.googleusercontent.com`

---

## 📞 Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Verify Extension ID** matches in Google Cloud Console
3. **Clear extension data**: 
   - Go to `chrome://extensions/`
   - Click "Details" on Sticky Notes
   - Scroll down and click "Remove extension data"
   - Reload extension and try again
4. **Try incognito mode** to rule out extension conflicts
5. **Check cPanel error logs** if backend auth fails

---

## ✅ Verification Commands

Run these in cPanel File Manager terminal or via SSH:

```bash
# Check if data directory exists
ls -la data/

# Check directory permissions
stat -c "%a %n" data/
stat -c "%a %n" data/notes/

# Test PHP version
php -v

# Check if cURL is enabled
php -m | grep curl
```

---

## 🎯 Quick Fix Summary

**Most common issue:** Extension ID not in OAuth redirect URIs

**Quick fix:**
1. Copy Extension ID from `chrome://extensions/`
2. Add `https://EXTENSION_ID.chromiumapp.org/` to Google Cloud Console OAuth settings
3. Reload extension
4. Try again

---

Need more help? Check the detailed [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

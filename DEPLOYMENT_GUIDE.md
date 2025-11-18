# Sticky Notes Cloud Storage - Complete Setup Guide

## Overview
This guide will help you set up the complete cloud storage feature for your Sticky Notes Chrome Extension, including Google OAuth authentication and PHP backend deployment.

---

## Part 1: Google Cloud Console Setup (for OAuth)

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: "Sticky Notes Extension"
4. Click **"Create"**

### Step 2: Enable APIs

1. In the sidebar, go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google+ API** (or **Google Identity Services**)
   - **Google OAuth2 API**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: Sticky Notes
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **Save and Continue**
5. On **Scopes** page, click **Add or Remove Scopes**
6. Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
7. Click **Save and Continue**
8. Add test users (your email addresses for testing)
9. Click **Save and Continue**

### Step 4: Create OAuth2 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Chrome App** or **Web application**
4. Name: "Sticky Notes Extension"
5. For **Authorized JavaScript origins**, add:
   ```
   chrome-extension://YOUR_EXTENSION_ID
   ```
   (You'll get the extension ID after installing)
6. For **Authorized redirect URIs**, add:
   ```
   https://YOUR_EXTENSION_ID.chromiumapp.org/
   ```
7. Click **Create**
8. **IMPORTANT**: Copy the **Client ID** (you'll need this for manifest.json)

### Step 5: Update Extension Manifest

1. Open `manifest.json` in your extension
2. Find the `oauth2` section
3. Replace `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:
   ```json
   "oauth2": {
     "client_id": "123456789-abcdefg.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/userinfo.email",
       "https://www.googleapis.com/auth/userinfo.profile"
     ]
   }
   ```

---

## Part 2: Backend Deployment on cPanel

### Step 1: Access Your cPanel

1. Log in to your hosting provider's cPanel
2. The URL is usually: `https://yourdomain.com/cpanel` or `https://yourdomain.com:2083`

### Step 2: Set Up Subdomain (Optional but Recommended)

1. In cPanel, find **Domains** or **Subdomains**
2. Create a new subdomain: `pay.agent0s.dev`
3. Set the document root to: `public_html/api` (or similar)
4. Click **Create**

### Step 3: Upload Backend Files

1. In cPanel, open **File Manager**
2. Navigate to the subdomain's document root (e.g., `public_html/api`)
3. Upload all files from the `backend-php` folder:
   - `auth.php`
   - `sync.php`
   - `get_notes.php`
   - `update_notes.php`
   - `index.php`
   - `.htaccess`

**Alternative: Use FTP**
- Use FileZilla or any FTP client
- Connect to your server
- Upload files to the appropriate directory

### Step 4: Create Data Directories

1. In File Manager, create these directories:
   ```
   api/
   ├── data/
   │   └── notes/
   ```

2. Set permissions:
   - Right-click `data` folder → **Change Permissions** → Set to **755**
   - Right-click `notes` folder → **Change Permissions** → Set to **755**

### Step 5: Verify PHP Settings

1. Go to **Select PHP Version** in cPanel
2. Ensure PHP version is **7.4 or higher**
3. Enable these extensions (if not already enabled):
   - `curl`
   - `json`
   - `fileinfo`

### Step 6: Test the Backend

1. Open your browser and visit: `https://pay.agent0s.dev/`
2. You should see JSON output with API documentation
3. If you see an error:
   - Check PHP error logs in cPanel
   - Verify file permissions
   - Ensure `.htaccess` is uploaded

### Step 7: Enable SSL Certificate

1. In cPanel, go to **SSL/TLS Status**
2. Find `pay.agent0s.dev`
3. Click **Run AutoSSL** or **Install SSL Certificate**
4. Wait for SSL to be installed (usually takes a few minutes)

**Alternative: Let's Encrypt**
- Some cPanel hosts have **Let's Encrypt SSL** option
- Click it and select your subdomain
- Install the free SSL certificate

---

## Part 3: Extension Installation and Testing

### Step 1: Load Extension in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select your extension folder: `stickynotes`
5. The extension will load and you'll see the Extension ID

### Step 2: Update OAuth Redirect URI

1. Copy the Extension ID from `chrome://extensions/`
2. Go back to [Google Cloud Console](https://console.cloud.google.com/)
3. Navigate to **APIs & Services** → **Credentials**
4. Edit your OAuth2 client
5. Update **Authorized redirect URIs** with actual Extension ID:
   ```
   https://YOUR_ACTUAL_EXTENSION_ID.chromiumapp.org/
   ```
6. Save changes

### Step 3: Test Cloud Storage Feature

1. Click the extension icon in Chrome
2. Go to **Dashboard** → **Cloud Storage** tab
3. Click **"Sign in with Google"**
4. You should see the Google OAuth consent screen
5. After signing in, your profile should appear
6. Click **"Sync Now"** to test synchronization

### Step 4: Test Auto-Sync

1. Create a sticky note on any webpage
2. Wait a few seconds
3. Check the Cloud Storage page - it should sync automatically
4. Enable **Auto-Sync** toggle
5. Create another note - it should sync within 2 seconds

---

## Part 4: Troubleshooting

### Issue: "Failed to sign in"

**Solution:**
- Verify Client ID in `manifest.json` matches Google Cloud Console
- Check OAuth consent screen is configured
- Ensure redirect URI includes actual Extension ID

### Issue: "Backend authentication failed"

**Solution:**
- Verify backend is accessible at `https://pay.agent0s.dev/api/auth.php`
- Check PHP error logs in cPanel
- Ensure `curl` extension is enabled in PHP

### Issue: "Sync failed"

**Solution:**
- Check if `data` and `notes` directories have correct permissions (755)
- Verify `.htaccess` file is uploaded
- Check if mod_rewrite is enabled in Apache

### Issue: CORS errors in browser console

**Solution:**
- Ensure `.htaccess` file contains CORS headers
- Check if mod_headers is enabled in Apache
- Contact hosting support to enable these modules

### Issue: "500 Internal Server Error"

**Solution:**
- Check PHP error logs: cPanel → **Metrics** → **Errors**
- Verify PHP version is 7.4+
- Check file and directory permissions

---

## Part 5: Security Best Practices

### 1. Protect Data Directory

The `.htaccess` file already includes:
```apache
<DirectoryMatch "^/.*/data/">
    Order Allow,Deny
    Deny from all
</DirectoryMatch>
```

### 2. Regular Backups

1. In cPanel File Manager, select `api/data` folder
2. Click **Compress** → Create backup
3. Download backup regularly

### 3. Monitor Logs

- Check PHP error logs regularly
- Monitor unusual activity
- Keep track of storage usage

### 4. Update Extension

- When updating the extension, reload it in `chrome://extensions/`
- Test all features after updates

---

## Part 6: Publishing to Chrome Web Store (Optional)

### Step 1: Prepare for Production

1. Update `manifest.json` version number
2. Remove console.log statements from production code
3. Test thoroughly

### Step 2: Create ZIP Package

1. Compress your `stickynotes` folder
2. Exclude:
   - `backend-php` folder (this stays on server)
   - `.git` folder
   - Development files

### Step 3: Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Pay the one-time $5 developer fee (if first time)
3. Click **"New Item"**
4. Upload your ZIP file
5. Fill in store listing details
6. Submit for review

### Step 4: Update OAuth Settings

Once published:
1. Add the published extension's ID to Google Cloud Console OAuth settings
2. Move OAuth consent screen from "Testing" to "Production"

---

## API Endpoints Reference

Base URL: `https://pay.agent0s.dev/api`

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth.php` | POST | Authenticate with Google | No |
| `/sync.php` | POST | Sync notes (upload/download/delete) | Yes |
| `/get_notes.php` | GET | Get all user notes | Yes |
| `/update_notes.php` | POST | Update notes for specific URL | Yes |

**Authentication Header:**
```
Authorization: Bearer {user_token}
```

---

## Support & Maintenance

### Monitoring

- Check cPanel disk usage regularly
- Monitor API response times
- Review error logs weekly

### Backup Schedule

- Weekly: Backup `data` directory
- Monthly: Full backup of API files
- Keep at least 3 backup copies

### Updates

- Keep PHP version updated
- Monitor Chrome extension API changes
- Update dependencies as needed

---

## Contact

For issues or questions:
- Check extension GitHub repository
- Review PHP error logs
- Contact hosting support for server issues

---

## Summary Checklist

- [ ] Google Cloud project created
- [ ] OAuth credentials configured
- [ ] Client ID added to manifest.json
- [ ] Backend files uploaded to cPanel
- [ ] Data directories created with correct permissions
- [ ] SSL certificate installed
- [ ] Extension loaded in Chrome
- [ ] OAuth redirect URI updated with actual Extension ID
- [ ] Sign-in tested successfully
- [ ] Manual sync tested
- [ ] Auto-sync enabled and tested
- [ ] Backend accessible at https://pay.agent0s.dev

---

Congratulations! Your Sticky Notes extension now has full cloud storage capabilities! 🎉

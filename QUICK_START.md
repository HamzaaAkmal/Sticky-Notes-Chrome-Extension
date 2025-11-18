# ⚡ Quick Start Guide - Cloud Storage Setup

## 🎯 Goal
Get your Sticky Notes extension with cloud storage up and running in 30 minutes.

---

## 📋 Prerequisites

- Google account
- Chrome browser
- Web hosting with cPanel (for pay.agent0s.dev)
- Basic knowledge of Chrome extensions

---

## 🚀 5-Step Setup

### Step 1: Google OAuth (10 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create new project: "Sticky Notes"
3. Enable APIs:
   - Google+ API
   - Google Identity Services
4. Configure OAuth consent screen:
   - App name: Sticky Notes
   - Add your email
   - Scopes: email, profile
5. Create credentials:
   - Type: Chrome App / Web application
   - Name: Sticky Notes Extension
6. **Copy the Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)

### Step 2: Update Extension (2 minutes)

1. Open `manifest.json`
2. Find the `oauth2` section
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID:
   ```json
   "oauth2": {
     "client_id": "123456789-abc.apps.googleusercontent.com",
     "scopes": [...]
   }
   ```
4. Save the file

### Step 3: Deploy Backend (10 minutes)

1. Log into your cPanel
2. Go to File Manager
3. Navigate to `public_html`
4. Create folder: `api`
5. Upload all files from `backend-php` folder
6. Create directories:
   - `api/data` (permissions: 755)
   - `api/data/notes` (permissions: 755)
7. Visit `https://pay.agent0s.dev/setup.php`
8. Verify all checks pass ✅
9. Delete `setup.php` when done

### Step 4: Install Extension (5 minutes)

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `stickynotes` folder
5. **Copy the Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
6. Go back to Google Cloud Console
7. Edit OAuth credentials
8. Add redirect URI:
   ```
   https://abcdefghijklmnopqrstuvwxyz123456.chromiumapp.org/
   ```
9. Save

### Step 5: Test (3 minutes)

1. Click extension icon
2. Go to Dashboard → Cloud Storage
3. Click "Sign in with Google"
4. Grant permissions
5. Verify your profile appears ✅
6. Click "Sync Now"
7. Check sync status shows "Synced" ✅

---

## ✅ Success Checklist

After setup, you should be able to:

- ✅ Sign in with Google
- ✅ See your profile picture and email
- ✅ Click "Sync Now" without errors
- ✅ See storage statistics
- ✅ Enable Auto-Sync toggle
- ✅ Create a note and see it auto-sync

---

## 🐛 Common Issues & Quick Fixes

### Issue: "Failed to sign in"
**Fix:** Check Client ID in manifest.json matches Google Cloud Console

### Issue: "Sync failed"
**Fix:** Verify `https://pay.agent0s.dev/api/auth.php` is accessible

### Issue: "Permission denied" on backend
**Fix:** Set folder permissions to 755:
```bash
chmod 755 data
chmod 755 data/notes
```

### Issue: OAuth error
**Fix:** Make sure redirect URI includes the ACTUAL Extension ID from chrome://extensions/

---

## 📱 Test Cross-Device Sync

1. **Device 1:** Create some sticky notes
2. **Device 1:** Wait for auto-sync (or click Sync Now)
3. **Device 2:** Install extension
4. **Device 2:** Sign in with same Google account
5. **Device 2:** Click "Sync Now"
6. **Verify:** Notes appear on Device 2! ✨

---

## 🎓 Next Steps

- [ ] Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup
- [ ] Check [API_REFERENCE.md](API_REFERENCE.md) for API details
- [ ] Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture
- [ ] Enable SSL certificate on your domain
- [ ] Set up regular backups of `data` folder
- [ ] Test all features thoroughly
- [ ] Consider publishing to Chrome Web Store

---

## 💡 Pro Tips

1. **Pin the extension** to your toolbar for easy access
2. **Enable Auto-Sync** for seamless experience
3. **Backup regularly** using cPanel's backup feature
4. **Monitor logs** in cPanel for any issues
5. **Use HTTPS** always for security

---

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check cPanel error logs
3. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
4. Test API endpoints with curl
5. Verify SSL certificate is valid

---

## 🎉 That's It!

You now have a fully functional cloud-synced sticky notes extension!

**Enjoy taking notes across all your devices!** 📝☁️✨

---

*Estimated total setup time: 30 minutes*
*Difficulty: Intermediate*

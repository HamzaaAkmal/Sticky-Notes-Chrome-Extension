# 🚨 500 Internal Server Error - Troubleshooting Guide

## Quick Diagnosis Steps

### Step 1: Check if PHP is Working

1. Access: `https://pay.agent0s.dev/test.php`
2. If you see JSON output with PHP info → PHP is working
3. If you get 500 error → PHP has syntax errors or Apache config issue

### Step 2: Check Error Logs

**In cPanel:**
1. Go to **Metrics** → **Errors**
2. Look at the most recent errors
3. Common errors:
   - "Invalid command 'Header'" → mod_headers not enabled
   - "Invalid command 'php_value'" → Wrong PHP handler
   - Parse error → PHP syntax error
   - Permission denied → File permissions issue

### Step 3: Try Minimal .htaccess

1. In cPanel File Manager, go to your API directory
2. Rename `.htaccess` to `.htaccess.backup`
3. Rename `.htaccess.minimal` to `.htaccess`
4. Try accessing the site again

### Step 4: Completely Remove .htaccess (Temporary Test)

1. Delete or rename `.htaccess` file
2. Access: `https://pay.agent0s.dev/index.php` directly
3. If it works → `.htaccess` is the problem
4. If still fails → PHP code issue

---

## Common Causes & Fixes

### Cause 1: mod_headers Not Enabled

**Symptom:** Error log says "Invalid command 'Header'"

**Fix:**
1. Use `.htaccess.minimal` instead (wraps Header in `<IfModule>`)
2. Or contact hosting to enable mod_headers
3. Or remove Header lines - CORS will be handled in PHP

### Cause 2: Wrong PHP Handler

**Symptom:** Error about "php_value"

**Fix:** Remove these lines from `.htaccess`:
```apache
php_value upload_max_filesize 10M
php_value post_max_size 10M
php_value memory_limit 128M
```

### Cause 3: PHP Syntax Error

**Symptom:** Error log shows "Parse error" or "syntax error"

**Fix:**
1. Check error logs for specific file and line number
2. Common issues:
   - Missing semicolon
   - Unclosed brackets
   - Short tags `<?` instead of `<?php`

### Cause 4: File Permissions

**Symptom:** "Permission denied"

**Fix:**
1. Set file permissions:
   - PHP files: `644` (rw-r--r--)
   - Directories: `755` (rwxr-xr-x)
   - `.htaccess`: `644`

**In cPanel:**
```bash
# Right-click → Change Permissions
Files: 644
Folders: 755
```

### Cause 5: PHP Version Too Old

**Symptom:** "Call to undefined function"

**Fix:**
1. In cPanel, go to **Select PHP Version**
2. Choose PHP 7.4 or higher
3. Enable required extensions: curl, json, fileinfo

---

## Step-by-Step Fix Procedure

### Solution 1: Use Minimal Configuration

1. **Replace .htaccess:**
   ```bash
   # In cPanel File Manager
   - Rename .htaccess to .htaccess.old
   - Rename .htaccess.minimal to .htaccess
   ```

2. **Test again:** Visit `https://pay.agent0s.dev/test.php`

### Solution 2: Remove .htaccess Completely

1. **Delete .htaccess** temporarily
2. **Access files directly:**
   - `https://pay.agent0s.dev/index.php`
   - `https://pay.agent0s.dev/auth.php`
3. **If it works**, .htaccess was the problem
4. **Update extension** to access files without /api/ prefix

### Solution 3: Enable Error Display

Add this to top of `index.php`:
```php
<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
?>
```

Then visit the page to see specific error.

### Solution 4: Check PHP Version

**In cPanel:**
1. Go to **Select PHP Version** or **MultiPHP Manager**
2. Select your domain
3. Choose **PHP 7.4** or **PHP 8.0+**
4. Save

### Solution 5: Fix File Permissions

**Via cPanel File Manager:**
```bash
# Select all PHP files
1. Right-click → Change Permissions → 644

# For data and notes folders
1. Right-click → Change Permissions → 755
2. Check "Recurse into subdirectories"
```

**Via SSH (if available):**
```bash
cd /path/to/your/api/directory
chmod 644 *.php
chmod 644 .htaccess
chmod 755 data
chmod 755 data/notes
```

---

## Testing Checklist

After each fix, test these URLs:

- [ ] `https://pay.agent0s.dev/test.php` - Basic PHP test
- [ ] `https://pay.agent0s.dev/` or `https://pay.agent0s.dev/index.php` - API docs
- [ ] `https://pay.agent0s.dev/setup.php` - Setup diagnostics

---

## If Nothing Works: Use Direct File Access

If you can't fix the `.htaccess` issue, you can modify the extension to access PHP files directly:

### Update extension files:

**1. In `pages/storage.js`:**
```javascript
const API_BASE_URL = 'https://pay.agent0s.dev';
// Remove /api from the end
```

**2. In `background/sync-helper.js`:**
```javascript
API_BASE_URL: 'https://pay.agent0s.dev',
// Remove /api from the end
```

**3. Update API calls to use direct file names:**
```javascript
// Instead of: /api/auth.php
// Use: /auth.php

fetch(`${API_BASE_URL}/auth.php`, ...)
```

---

## Read Error Logs

### In cPanel:
1. **Errors** (under Metrics) - Shows Apache/PHP errors
2. **Raw Access** (under Metrics) - Shows all requests
3. **File Manager** → Look for `error_log` file in your directory

### Common Error Messages:

**"Invalid command 'Header'"**
→ mod_headers not enabled - use .htaccess.minimal

**"Invalid command 'php_value'"**
→ Wrong PHP handler - remove php_value lines

**"Parse error in /path/to/file.php"**
→ PHP syntax error - check the specific line

**"Call to undefined function curl_init"**
→ cURL not enabled - enable in Select PHP Version

**"Permission denied"**
→ Wrong permissions - use chmod 755 for dirs, 644 for files

---

## Emergency Fallback: No .htaccess

If you need the site working IMMEDIATELY:

1. **Delete .htaccess** completely
2. **Access files directly:**
   - Auth: `https://pay.agent0s.dev/auth.php`
   - Sync: `https://pay.agent0s.dev/sync.php`
   - Get: `https://pay.agent0s.dev/get_notes.php`

3. **Update extension API URLs** to not use /api/ prefix

4. **Add CORS in PHP** - Each PHP file already has:
   ```php
   header('Access-Control-Allow-Origin: *');
   ```

---

## Contact Information

If you can't resolve it:
1. Share the **specific error message** from error logs
2. Share **PHP version** from cPanel
3. Share result of accessing `test.php`
4. Share what the error log says (most important!)

---

## Quick Commands for cPanel Terminal

If your host provides terminal access:

```bash
# Check PHP version
php -v

# Check if files exist
ls -la

# Check permissions
stat -c "%a %n" *

# Check Apache error log (if accessible)
tail -20 /path/to/error_log
```

---

## Summary: Most Likely Fix

**Based on "500 Internal Server Error":**

1. ✅ Try `.htaccess.minimal` first (most likely fix)
2. ✅ Check error logs in cPanel
3. ✅ Test with `test.php`
4. ✅ If needed, remove `.htaccess` completely
5. ✅ Make sure PHP 7.4+ is selected
6. ✅ Check file permissions (644 for PHP files)

**The error is almost certainly:**
- `.htaccess` directive not supported by server
- Wrong PHP version
- File permission issue

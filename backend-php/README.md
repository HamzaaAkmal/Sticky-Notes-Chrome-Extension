# Sticky Notes Cloud Storage Backend

This is the PHP backend for the Sticky Notes Chrome Extension cloud storage feature.

## Features

- Google OAuth authentication
- JSON-based data storage
- RESTful API endpoints
- Automatic data syncing
- Secure user token management

## Server Requirements

- PHP 7.4 or higher
- cURL extension enabled
- mod_rewrite enabled (Apache)
- Write permissions for data directory

## Installation on cPanel

### Step 1: Upload Files

1. Log in to your cPanel account at your hosting provider
2. Go to **File Manager**
3. Navigate to `public_html` or your domain's root directory
4. Create a new folder named `api` (or upload to root if you want API at root level)
5. Upload all PHP files from the `backend-php` folder to the `api` directory:
   - `auth.php`
   - `sync.php`
   - `get_notes.php`
   - `update_notes.php`
   - `index.php`
   - `.htaccess`

### Step 2: Set Up Directory Permissions

1. In File Manager, create a `data` folder inside the `api` directory
2. Create a `notes` folder inside the `data` directory
3. Set permissions for the `data` directory:
   - Right-click on `data` folder
   - Click **Change Permissions**
   - Set to `755` or `775` (rwxr-xr-x or rwxrwxr-x)
4. Set permissions for the `notes` directory the same way

### Step 3: Configure Domain

Your API will be accessible at:
```
https://pay.agent0s.dev/api/auth.php
https://pay.agent0s.dev/api/sync.php
https://pay.agent0s.dev/api/get_notes.php
https://pay.agent0s.dev/api/update_notes.php
```

### Step 4: Test the API

1. Visit `https://pay.agent0s.dev/` to see the API documentation
2. You should see a JSON response with API information

### Step 5: Enable HTTPS

1. In cPanel, go to **SSL/TLS Status**
2. Enable SSL for your domain `pay.agent0s.dev`
3. Or use **Let's Encrypt SSL** from cPanel to get a free SSL certificate

## Security Considerations

1. **Data Directory Protection**: The `.htaccess` file prevents direct access to the `data` directory
2. **User Token Authentication**: All API requests (except auth) require a valid Bearer token
3. **Google OAuth Verification**: The backend verifies Google OAuth tokens before authentication
4. **File Permissions**: Keep `data` and `notes` directories with 755 permissions

## Directory Structure

```
api/
├── auth.php              # Authentication endpoint
├── sync.php              # Sync endpoint
├── get_notes.php         # Get notes endpoint
├── update_notes.php      # Update notes endpoint
├── index.php             # API documentation
├── .htaccess             # Apache configuration
└── data/                 # Data storage directory (create this)
    ├── users.json        # User database (auto-created)
    └── notes/            # User notes directory (create this)
        └── {hash}.json   # Individual user notes files (auto-created)
```

## API Endpoints

### 1. Authentication
**POST** `/api/auth.php`

Authenticates a user with Google OAuth token.

**Request:**
```json
{
  "google_token": "google_oauth_token",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "user_token": "secure_token",
  "email": "user@example.com",
  "name": "User Name"
}
```

### 2. Sync Notes
**POST** `/api/sync.php`

Syncs notes between client and server.

**Headers:**
```
Authorization: Bearer {user_token}
```

**Upload Request:**
```json
{
  "action": "upload",
  "notes": {
    "https://example.com": [
      {
        "id": "note_id",
        "content": "Note content",
        "position": { "x": 100, "y": 100 }
      }
    ]
  }
}
```

**Download Request:**
```json
{
  "action": "download"
}
```

**Delete All Request:**
```json
{
  "action": "delete_all"
}
```

### 3. Get Notes
**GET** `/api/get_notes.php`

Retrieves all notes for authenticated user.

**Headers:**
```
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "notes": { ... },
  "email": "user@example.com"
}
```

### 4. Update Notes
**POST** `/api/update_notes.php`

Updates notes for a specific URL.

**Headers:**
```
Authorization: Bearer {user_token}
```

**Request:**
```json
{
  "url": "https://example.com",
  "notes": [
    {
      "id": "note_id",
      "content": "Updated content"
    }
  ]
}
```

## Troubleshooting

### 1. "500 Internal Server Error"
- Check PHP error logs in cPanel
- Verify file permissions (755 for directories, 644 for PHP files)
- Ensure PHP version is 7.4 or higher

### 2. "Failed to authenticate"
- Verify Google OAuth token is valid
- Check cURL extension is enabled in PHP
- Verify API URL is correct

### 3. "Permission denied" errors
- Set `data` and `notes` directories to 755 or 775
- Ensure web server has write access

### 4. CORS errors
- Verify `.htaccess` file is uploaded
- Check if mod_headers is enabled in Apache

## Maintenance

### Backup Data
Regularly backup the `data` directory:
1. In cPanel File Manager, select the `data` folder
2. Click **Compress** to create a backup
3. Download the compressed file

### Monitor Storage
- User notes are stored as JSON files in `data/notes/`
- Each file is named with a SHA-256 hash of the user's email
- Monitor disk usage in cPanel

## Support

For issues or questions, contact the developer or check the Chrome extension repository.

## License

This backend is part of the Sticky Notes Chrome Extension project.

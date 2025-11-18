# API Quick Reference

## Base URL
```
https://pay.agent0s.dev/api
```

## Authentication

All endpoints except `/auth.php` require authentication using Bearer token:

```
Authorization: Bearer {user_token}
```

---

## Endpoints

### 1. Authenticate User

**POST** `/auth.php`

Authenticate user with Google OAuth token and get user token.

**Request:**
```json
{
  "google_token": "ya29.a0AfH6SMBx...",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user_token": "abc123def456...",
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid Google token"
}
```

---

### 2. Sync Notes

**POST** `/sync.php`

Upload, download, or delete notes.

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

#### Action: Upload

Upload local notes to cloud.

**Request:**
```json
{
  "action": "upload",
  "notes": {
    "https://example.com": [
      {
        "id": "note_123",
        "content": "My note content",
        "position": { "x": 100, "y": 200 },
        "size": { "width": 250, "height": 200 },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "https://github.com": [
      {
        "id": "note_456",
        "content": "Another note",
        "position": { "x": 50, "y": 100 }
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notes uploaded successfully"
}
```

#### Action: Download

Download notes from cloud.

**Request:**
```json
{
  "action": "download"
}
```

**Response:**
```json
{
  "success": true,
  "notes": {
    "https://example.com": [
      {
        "id": "note_123",
        "content": "My note content",
        "position": { "x": 100, "y": 200 }
      }
    ]
  }
}
```

#### Action: Delete All

Delete all cloud notes.

**Request:**
```json
{
  "action": "delete_all"
}
```

**Response:**
```json
{
  "success": true,
  "message": "All notes deleted successfully"
}
```

---

### 3. Get Notes

**GET** `/get_notes.php`

Retrieve all notes for authenticated user.

**Headers:**
```
Authorization: Bearer {user_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "notes": {
    "https://example.com": [
      {
        "id": "note_123",
        "content": "My note",
        "position": { "x": 100, "y": 200 }
      }
    ]
  },
  "email": "user@example.com"
}
```

---

### 4. Update Notes for URL

**POST** `/update_notes.php`

Update notes for a specific URL.

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request:**
```json
{
  "url": "https://example.com",
  "notes": [
    {
      "id": "note_123",
      "content": "Updated content",
      "position": { "x": 150, "y": 250 }
    },
    {
      "id": "note_789",
      "content": "New note",
      "position": { "x": 50, "y": 50 }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notes updated successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### 405 Method Not Allowed
```json
{
  "success": false,
  "error": "Method not allowed"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## CORS Headers

The API supports CORS for cross-origin requests:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. However, it's recommended to:
- Batch updates when possible
- Use auto-sync with debouncing (2-second delay)
- Avoid excessive API calls

---

## Data Format

### Note Object

```typescript
{
  id: string;              // Unique identifier
  content: string;         // Note content (HTML)
  position: {
    x: number;            // X coordinate
    y: number;            // Y coordinate
  };
  size?: {
    width: number;        // Width in pixels
    height: number;       // Height in pixels
  };
  timestamp?: string;     // ISO 8601 timestamp
  color?: string;         // Note color
}
```

### Notes Storage Structure

```typescript
{
  "https://example.com": Note[],
  "https://github.com": Note[],
  ...
}
```

---

## Security Best Practices

1. **Always use HTTPS** for API requests
2. **Never expose user tokens** in client-side code logs
3. **Validate Google tokens** on the backend
4. **Rotate tokens** if compromised
5. **Use secure storage** for tokens in extension

---

## Testing with cURL

### Test Authentication
```bash
curl -X POST https://pay.agent0s.dev/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{"google_token":"TOKEN","email":"test@example.com","name":"Test User"}'
```

### Test Get Notes
```bash
curl -X GET https://pay.agent0s.dev/api/get_notes.php \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Test Upload
```bash
curl -X POST https://pay.agent0s.dev/api/sync.php \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"upload","notes":{"https://example.com":[{"id":"1","content":"Test"}]}}'
```

---

## Support

For API issues:
1. Check server error logs in cPanel
2. Verify authentication token is valid
3. Ensure proper CORS headers
4. Check PHP version and extensions

For extension issues:
1. Check browser console for errors
2. Verify manifest.json configuration
3. Test OAuth flow in isolation
4. Check network tab for API responses

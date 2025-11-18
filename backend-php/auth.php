<?php
/**
 * Authentication API
 * Handles Google OAuth authentication and user token generation
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
define('DB_FILE', __DIR__ . '/data/users.json');
define('NOTES_DIR', __DIR__ . '/data/notes/');

// Ensure data directories exist
if (!file_exists(__DIR__ . '/data')) {
    mkdir(__DIR__ . '/data', 0755, true);
}
if (!file_exists(NOTES_DIR)) {
    mkdir(NOTES_DIR, 0755, true);
}

/**
 * Generate a secure user token
 */
function generateUserToken($email) {
    return hash('sha256', $email . time() . bin2hex(random_bytes(16)));
}

/**
 * Verify Google OAuth token
 */
function verifyGoogleToken($token) {
    $url = 'https://www.googleapis.com/oauth2/v2/tokeninfo?access_token=' . $token;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    }
    
    return false;
}

/**
 * Load users database
 */
function loadUsers() {
    if (!file_exists(DB_FILE)) {
        return [];
    }
    
    $content = file_get_contents(DB_FILE);
    return json_decode($content, true) ?: [];
}

/**
 * Save users database
 */
function saveUsers($users) {
    file_put_contents(DB_FILE, json_encode($users, JSON_PRETTY_PRINT));
}

/**
 * Get or create user
 */
function getOrCreateUser($email, $name, $picture) {
    $users = loadUsers();
    
    // Check if user exists
    if (isset($users[$email])) {
        // Update user info
        $users[$email]['name'] = $name;
        $users[$email]['picture'] = $picture;
        $users[$email]['last_login'] = date('c');
    } else {
        // Create new user
        $users[$email] = [
            'email' => $email,
            'name' => $name,
            'picture' => $picture,
            'user_token' => generateUserToken($email),
            'created_at' => date('c'),
            'last_login' => date('c')
        ];
    }
    
    saveUsers($users);
    return $users[$email];
}

/**
 * Main authentication handler
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['google_token']) || !isset($input['email'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        exit();
    }
    
    $googleToken = $input['google_token'];
    $email = $input['email'];
    $name = $input['name'] ?? 'Unknown User';
    $picture = $input['picture'] ?? '';
    
    // Verify Google token
    $tokenInfo = verifyGoogleToken($googleToken);
    
    if (!$tokenInfo || !isset($tokenInfo['email']) || $tokenInfo['email'] !== $email) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid Google token'
        ]);
        exit();
    }
    
    // Get or create user
    $user = getOrCreateUser($email, $name, $picture);
    
    // Return user token
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user_token' => $user['user_token'],
        'email' => $user['email'],
        'name' => $user['name']
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}

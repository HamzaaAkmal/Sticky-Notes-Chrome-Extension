<?php
/**
 * Get Notes API
 * Retrieves user's notes from cloud storage
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
define('DB_FILE', __DIR__ . '/data/users.json');
define('NOTES_DIR', __DIR__ . '/data/notes/');

/**
 * Verify user token
 */
function verifyUserToken($token) {
    if (!file_exists(DB_FILE)) {
        return false;
    }
    
    $users = json_decode(file_get_contents(DB_FILE), true);
    
    foreach ($users as $email => $user) {
        if (isset($user['user_token']) && $user['user_token'] === $token) {
            return $email;
        }
    }
    
    return false;
}

/**
 * Get user's notes file path
 */
function getUserNotesFile($email) {
    $filename = hash('sha256', $email) . '.json';
    return NOTES_DIR . $filename;
}

/**
 * Load user's notes
 */
function loadUserNotes($email) {
    $file = getUserNotesFile($email);
    
    if (!file_exists($file)) {
        return [];
    }
    
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

/**
 * Main handler
 */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get authorization token
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!preg_match('/Bearer\s+(.+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Missing authorization token'
        ]);
        exit();
    }
    
    $token = $matches[1];
    $email = verifyUserToken($token);
    
    if (!$email) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid token'
        ]);
        exit();
    }
    
    // Load and return notes
    $notes = loadUserNotes($email);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'notes' => $notes,
        'email' => $email
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}

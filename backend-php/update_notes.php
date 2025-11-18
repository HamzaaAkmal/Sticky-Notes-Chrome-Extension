<?php
/**
 * Update Notes API
 * Updates specific notes in cloud storage
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
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
 * Save user's notes
 */
function saveUserNotes($email, $notes) {
    $file = getUserNotesFile($email);
    file_put_contents($file, json_encode($notes, JSON_PRETTY_PRINT));
    
    // Update last modified time
    if (file_exists(DB_FILE)) {
        $users = json_decode(file_get_contents(DB_FILE), true);
        if (isset($users[$email])) {
            $users[$email]['last_sync'] = date('c');
            file_put_contents(DB_FILE, json_encode($users, JSON_PRETTY_PRINT));
        }
    }
}

/**
 * Main handler
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['url']) || !isset($input['notes'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields (url, notes)'
        ]);
        exit();
    }
    
    $url = $input['url'];
    $newNotes = $input['notes'];
    
    // Load existing notes
    $allNotes = loadUserNotes($email);
    
    // Update notes for the specific URL
    $allNotes[$url] = $newNotes;
    
    // Save updated notes
    saveUserNotes($email, $allNotes);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Notes updated successfully'
    ]);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}

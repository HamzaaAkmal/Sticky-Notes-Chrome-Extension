<?php
/**
 * Sync API
 * Handles uploading, downloading, and syncing notes data
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
    $users = json_decode(file_get_contents(DB_FILE), true);
    if (isset($users[$email])) {
        $users[$email]['last_sync'] = date('c');
        file_put_contents(DB_FILE, json_encode($users, JSON_PRETTY_PRINT));
    }
}

/**
 * Delete user's notes
 */
function deleteUserNotes($email) {
    $file = getUserNotesFile($email);
    if (file_exists($file)) {
        unlink($file);
    }
}

/**
 * Merge notes (prevent duplicates using note IDs)
 */
function mergeNotes($localNotes, $cloudNotes) {
    $merged = [];
    
    // Combine all URLs from both sources
    $allUrls = array_unique(array_merge(array_keys($localNotes), array_keys($cloudNotes)));
    
    foreach ($allUrls as $url) {
        $localUrlNotes = isset($localNotes[$url]) ? $localNotes[$url] : [];
        $cloudUrlNotes = isset($cloudNotes[$url]) ? $cloudNotes[$url] : [];
        
        // Combine notes and deduplicate by ID or content
        $combinedNotes = array_merge($cloudUrlNotes, $localUrlNotes);
        $seenIds = [];
        $seenContent = [];
        $deduplicatedNotes = [];
        
        foreach ($combinedNotes as $note) {
            if (isset($note['id']) && !empty($note['id'])) {
                // Deduplicate by ID
                if (!isset($seenIds[$note['id']])) {
                    $seenIds[$note['id']] = true;
                    $deduplicatedNotes[] = $note;
                }
            } else {
                // For notes without ID, check by content+position
                $contentKey = $note['content'] . '_' . $note['top'] . '_' . $note['left'] . '_' . $note['title'];
                if (!isset($seenContent[$contentKey])) {
                    $seenContent[$contentKey] = true;
                    // Generate ID for notes without one
                    $note['id'] = 'note_' . time() . '_' . bin2hex(random_bytes(4));
                    $deduplicatedNotes[] = $note;
                }
            }
        }
        
        $merged[$url] = $deduplicatedNotes;
    }
    
    return $merged;
}

/**
 * Main sync handler
 */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
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
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'upload':
            // Upload notes from client to server
            if (!isset($input['notes'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Missing notes data'
                ]);
                exit();
            }
            
            $localNotes = $input['notes'];
            $cloudNotes = loadUserNotes($email);
            
            // Merge notes
            $merged = mergeNotes($localNotes, $cloudNotes);
            
            // Save merged notes
            saveUserNotes($email, $merged);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Notes uploaded successfully'
            ]);
            break;
            
        case 'download':
            // Download notes from server to client
            $notes = loadUserNotes($email);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'notes' => $notes
            ]);
            break;
            
        case 'delete_all':
            // Delete all cloud notes
            deleteUserNotes($email);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'All notes deleted successfully'
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid action'
            ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
}

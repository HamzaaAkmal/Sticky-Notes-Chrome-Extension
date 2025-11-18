<?php
/**
 * Sticky Notes Cloud Storage API
 * Index page with API documentation
 */

header('Content-Type: application/json');

$apiDocs = [
    'name' => 'Sticky Notes Cloud Storage API',
    'version' => '1.0',
    'base_url' => 'https://pay.agent0s.dev',
    'endpoints' => [
        'authentication' => [
            'url' => '/api/auth.php',
            'method' => 'POST',
            'description' => 'Authenticate user with Google OAuth token',
            'body' => [
                'google_token' => 'string (required)',
                'email' => 'string (required)',
                'name' => 'string (optional)',
                'picture' => 'string (optional)'
            ],
            'response' => [
                'success' => 'boolean',
                'user_token' => 'string',
                'email' => 'string',
                'name' => 'string'
            ]
        ],
        'sync' => [
            'url' => '/api/sync.php',
            'method' => 'POST',
            'description' => 'Sync notes between client and server',
            'headers' => [
                'Authorization' => 'Bearer {user_token}'
            ],
            'actions' => [
                'upload' => 'Upload local notes to server',
                'download' => 'Download notes from server',
                'delete_all' => 'Delete all cloud notes'
            ],
            'body' => [
                'action' => 'string (required): upload, download, or delete_all',
                'notes' => 'object (required for upload): notes data'
            ]
        ],
        'get_notes' => [
            'url' => '/api/get_notes.php',
            'method' => 'GET',
            'description' => 'Get all notes for authenticated user',
            'headers' => [
                'Authorization' => 'Bearer {user_token}'
            ],
            'response' => [
                'success' => 'boolean',
                'notes' => 'object',
                'email' => 'string'
            ]
        ],
        'update_notes' => [
            'url' => '/api/update_notes.php',
            'method' => 'POST',
            'description' => 'Update notes for a specific URL',
            'headers' => [
                'Authorization' => 'Bearer {user_token}'
            ],
            'body' => [
                'url' => 'string (required)',
                'notes' => 'array (required)'
            ],
            'response' => [
                'success' => 'boolean',
                'message' => 'string'
            ]
        ]
    ],
    'status' => 'online',
    'timestamp' => date('c')
];

http_response_code(200);
echo json_encode($apiDocs, JSON_PRETTY_PRINT);

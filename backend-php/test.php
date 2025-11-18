<?php
/**
 * Simple test file to check if PHP is working
 * Access this at: https://pay.agent0s.dev/test.php
 */

// Enable error display for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Test array
$test = [
    'status' => 'success',
    'message' => 'PHP is working!',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'current_time' => date('Y-m-d H:i:s'),
    'extensions' => [
        'curl' => extension_loaded('curl'),
        'json' => extension_loaded('json'),
        'fileinfo' => extension_loaded('fileinfo')
    ],
    'paths' => [
        'current_dir' => __DIR__,
        'data_dir_exists' => file_exists(__DIR__ . '/data'),
        'notes_dir_exists' => file_exists(__DIR__ . '/data/notes')
    ]
];

// Output JSON
echo json_encode($test, JSON_PRETTY_PRINT);

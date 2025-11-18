<?php
/**
 * Simple Index - Use this if index.php causes errors
 */

// Enable error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

echo json_encode([
    'status' => 'online',
    'message' => 'Sticky Notes API is running',
    'php_version' => phpversion(),
    'timestamp' => date('c')
], JSON_PRETTY_PRINT);

<?php
/**
 * Setup Script for Sticky Notes Backend
 * Run this file once to set up the backend environment
 */

// Prevent running in production
if ($_SERVER['SERVER_NAME'] === 'pay.agent0s.dev' && file_exists(__DIR__ . '/data/users.json')) {
    die('Setup already completed. Delete this file for security.');
}

echo "<h1>Sticky Notes Backend Setup</h1>";

$errors = [];
$warnings = [];
$success = [];

// Check PHP version
echo "<h2>1. Checking PHP Version...</h2>";
$phpVersion = phpversion();
echo "PHP Version: <strong>$phpVersion</strong><br>";
if (version_compare($phpVersion, '7.4.0', '>=')) {
    $success[] = "PHP version is compatible (7.4+)";
} else {
    $errors[] = "PHP version must be 7.4 or higher. Current: $phpVersion";
}

// Check required extensions
echo "<h2>2. Checking Required PHP Extensions...</h2>";
$requiredExtensions = ['curl', 'json', 'fileinfo'];
foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        echo "✓ $ext extension: <strong>Loaded</strong><br>";
        $success[] = "$ext extension is loaded";
    } else {
        echo "✗ $ext extension: <strong>NOT LOADED</strong><br>";
        $errors[] = "$ext extension is required but not loaded";
    }
}

// Create data directories
echo "<h2>3. Creating Data Directories...</h2>";
$dataDir = __DIR__ . '/data';
$notesDir = $dataDir . '/notes';

if (!file_exists($dataDir)) {
    if (mkdir($dataDir, 0755, true)) {
        echo "✓ Created directory: <strong>data/</strong><br>";
        $success[] = "Created data directory";
    } else {
        echo "✗ Failed to create directory: <strong>data/</strong><br>";
        $errors[] = "Could not create data directory";
    }
} else {
    echo "✓ Directory already exists: <strong>data/</strong><br>";
}

if (!file_exists($notesDir)) {
    if (mkdir($notesDir, 0755, true)) {
        echo "✓ Created directory: <strong>data/notes/</strong><br>";
        $success[] = "Created notes directory";
    } else {
        echo "✗ Failed to create directory: <strong>data/notes/</strong><br>";
        $errors[] = "Could not create notes directory";
    }
} else {
    echo "✓ Directory already exists: <strong>data/notes/</strong><br>";
}

// Check directory permissions
echo "<h2>4. Checking Directory Permissions...</h2>";
if (is_writable($dataDir)) {
    echo "✓ data/ directory is <strong>writable</strong><br>";
    $success[] = "Data directory has write permissions";
} else {
    echo "✗ data/ directory is <strong>NOT writable</strong><br>";
    $errors[] = "Data directory needs write permissions (chmod 755 or 775)";
}

if (is_writable($notesDir)) {
    echo "✓ data/notes/ directory is <strong>writable</strong><br>";
    $success[] = "Notes directory has write permissions";
} else {
    echo "✗ data/notes/ directory is <strong>NOT writable</strong><br>";
    $errors[] = "Notes directory needs write permissions (chmod 755 or 775)";
}

// Check .htaccess
echo "<h2>5. Checking .htaccess File...</h2>";
if (file_exists(__DIR__ . '/.htaccess')) {
    echo "✓ .htaccess file <strong>exists</strong><br>";
    $success[] = ".htaccess file is present";
    
    $htaccess = file_get_contents(__DIR__ . '/.htaccess');
    if (strpos($htaccess, 'Access-Control-Allow-Origin') !== false) {
        echo "✓ CORS headers <strong>configured</strong><br>";
        $success[] = "CORS headers are configured";
    } else {
        echo "⚠ CORS headers <strong>NOT found</strong><br>";
        $warnings[] = "CORS headers may not be configured properly";
    }
} else {
    echo "✗ .htaccess file <strong>NOT found</strong><br>";
    $errors[] = ".htaccess file is missing";
}

// Check API files
echo "<h2>6. Checking API Files...</h2>";
$apiFiles = ['auth.php', 'sync.php', 'get_notes.php', 'update_notes.php', 'index.php'];
foreach ($apiFiles as $file) {
    if (file_exists(__DIR__ . '/' . $file)) {
        echo "✓ $file: <strong>Found</strong><br>";
        $success[] = "$file is present";
    } else {
        echo "✗ $file: <strong>NOT FOUND</strong><br>";
        $errors[] = "$file is missing";
    }
}

// Check SSL
echo "<h2>7. Checking SSL Certificate...</h2>";
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    echo "✓ SSL is <strong>ENABLED</strong><br>";
    $success[] = "SSL certificate is active";
} else {
    echo "⚠ SSL is <strong>NOT ENABLED</strong><br>";
    $warnings[] = "SSL certificate should be enabled for security";
}

// Test write capability
echo "<h2>8. Testing Write Capability...</h2>";
$testFile = $dataDir . '/test_write.tmp';
if (@file_put_contents($testFile, 'test')) {
    echo "✓ Write test <strong>PASSED</strong><br>";
    $success[] = "Successfully wrote test file";
    @unlink($testFile);
} else {
    echo "✗ Write test <strong>FAILED</strong><br>";
    $errors[] = "Cannot write to data directory";
}

// Summary
echo "<h2>Setup Summary</h2>";

if (count($errors) > 0) {
    echo "<div style='background: #fee; border: 1px solid #fcc; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3 style='color: #c00; margin-top: 0;'>❌ Errors Found (" . count($errors) . ")</h3>";
    echo "<ul>";
    foreach ($errors as $error) {
        echo "<li style='color: #c00;'>$error</li>";
    }
    echo "</ul>";
    echo "</div>";
}

if (count($warnings) > 0) {
    echo "<div style='background: #ffc; border: 1px solid #fc9; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3 style='color: #c60; margin-top: 0;'>⚠️ Warnings (" . count($warnings) . ")</h3>";
    echo "<ul>";
    foreach ($warnings as $warning) {
        echo "<li style='color: #c60;'>$warning</li>";
    }
    echo "</ul>";
    echo "</div>";
}

if (count($errors) === 0) {
    echo "<div style='background: #efe; border: 1px solid #cfc; padding: 15px; border-radius: 5px; margin: 10px 0;'>";
    echo "<h3 style='color: #060; margin-top: 0;'>✅ Setup Successful!</h3>";
    echo "<p>Your backend is ready to use. You can now:</p>";
    echo "<ul>";
    echo "<li>Test the API at: <a href='index.php'>index.php</a></li>";
    echo "<li>Configure your Chrome extension with this API URL</li>";
    echo "<li><strong>DELETE this setup.php file for security</strong></li>";
    echo "</ul>";
    echo "</div>";
}

echo "<hr>";
echo "<h2>Next Steps</h2>";
echo "<ol>";
echo "<li>If there are errors, fix them and refresh this page</li>";
echo "<li>Visit <a href='index.php'>index.php</a> to see API documentation</li>";
echo "<li>Configure your Chrome extension with this backend URL</li>";
echo "<li><strong style='color: red;'>DELETE this setup.php file after setup</strong></li>";
echo "</ol>";

echo "<hr>";
echo "<p><small>Setup completed at: " . date('Y-m-d H:i:s') . "</small></p>";

// CSS
echo "<style>
    body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        max-width: 800px; 
        margin: 40px auto; 
        padding: 20px;
        background: #f5f5f5;
    }
    h1 { 
        color: #333; 
        border-bottom: 3px solid #ffd165;
        padding-bottom: 10px;
    }
    h2 { 
        color: #666;
        margin-top: 30px;
        border-left: 4px solid #ffd165;
        padding-left: 10px;
    }
</style>";

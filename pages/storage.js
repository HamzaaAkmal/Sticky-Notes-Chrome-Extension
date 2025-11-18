// Storage.js - Cloud sync functionality for Sticky Notes
const API_BASE_URL = 'https://pay.agent0s.dev/api';

let userToken = null;
let autoSyncEnabled = false;
let syncInterval = null;

// DOM Elements
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const manualSyncBtn = document.getElementById('manual-sync-btn');
const autoSyncToggle = document.getElementById('auto-sync-toggle');
const deleteCloudBtn = document.getElementById('delete-cloud-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUserState();
    updateStorageStats();
    checkForChanges(); // Check if sync button should be enabled
    
    // Event Listeners
    signInBtn.addEventListener('click', handleSignIn);
    signOutBtn.addEventListener('click', handleSignOut);
    manualSyncBtn.addEventListener('click', handleManualSync);
    autoSyncToggle.addEventListener('click', toggleAutoSync);
    deleteCloudBtn.addEventListener('click', handleDeleteCloudData);
    
    // Listen for storage changes to enable sync button and update stats
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'sync') {
            // Check if any URL-based notes changed
            for (const key of Object.keys(changes)) {
                if (key.startsWith('http://') || key.startsWith('https://')) {
                    console.log('Notes changed, updating UI...');
                    checkForChanges();
                    updateStorageStats();
                    break;
                }
            }
        }
    });
});

// Load user authentication state
async function loadUserState() {
    try {
        const result = await chrome.storage.local.get(['userToken', 'userProfile', 'autoSyncEnabled']);
        
        if (result.userToken && result.userProfile) {
            userToken = result.userToken;
            autoSyncEnabled = result.autoSyncEnabled || false;
            displayUserProfile(result.userProfile);
            enableSyncControls();
            
            if (autoSyncEnabled) {
                startAutoSync();
            }
        }
    } catch (error) {
        console.error('Error loading user state:', error);
    }
}

// Handle Google Sign In
async function handleSignIn() {
    try {
        signInBtn.disabled = true;
        signInBtn.innerHTML = '<i class="fi fi-rr-spinner"></i> Signing in...';
        
        // Use Chrome Identity API to get OAuth token
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (chrome.runtime.lastError) {
                const errorMessage = chrome.runtime.lastError.message || 'Unknown error';
                console.error('Auth error:', errorMessage);
                alert(`Failed to sign in: ${errorMessage}\n\nPlease check:\n1. OAuth Client ID is correct in manifest.json\n2. Extension ID is added to OAuth redirect URIs in Google Cloud Console`);
                resetSignInButton();
                return;
            }
            
            if (token) {
                // Get user info from Google
                const userInfo = await getUserInfo(token);
                
                if (userInfo) {
                    // Authenticate with our backend
                    const authResult = await authenticateWithBackend(token, userInfo);
                    
                    if (authResult.success) {
                        userToken = authResult.userToken;
                        
                        // Save to storage
                        await chrome.storage.local.set({
                            userToken: userToken,
                            userProfile: userInfo,
                            autoSyncEnabled: false
                        });
                        
                        displayUserProfile(userInfo);
                        enableSyncControls();
                        
                        // Perform initial sync
                        await performSync();
                    } else {
                        alert(`Failed to authenticate with server.\n\nPlease check:\n1. Backend is deployed at: ${API_BASE_URL}\n2. SSL certificate is active\n3. CORS headers are configured`);
                        resetSignInButton();
                    }
                } else {
                    alert('Failed to get user information from Google.\n\nPlease ensure you have granted the required permissions.');
                    resetSignInButton();
                }
            }
        });
    } catch (error) {
        console.error('Sign in error:', error);
        const errorMsg = error.message || 'Unknown error';
        alert(`An error occurred during sign in: ${errorMsg}\n\nCheck browser console for details.`);
        resetSignInButton();
    }
}

// Get user info from Google
async function getUserInfo(token) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            console.error('Failed to get user info. Status:', response.status);
            return null;
        }
    } catch (error) {
        console.error('Error getting user info:', error.message || error);
        return null;
    }
}

// Authenticate with our backend
async function authenticateWithBackend(googleToken, userInfo) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                google_token: googleToken,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                success: true,
                userToken: data.user_token
            };
        } else {
            const errorData = await response.text();
            console.error('Backend auth failed. Status:', response.status, 'Response:', errorData);
            return { success: false, error: `Server returned ${response.status}` };
        }
    } catch (error) {
        console.error('Backend auth error:', error.message || error);
        return { success: false, error: error.message || 'Network error' };
    }
}

// Handle Sign Out
async function handleSignOut() {
    if (!confirm('Are you sure you want to sign out? Your local notes will not be deleted.')) {
        return;
    }
    
    try {
        // Stop auto-sync
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
        
        // Revoke Chrome identity token
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (token) {
                chrome.identity.removeCachedAuthToken({ token: token }, () => {
                    console.log('Token revoked');
                });
            }
        });
        
        // Clear local storage
        await chrome.storage.local.remove(['userToken', 'userProfile', 'autoSyncEnabled', 'lastSyncTime']);
        
        userToken = null;
        autoSyncEnabled = false;
        
        // Update UI
        document.querySelector('.not-logged-in').style.display = 'block';
        document.querySelector('.logged-in').style.display = 'none';
        disableSyncControls();
        updateSyncStatus('Not synced', 'Never synced');
        
    } catch (error) {
        console.error('Sign out error:', error);
        alert('An error occurred during sign out.');
    }
}

// Display user profile
function displayUserProfile(userInfo) {
    document.querySelector('.not-logged-in').style.display = 'none';
    document.querySelector('.logged-in').style.display = 'flex';
    
    document.getElementById('user-avatar').src = userInfo.picture || '../assets/pin.png';
    document.getElementById('user-name').textContent = userInfo.name;
    document.getElementById('user-email').textContent = userInfo.email;
}

// Enable sync controls
function enableSyncControls() {
    manualSyncBtn.disabled = false;
    autoSyncToggle.disabled = false;
    deleteCloudBtn.disabled = false;
}

// Disable sync controls
function disableSyncControls() {
    manualSyncBtn.disabled = true;
    autoSyncToggle.disabled = true;
    deleteCloudBtn.disabled = true;
}

// Reset sign in button
function resetSignInButton() {
    signInBtn.disabled = false;
    signInBtn.innerHTML = '<i class="fi fi-rr-sign-in-alt"></i> Sign in with Google';
}

// Handle manual sync
async function handleManualSync() {
    manualSyncBtn.disabled = true;
    manualSyncBtn.innerHTML = '<i class="fi fi-rr-spinner"></i> Syncing...';
    
    await performSync();
    
    manualSyncBtn.disabled = false;
    manualSyncBtn.innerHTML = '<i class="fi fi-rr-refresh"></i> Sync Now';
}

// Generate hash for notes to detect changes
function generateNotesHash(notes) {
    const str = JSON.stringify(notes);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
}

// Check if there are changes to enable/disable sync button
async function checkForChanges() {
    if (!userToken || !manualSyncBtn) return;
    
    try {
        const result = await chrome.storage.sync.get(null);
        const localNotes = {};
        
        for (const [key, value] of Object.entries(result)) {
            if (key.startsWith('http://') || key.startsWith('https://')) {
                localNotes[key] = value;
            }
        }
        
        const currentHash = generateNotesHash(localNotes);
        const lastSyncData = await chrome.storage.local.get(['lastSyncHash']);
        
        if (lastSyncData.lastSyncHash === currentHash) {
            manualSyncBtn.disabled = true;
            manualSyncBtn.title = 'No changes to sync';
        } else {
            manualSyncBtn.disabled = false;
            manualSyncBtn.title = 'Sync with cloud';
        }
    } catch (error) {
        console.error('Error checking for changes:', error);
    }
}

// Deduplicate notes by ID or content
function deduplicateNotes(notes) {
    if (!Array.isArray(notes)) return notes;
    
    const seen = new Map();
    const deduplicated = [];
    
    for (const note of notes) {
        if (note && note.id && note.id.trim() !== '') {
            // Has valid ID, use it for deduplication
            if (!seen.has(note.id)) {
                seen.set(note.id, true);
                deduplicated.push(note);
            } else {
                console.log('Duplicate note found with ID:', note.id);
            }
        } else if (note) {
            // No ID - use content+position as unique key
            const key = `${note.content}_${note.top}_${note.left}_${note.title}_${note.color}`;
            
            if (!seen.has(key)) {
                seen.set(key, true);
                // Generate stable ID based on content hash
                const hash = key.split('').reduce((acc, char) => {
                    return ((acc << 5) - acc) + char.charCodeAt(0);
                }, 0);
                note.id = `note_${Math.abs(hash)}_${Date.now()}`;
                deduplicated.push(note);
            } else {
                console.log('Duplicate note found by content:', key.substring(0, 50));
            }
        }
    }
    
    return deduplicated;
}

// Perform sync operation
async function performSync() {
    if (!userToken) {
        console.error('No user token available');
        return;
    }
    
    try {
        updateSyncStatus('syncing', null, true);
        
        // Get local notes from sync storage (where extension stores them)
        const result = await chrome.storage.sync.get(null);
        const localNotes = {};
        
        for (const [key, value] of Object.entries(result)) {
            if (key.startsWith('http://') || key.startsWith('https://')) {
                localNotes[key] = value;
            }
        }
        
        // Check if notes have changed since last sync
        const currentHash = generateNotesHash(localNotes);
        const lastSyncData = await chrome.storage.local.get(['lastSyncHash']);
        
        if (lastSyncData.lastSyncHash === currentHash) {
            console.log('No changes detected, skipping sync');
            updateSyncStatus('synced', null);
            if (manualSyncBtn) {
                manualSyncBtn.disabled = true;
                manualSyncBtn.title = 'No changes to sync';
            }
            return;
        }
        
        // Enable sync button if there are changes
        if (manualSyncBtn) {
            manualSyncBtn.disabled = false;
            manualSyncBtn.title = 'Sync with cloud';
        }
        
        // Upload to server
        const uploadResponse = await fetch(`${API_BASE_URL}/sync.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                action: 'upload',
                notes: localNotes
            })
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }
        
        // Download from server
        const downloadResponse = await fetch(`${API_BASE_URL}/sync.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                action: 'download'
            })
        });
        
        if (!downloadResponse.ok) {
            throw new Error('Download failed');
        }
        
        const cloudData = await downloadResponse.json();
        
        if (cloudData.success && cloudData.notes) {
            // Ensure notes is a valid object before setting
            if (typeof cloudData.notes === 'object' && cloudData.notes !== null && !Array.isArray(cloudData.notes)) {
                // Cloud data is already merged on server, just deduplicate and set it
                const deduplicatedNotes = {};
                
                for (const [url, notes] of Object.entries(cloudData.notes)) {
                    if (Array.isArray(notes)) {
                        deduplicatedNotes[url] = deduplicateNotes(notes);
                    } else {
                        deduplicatedNotes[url] = notes;
                    }
                }
                
                // Set deduplicated notes to sync storage with error handling for quotaa
                try {
                    await chrome.storage.sync.set(deduplicatedNotes);
                } catch (error) {
                    if (error.message && error.message.includes('quota')) {
                        console.error('Storage quota exceeded, setting notes one by one');
                        // Try to set notes one URL at a time
                        for (const [url, notes] of Object.entries(deduplicatedNotes)) {
                            try {
                                await chrome.storage.sync.set({ [url]: notes });
                            } catch (urlError) {
                                console.error(`Failed to sync notes for ${url}:`, urlError);
                                // If still quota exceeded, truncate the notes array
                                if (urlError.message && urlError.message.includes('quota') && Array.isArray(notes)) {
                                    const truncatedNotes = notes.slice(0, Math.floor(notes.length / 2));
                                    console.warn(`Truncating notes for ${url} from ${notes.length} to ${truncatedNotes.length}`);
                                    await chrome.storage.sync.set({ [url]: truncatedNotes });
                                }
                            }
                        }
                    } else {
                        throw error;
                    }
                }
            } else {
                console.warn('Invalid notes format received from server:', cloudData.notes);
            }
        }
        
        // Update last sync time and hash
        const now = new Date().toISOString();
        const newHash = generateNotesHash(localNotes);
        await chrome.storage.local.set({ 
            lastSyncTime: now,
            lastSyncHash: newHash
        });
        
        updateSyncStatus('synced', now);
        updateStorageStats();
        
        // Disable sync button after successful sync
        if (manualSyncBtn) {
            manualSyncBtn.disabled = true;
            manualSyncBtn.title = 'No changes to sync';
        }
        
    } catch (error) {
        console.error('Sync error:', error);
        updateSyncStatus('error', null);
        alert('Sync failed. Please try again.');
    }
}

// Toggle auto-sync
async function toggleAutoSync() {
    autoSyncEnabled = !autoSyncEnabled;
    
    await chrome.storage.local.set({ autoSyncEnabled });
    
    if (autoSyncEnabled) {
        startAutoSync();
        autoSyncToggle.innerHTML = '<i class="fi fi-rr-toggle-on"></i> <span id="auto-sync-text">Disable Auto-Sync</span>';
    } else {
        stopAutoSync();
        autoSyncToggle.innerHTML = '<i class="fi fi-rr-toggle-off"></i> <span id="auto-sync-text">Enable Auto-Sync</span>';
    }
}

// Start auto-sync (every 5 minutes)
function startAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
    }
    
    syncInterval = setInterval(() => {
        performSync();
    }, 5 * 60 * 1000); // 5 minutes
    
    autoSyncToggle.innerHTML = '<i class="fi fi-rr-toggle-on"></i> <span id="auto-sync-text">Disable Auto-Sync</span>';
}

// Stop auto-sync
function stopAutoSync() {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
}

// Update sync status UI
function updateSyncStatus(status, lastSyncTime = null, isAnimating = false) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const lastSyncEl = document.getElementById('last-sync');
    
    statusDot.className = 'status-dot';
    
    switch (status) {
        case 'synced':
            statusDot.classList.add('synced');
            statusText.textContent = 'Synced';
            break;
        case 'syncing':
            statusDot.classList.add('syncing');
            statusText.textContent = 'Syncing...';
            break;
        case 'error':
            statusDot.classList.add('error');
            statusText.textContent = 'Sync Error';
            break;
        default:
            statusText.textContent = 'Not synced';
    }
    
    if (lastSyncTime) {
        const date = new Date(lastSyncTime);
        lastSyncEl.textContent = `Last synced: ${date.toLocaleString()}`;
    } else if (!isAnimating) {
        chrome.storage.local.get(['lastSyncTime'], (result) => {
            if (result.lastSyncTime) {
                const date = new Date(result.lastSyncTime);
                lastSyncEl.textContent = `Last synced: ${date.toLocaleString()}`;
            }
        });
    }
}

// Update storage statistics
async function updateStorageStats() {
    try {
        // Get local notes from sync storage (where extension stores them)
        const result = await chrome.storage.sync.get(null);
        
        let localNotesCount = 0;
        
        for (const [key, value] of Object.entries(result)) {
            if (key.startsWith('http://') || key.startsWith('https://')) {
                if (Array.isArray(value)) {
                    localNotesCount += value.length;
                }
            }
        }
        
        document.getElementById('local-notes').textContent = localNotesCount;
        
        // Get cloud notes count
        if (userToken) {
            try {
                const response = await fetch(`${API_BASE_URL}/get_notes.php`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${userToken}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    let cloudNotesCount = 0;
                    
                    if (data.success && data.notes) {
                        for (const notes of Object.values(data.notes)) {
                            if (Array.isArray(notes)) {
                                cloudNotesCount += notes.length;
                            }
                        }
                    }
                    
                    document.getElementById('cloud-notes').textContent = cloudNotesCount;
                    
                    // Calculate total notes (local + cloud, removing duplicates)
                    document.getElementById('total-notes').textContent = Math.max(localNotesCount, cloudNotesCount);
                }
            } catch (error) {
                console.error('Error getting cloud notes:', error);
                document.getElementById('cloud-notes').textContent = '—';
                document.getElementById('total-notes').textContent = localNotesCount;
            }
        } else {
            document.getElementById('cloud-notes').textContent = '—';
            document.getElementById('total-notes').textContent = localNotesCount;
        }
        
        // Last updated from local storage (where sync metadata is stored)
        const localData = await chrome.storage.local.get(['lastSyncTime']);
        if (localData.lastSyncTime) {
            const date = new Date(localData.lastSyncTime);
            document.getElementById('last-updated').textContent = date.toLocaleString();
        } else {
            document.getElementById('last-updated').textContent = 'Never';
        }
        
    } catch (error) {
        console.error('Error updating storage stats:', error);
    }
}

// Handle delete cloud data
async function handleDeleteCloudData() {
    if (!confirm('Are you sure you want to delete all your cloud data? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('This will permanently delete all notes stored in the cloud. Your local notes will remain. Continue?')) {
        return;
    }
    
    try {
        deleteCloudBtn.disabled = true;
        deleteCloudBtn.innerHTML = '<i class="fi fi-rr-spinner"></i> Deleting...';
        
        const response = await fetch(`${API_BASE_URL}/sync.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({
                action: 'delete_all'
            })
        });
        
        if (response.ok) {
            alert('Cloud data deleted successfully.');
            updateStorageStats();
        } else {
            alert('Failed to delete cloud data.');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('An error occurred while deleting cloud data.');
    } finally {
        deleteCloudBtn.disabled = false;
        deleteCloudBtn.innerHTML = '<i class="fi fi-rr-trash"></i> Delete All Cloud Data';
    }
}

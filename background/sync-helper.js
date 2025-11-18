// sync-helper.js
// Shared sync functionality for automatic cloud synchronization

const SYNC_CONFIG = {
    API_BASE_URL: 'https://pay.agent0s.dev/api',
    AUTO_SYNC_DELAY: 2000, // Wait 2 seconds after changes before syncing
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
};

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

class SyncHelper {
    constructor() {
        this.syncTimeout = null;
        this.isSyncing = false;
        this.userToken = null;
        this.autoSyncEnabled = false;
    }

    /**
     * Initialize sync helper
     */
    async init() {
        const result = await chrome.storage.local.get(['userToken', 'autoSyncEnabled']);
        this.userToken = result.userToken || null;
        this.autoSyncEnabled = result.autoSyncEnabled || false;
        
        // Listen for storage changes to update token and auto-sync state
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.userToken) {
                    this.userToken = changes.userToken.newValue;
                }
                if (changes.autoSyncEnabled) {
                    this.autoSyncEnabled = changes.autoSyncEnabled.newValue;
                }
            }
        });
    }

    /**
     * Check if sync is enabled and user is authenticated
     */
    canSync() {
        return this.autoSyncEnabled && this.userToken !== null;
    }

    /**
     * Schedule a sync operation (debounced)
     */
    scheduleSync(url = null, notes = null) {
        // Only check if user is authenticated, not if auto-sync toggle is on
        // This allows CRUD operations to sync even if user hasn't enabled the toggle
        if (!this.userToken) {
            console.log('Not authenticated, skipping scheduled sync');
            return;
        }

        console.log('Scheduling sync for:', url || 'all notes');

        // Clear existing timeout
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        // Schedule new sync
        this.syncTimeout = setTimeout(() => {
            console.log('Executing scheduled sync...');
            if (url && notes) {
                this.syncSpecificUrl(url, notes);
            } else {
                this.syncAll();
            }
        }, SYNC_CONFIG.AUTO_SYNC_DELAY);
    }

    /**
     * Sync specific URL's notes
     */
    async syncSpecificUrl(url, notes) {
        if (this.isSyncing || !this.userToken) {
            console.log('Already syncing or not authenticated');
            return;
        }

        this.isSyncing = true;
        console.log('Syncing notes for URL:', url);

        try {
            const response = await this.fetchWithRetry(
                `${SYNC_CONFIG.API_BASE_URL}/update_notes.php`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.userToken}`
                    },
                    body: JSON.stringify({
                        url: url,
                        notes: notes
                    })
                }
            );

            if (response.success) {
                console.log('Notes synced successfully for:', url);
                this.updateSyncStatus('synced');
            } else {
                console.error('Sync failed:', response.error);
                this.updateSyncStatus('error');
            }
        } catch (error) {
            console.error('Error syncing notes:', error);
            this.updateSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Sync all notes
     */
    async syncAll() {
        if (this.isSyncing || !this.userToken) {
            console.log('Already syncing or not authenticated');
            return;
        }

        this.isSyncing = true;
        console.log('Syncing all notes...');

        try {
            // Get all local notes from sync storage (where extension stores them)
            const result = await chrome.storage.sync.get(null);
            const localNotes = {};

            for (const [key, value] of Object.entries(result)) {
                if (key.startsWith('http://') || key.startsWith('https://')) {
                    localNotes[key] = value;
                }
            }
            
            console.log('Found notes to sync:', Object.keys(localNotes).length, 'URLs');

            // Upload to server
            const uploadResponse = await this.fetchWithRetry(
                `${SYNC_CONFIG.API_BASE_URL}/sync.php`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.userToken}`
                    },
                    body: JSON.stringify({
                        action: 'upload',
                        notes: localNotes
                    })
                }
            );

            if (uploadResponse.success) {
                console.log('All notes synced successfully to server');
                this.updateSyncStatus('synced');
                
                // Update last sync time and hash
                const newHash = generateNotesHash(localNotes);
                const syncData = { 
                    lastSyncTime: new Date().toISOString(),
                    lastSyncHash: newHash
                };
                await chrome.storage.local.set(syncData);
            } else {
                console.error('Sync failed:', uploadResponse.error);
                this.updateSyncStatus('error');
            }
        } catch (error) {
            console.error('Error syncing all notes:', error);
            this.updateSyncStatus('error');
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Fetch with retry logic
     */
    async fetchWithRetry(url, options, attempts = SYNC_CONFIG.RETRY_ATTEMPTS) {
        for (let i = 0; i < attempts; i++) {
            try {
                const response = await fetch(url, options);
                return await response.json();
            } catch (error) {
                if (i === attempts - 1) {
                    throw error;
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.RETRY_DELAY));
            }
        }
    }

    /**
     * Update sync status in storage (for UI to reflect)
     */
    async updateSyncStatus(status) {
        try {
            await chrome.storage.local.set({ syncStatus: status });
        } catch (error) {
            console.error('Error updating sync status:', error);
        }
    }

    /**
     * Manually trigger a full sync
     */
    async manualSync() {
        return await this.syncAll();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncHelper;
}

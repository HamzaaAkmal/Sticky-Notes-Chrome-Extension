# Sticky Notes Chrome Extension

A simple yet powerful Chrome extension that allows you to add sticky notes to any website. Your notes are synced across your devices and will be waiting for you whenever you return to the page.

## ✨ Features

-   **Create Notes Anywhere:** Add sticky notes to any webpage you visit.
-   **Automatic Saving:** Notes are automatically saved as you type.
-   **Synced & Persistent Notes:** Your notes are synced across all your Chrome browsers and saved for each specific URL. They'll reappear when you revisit the page.
-   **☁️ Cloud Storage:** Sign in with Google to sync your notes across all devices and browsers.
-   **🔄 Auto-Sync:** Automatically syncs notes to the cloud when changes are made.
-   **Draggable Interface:** Easily move your notes around the page to your preferred position.
-   **Multiple Ways to Create:**
    -   **Keyboard Shortcut:** Press `Ctrl + Q` (or `⌘ + Q` on macOS) to quickly create a new note.
    -   **Context Menu:** Right-click anywhere on a page and select "Create Sticky Note".
-   **Centralized View:** Click the extension icon in your toolbar to see a list of all your notes, grouped by website.
-   **Dashboard:** Beautiful dashboard to view and manage all your notes in one place.

## 📋 Installation & Local Development

To build and run this extension locally, follow these steps:

1.  **Download or Clone:** Download this project's source code to your local machine.
2.  **Open Chrome Extensions:** Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** In the top-right corner, toggle the "Developer mode" switch on.
4.  **Load the Extension:**
    -   Click the "Load unpacked" button that appears.
    -   Navigate to the directory where you downloaded the project and select it.
5.  **Pin the Extension:** The Sticky Notes icon will appear in your extensions list. It's recommended to click the puzzle piece icon in the toolbar and "pin" the extension for easy access.

## 🚀 How to Use

1.  **Pin the Extension:** After installation, click the puzzle icon in your Chrome toolbar and pin the "Sticky Notes" extension. This will make the icon always visible.

2.  **Creating a Note:**
    -   **Method 1 (Shortcut):** Navigate to any webpage and press `Ctrl + Q` (or `⌘ + Q` on macOS). A new sticky note will appear.
    -   **Method 2 (Right-Click):** Right-click on the page and choose `Create Sticky Note` from the context menu.

3.  **Editing a Note:**
    -   Simply click inside a sticky note and start typing. Your changes are saved automatically.

4.  **Moving a Note:**
    -   Click and drag the yellow header of the sticky note to move it around the page.

5.  **Deleting a Note:**
    -   Hover over a note and click the trash can icon in the top-right corner of the note's header.

6.  **Viewing All Notes:**
    -   Click the Sticky Notes icon in your browser's toolbar to open the popup.
    -   Here, you'll see all your saved notes, neatly organized by website. You can click "Go to Note" to open the specific page where the note was created or delete it directly from the popup.

7.  **Cloud Storage (New!):**
    -   Click the Sticky Notes icon and go to **Dashboard**
    -   Click on **Cloud Storage** in the sidebar
    -   Sign in with your Google account
    -   Your notes will automatically sync across all your devices
    -   Enable **Auto-Sync** for automatic syncing when notes change

## ☁️ Cloud Storage Setup

For detailed instructions on setting up cloud storage with your own backend server, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

**Quick Overview:**
1. Set up Google OAuth credentials
2. Deploy PHP backend to your server (cPanel)
3. Update extension with your API URL
4. Sign in and start syncing!

## 🏗️ Project Structure

```
stickynotes/
├── manifest.json              # Extension configuration
├── README.md                  # This file
├── DEPLOYMENT_GUIDE.md        # Complete setup guide for cloud storage
├── assets/                    # Icons and images
├── background/
│   ├── background.js         # Service worker
│   └── sync-helper.js        # Cloud sync functionality
├── content/
│   ├── content.js            # Main content script
│   └── content.css           # Styles for sticky notes
├── pages/
│   ├── dashboard.html        # Dashboard page
│   ├── dashboard.js          # Dashboard functionality
│   ├── dashboard.css         # Dashboard styles
│   ├── storage.html          # Cloud storage page
│   ├── storage.js            # Cloud storage functionality
│   ├── storage.css           # Cloud storage styles
│   └── installed.html        # Welcome page
├── popup/
│   ├── popup.html            # Extension popup
│   ├── popup.js              # Popup functionality
│   └── popup.css             # Popup styles
└── backend-php/              # PHP backend for cloud storage
    ├── auth.php              # Authentication endpoint
    ├── sync.php              # Sync endpoint
    ├── get_notes.php         # Get notes endpoint
    ├── update_notes.php      # Update notes endpoint
    ├── index.php             # API documentation
    ├── setup.php             # Setup script
    ├── .htaccess             # Apache configuration
    └── README.md             # Backend documentation
```

## 🔧 Technologies Used

- **Frontend:** HTML, CSS, JavaScript
- **Chrome APIs:** Storage, Identity, Scripting, Context Menus
- **Backend:** PHP 7.4+
- **Authentication:** Google OAuth 2.0
- **Storage:** JSON-based file storage
- **Icons:** Flaticon UI Icons

## 🛡️ Privacy & Security

- Notes are stored locally in your browser by default
- Cloud sync is optional and requires Google sign-in
- Data is transmitted over HTTPS
- Backend uses secure token-based authentication
- No third-party analytics or tracking

## 📝 License

This project is open source. Feel free to use and modify it for your needs.
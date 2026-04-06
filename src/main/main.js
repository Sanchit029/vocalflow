// Main process - this runs in Node.js (not the browser)
// Handles creating the window, system tray, and global hotkey

const { app, BrowserWindow, Tray, Menu, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const config = require('../../config/default.json');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 720,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'VocalFlow'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // When user clicks X, hide to tray instead of closing (if enabled in config)
  mainWindow.on('close', function (event) {
    if (config.app.minimizeToTray && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // For the tray icon, we use a simple 16x16 PNG
  // On Windows, .ico format works best but PNG also works fine
  const iconPath = path.join(__dirname, '../renderer/assets/tray-icon.png');

  // If icon file doesn't exist, create tray without custom icon
  try {
    tray = new Tray(iconPath);
  } catch (err) {
    console.log('Tray icon not found, using default');
    // Create a minimal fallback icon (1x1 transparent PNG)
    const { nativeImage } = require('electron');
    const emptyIcon = nativeImage.createEmpty();
    tray = new Tray(emptyIcon);
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show VocalFlow', click: function () { mainWindow.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: function () { isQuitting = true; app.quit(); } }
  ]);

  tray.setToolTip('VocalFlow - Voice to Text');
  tray.setContextMenu(contextMenu);

  // Click on tray icon to show/hide window
  tray.on('click', function () {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  });
}

function registerHotkey() {
  // Register global hotkey so user can toggle recording from anywhere
  const hotkey = config.app.hotkey || 'Alt+Shift+V';

  globalShortcut.register(hotkey, function () {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send('toggle-recording');
    }
  });
}

// IPC handler - renderer process asks for config through this
ipcMain.handle('get-config', function () {
  return {
    deepgram: {
      apiKey: config.deepgram.apiKey,
      model: config.deepgram.model,
      language: config.deepgram.language
    },
    groq: {
      apiKey: config.groq.apiKey,
      model: config.groq.model
    },
    app: config.app
  };
});

// App lifecycle
app.whenReady().then(function () {
  createWindow();
  createTray();
  registerHotkey();
});

app.on('before-quit', function () {
  isQuitting = true;
});

app.on('will-quit', function () {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let currentFilePath = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  // Load the app
  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            newFile();
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            openFile();
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            saveFile();
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            saveFileAs();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Side by Side',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.send('change-view', 'side-by-side');
          }
        },
        {
          label: 'Editor Only',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.send('change-view', 'editor-only');
          }
        },
        {
          label: 'Preview Only',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.send('change-view', 'preview-only');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function newFile() {
  currentFilePath = null;
  mainWindow.webContents.send('new-file');
  mainWindow.setTitle('JANK - Just Another Note Keeper - Untitled');
}

async function openFile() {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'mdown', 'mkd'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      currentFilePath = filePath;
      mainWindow.webContents.send('file-opened', { content, filePath });
      mainWindow.setTitle(`JANK - Just Another Note Keeper - ${path.basename(filePath)}`);
    } catch (error) {
      dialog.showErrorBox('Error', `Failed to open file: ${error.message}`);
    }
  }
}

async function saveFile() {
  if (currentFilePath) {
    // Save to existing file
    mainWindow.webContents.send('save-file', currentFilePath);
  } else {
    // Save as new file
    await saveFileAs();
  }
}

async function saveFileAs() {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Markdown Files', extensions: ['md'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    currentFilePath = result.filePath;
    mainWindow.webContents.send('save-file', currentFilePath);
    mainWindow.setTitle(`JANK - Just Another Note Keeper - ${path.basename(currentFilePath)}`);
  }
}

// IPC handlers
ipcMain.handle('save-file-content', (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.on('open-file-dialog', () => {
  console.log('Received open-file-dialog request');
  openFile();
});

ipcMain.on('save-as-file', () => {
  console.log('Received save-as-file request');
  saveFileAs();
});

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

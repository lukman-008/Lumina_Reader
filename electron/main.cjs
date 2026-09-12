const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const iconDist = path.join(__dirname, '../dist/icon.svg');
  const iconPublic = path.join(__dirname, '../public/icon.svg');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#020617',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: require('fs').existsSync(iconDist) ? iconDist : iconPublic,
  });

  // If built, load index.html from dist
  const distPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(distPath).catch(() => {
    // Fallback to local dev server
    mainWindow.loadURL('http://localhost:3000');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

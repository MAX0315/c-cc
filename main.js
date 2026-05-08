const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 320,
    height: 480,
    webPreferences: {
      nodeIntegration: false
    },
    autoHideMenuBar: true,
    resizable: false
  });

  mainWindow.loadFile('calculator.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
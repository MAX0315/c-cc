const { app, BrowserWindow, Notification, ipcMain } = require('electron');

let mainWindow;
let alarmTime = null;
let alarmActive = false;
let alarmTriggered = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 480,
    resizable: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMenuBarVisibility(false);
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

// IPC handlers for alarm
ipcMain.on('setAlarm', (event, time) => {
  alarmTime = time;
  alarmActive = true;
  alarmTriggered = false;
});

ipcMain.on('cancelAlarm', () => {
  alarmTime = null;
  alarmActive = false;
  alarmTriggered = false;
});

ipcMain.handle('getAlarmState', () => {
  return { alarmActive, alarmTime };
});

// Timer check every second
setInterval(() => {
  if (!mainWindow) return;

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[now.getDay()];

  mainWindow.webContents.send('timeUpdate', {
    time: `${hours}:${minutes}:${seconds}`,
    date: `${year}年${month}月${day}日 ${weekday}`
  });

  // Check alarm
  if (alarmActive && alarmTime && !alarmTriggered) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const alarmMinutes = alarmTime.hour * 60 + alarmTime.minute;

    if (currentMinutes === alarmMinutes && now.getSeconds() === 0) {
      triggerAlarm();
    }

    // Send countdown
    const remainingSeconds = calculateRemainingSeconds(now);
    mainWindow.webContents.send('countdown', {
      remainingSeconds,
      alarmTime: `${String(alarmTime.hour).padStart(2, '0')}:${String(alarmTime.minute).padStart(2, '0')}`
    });
  }
}, 1000);

function calculateRemainingSeconds(now) {
  if (!alarmActive || !alarmTime) return 0;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const alarmMinutes = alarmTime.hour * 60 + alarmTime.minute;

  let remainingSeconds = (alarmMinutes - currentMinutes) * 60 - currentSeconds;

  if (remainingSeconds < 0) {
    remainingSeconds += 24 * 60 * 60;
  }

  return remainingSeconds;
}

function triggerAlarm() {
  alarmTriggered = true;
  alarmActive = false;

  if (Notification.isSupported()) {
    const notification = new Notification({
      title: '闹钟响了！',
      body: `现在是 ${String(alarmTime.hour).padStart(2, '0')}:${String(alarmTime.minute).padStart(2, '0')}`,
      silent: false
    });

    notification.show();

    notification.on('click', () => {
      mainWindow.focus();
    });
  }

  mainWindow.webContents.send('alarmTriggered');
  alarmTime = null;
}
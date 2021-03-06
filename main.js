const fs = require('fs');
const csv = require('csv');
const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow = null;

app.on('ready', () => {
    // mainWindowを作成（windowの大きさや、Kioskモードにするかどうかなどもここで定義できる）
    mainWindow = new BrowserWindow(
        {
            webPreferences: {
            nodeIntegration: true
            },
            width: 1280, 
            height: 720
        }
    );
    // Electronに表示するhtmlを絶対パスで指定（相対パスだと動かない）
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    
    // ChromiumのDevツールを開く
    mainWindow.webContents.openDevTools();

    
    //fs.createReadStream('202102.csv', {encoding: 'utf-8'}).pipe(parser);
    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});

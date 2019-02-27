const puppeteer = require('puppeteer');
const Xvfb = require('xvfb');
const ffmpegExecutor = require('./ffmpegExecutor.js');
const express = require('express');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const serveIndex = require('serve-index');

const app = express();
const port = 3000;
var xvfb = new Xvfb({ silent: false });

var width = 1280;
var height = 720;
var options = {
  headless: false,
  devtools: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=puppetcam',
    '--load-extension=' + __dirname,
    '--disable-extensions-except=' + __dirname,
    '--disable-infobars',
    `--window-size=${width},${height}`,
    `--no-sandbox`
  ],
}


app.get('/process', async (req, res, next) => {
  const url =  req.query.url;
  if (!url) {
    const error = new Error('missing url');
    error.httpStatusCode = 400;
    return next(error)
  }
  const time = req.query.time || 8000;
  try {
    const videoName = await main(url, time);
    res.redirect(`video/${videoName}`);
  } catch (e) {
    //this will eventually be handled by your error handling middleware
    next(e)
  }
});

app.use('/videos', serveIndex(__dirname + '/videos'));
app.get('/video/:name', function (req, res) {
  const videoName = req.params.name;
  const path = `videos/${videoName}.mp4`;
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1]
    ? parseInt(parts[1], 10)
    : fileSize - 1
    const chunksize = (end - start) + 1
    const file = fs.createReadStream(path, { start, end })
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

async function main(url, time) {
  xvfb.startSync();

  const fileName = uuidv4();
  const exportName = `${fileName}.webm`;
  
  const browser = await puppeteer.launch(options)
  const pages = await browser.pages()
  const page = pages[0]
  //This does not work
  // await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: './' });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page._client.send('Emulation.clearDeviceMetricsOverride')
  await page.goto(url, {waitUntil: 'networkidle2'})
  await page.setBypassCSP(true)
  
  
  // Perform any actions that have to be captured in the exported video
  await page.waitFor(time)
  
  await page.evaluate(filename=>{
    window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*');
    window.postMessage({type: 'REC_STOP'}, '*');
  }, exportName)
  
  // Wait for download of webm to complete
  await page.waitForSelector('html.downloadComplete', {timeout: 0})
  await browser.close()
  

  var path = '/Users/primoz/Downloads';
  // var path = '/root/Downloads';
  
  await ffmpegExecutor.process({ inputVideo: `${path}/${exportName}`, outputVideo: `./videos/${fileName}.mp4`})
  xvfb.stopSync()
  return fileName;
}
const puppeteer = require('puppeteer');
const ffmpegExecutor = require('./ffmpegExecutor.js');
const uuidv4 = require('uuid/v4');
const Xvfb = require('xvfb');

const xvfb = new Xvfb({silent: false});
const chromeExtensionPath = `${__dirname}/chrome-extension`;
const chromeDownloadPath = `${process.env.HOME}/Downloads`;

const options = {
  headless: false,
  devtools: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=puppetcam',
    '--load-extension=' + chromeExtensionPath,
    '--disable-extensions-except=' + chromeExtensionPath,
    '--disable-infobars',
    `--window-size=${1920},${1080}`,
    `--no-sandbox`,
  ],
};

async function record(url, time) {
  xvfb.startSync();

  const fileName = uuidv4();
  const exportName = `${fileName}.webm`;

  const browser = await puppeteer.launch(options);
  const pages = await browser.pages();
  const page = pages[0];
  //This does not work
  // await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: './' });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page._client.send('Emulation.clearDeviceMetricsOverride');
  await page.goto(url, {waitUntil: 'networkidle2'});
  await page.setBypassCSP(true);

  // Perform any actions that have to be captured in the exported video
  await page.waitFor(parseInt(time, 10));
  console.log("Waited for - ");
  console.log(parseInt(time, 10));

  await page.evaluate(filename => {
    window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*');
    window.postMessage({type: 'REC_STOP'}, '*');
  }, exportName);

  // Wait for download of webm to complete
  await page.waitForSelector('html.downloadComplete', {timeout: 0});
  await browser.close();

  await ffmpegExecutor.process({
    inputVideo: `${chromeDownloadPath}/${exportName}`,
    outputVideo: `./videos/${fileName}.mp4`,
  });
  xvfb.stopSync();

  //this should return video path, because /videos/ is first defined here. Or path should be parameter to this function
  return fileName;
}

module.exports = {
  record: record,
};

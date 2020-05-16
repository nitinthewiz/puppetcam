const fs = require('fs');
const puppeteer = require('puppeteer');
const Xvfb = require('xvfb');

var width = 1920;
var height = 1080;

var xvfb = new Xvfb({
  silent: true,
  xvfb_args: [
    '-ac',
    '-nolisten', 'tcp',
    '-screen', '0', `${width}x${height}x24`,
  ],
});

var options = {
  headless: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--whitelisted-extension-id=gbjeleomdpcpilffmhipafohhegdcjdj',
    '--load-extension=' + __dirname + '/recorder-extension',
    '--disable-extensions-except=' + __dirname + '/recorder-extension',
    '--start-fullscreen',
    '--disable-infobars',
    `--window-size=${width},${height}`,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-gpu',
    '--no-default-browser-check',
  ],
  ignoreHTTPSErrors: true,
  dumpio: false, /* change to true for chrome debugging */
}

async function main() {
    var url = process.argv[2]
    var exportname = process.argv[3]
    var length = process.argv[4] ? parseInt(process.argv[4]) : 5000

    console.log('Launching browser')
    xvfb.startSync()
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]

    const video_data = await new Promise(async (resolve) => {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto(url, {waitUntil: 'networkidle2'})

      await page.exposeFunction('onMessageReceivedEvent', e => {
        if (!e.data.messageFromContentScript1234) {
          return;
        }

        if (e.data.startedRecording == true) {
          console.log('Recording started, it will take', length/1000, 'seconds')
          page.evaluate(time_ms => {
            setTimeout(() => window.recorder.stopRecording(), time_ms);
          }, length);
        }

        if (e.data.stoppedRecording == true) {
          console.log('Recording finished')
          resolve(e.data.file)
        }
      });

      await page.evaluate(type => {
        window.addEventListener(type, e => {
          window.onMessageReceivedEvent({type, data: e.data});
        });
      }, "message");

      console.log('Starting recording...')
      await page.evaluate(() => {
          window.recorder = new RecordRTC_Extension();
          window.recorder.startRecording({enableTabCaptureAPI: true});
      });
    })

    console.log('Closing browser')
    await browser.close()
    xvfb.stopSync()

    fs.writeFile(
      `${process.env.HOME}/Downloads/${exportname}`,
      video_data.replace(/^data:(.*?);base64,/, "").replace(/ /g, '+'),
      'base64',
      err => { if (err) console.log(err);},
    );
}

main()

const fs = require('fs');
const puppeteer = require('puppeteer-core');
const Xvfb = require('xvfb');

var xvfb = null;

async function main() {
    var url = process.argv[2]
    var exportname = process.argv[3]
    var length = process.argv[4] ? parseInt(process.argv[4]) : 5000
    var width = process.argv[5] ? parseInt(process.argv[5]) : 1920
    var height = process.argv[6] ? parseInt(process.argv[6]) : 1080
    var width_screen = width + 1
    var height_screen = height + 1 + 44

    console.log('url: ' + url)
    console.log('exportName: ' + exportname)
    console.log('length: ' + length + ' ms')
    console.log('screen resolution: ' + width_screen + 'x' + height_screen)
    console.log('video resolution: ' + width + 'x' + height)

    xvfb = new Xvfb({
      silent: true,
      xvfb_args: [
        '-ac',
        '-nolisten', 'tcp',
        '-screen', '0', `${width_screen}x${height_screen}x24`,
      ],
    });

    var options = {
      executablePath: '/usr/bin/google-chrome',
      headless: false,
      args: [
        '--enable-usermedia-screen-capturing',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies',
        '--allow-http-screen-capture',
        '--whitelisted-extension-id=gbjeleomdpcpilffmhipafohhegdcjdj',
        '--load-extension=' + __dirname + '/recorder-extension',
        '--disable-extensions-except=' + __dirname + '/recorder-extension',
        '--start-fullscreen',
        '--disable-infobars',
        `--window-size=${width_screen},${height_screen}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--no-default-browser-check',
      ],
      ignoreDefaultArgs: [
        '--mute-audio',
      ],
      ignoreHTTPSErrors: true,
      dumpio: false, /* change to true for chrome debugging */
    }

    console.log('Launching browser')
    xvfb.startSync()
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    let command_start
    let record_start

    const video_data = await new Promise(async (resolve) => {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto(url, {waitUntil: 'networkidle2'})

      await page.exposeFunction('onMessageReceivedEvent', e => {
        if (!e.data.messageFromContentScript1234) {
          return;
        }

        if (e.data.startedRecording == true) {
          console.log('Recording started in', Date.now() - command_start,'ms, it will take', length/1000, 'seconds')
          record_start = Date.now()
        }

        if (e.data.stoppedRecording == true) {
          console.log('Recording finished, it took', Date.now() - record_start, 'ms')
          resolve(e.data.file)
        }
      });

      await page.evaluate(type => {
        window.addEventListener(type, e => {
          window.onMessageReceivedEvent({type, data: e.data});
        });
      }, "message");

      await page.evaluate(() => {
        window.recorder = new RecordRTC_Extension();
      });

      command_start = Date.now();
      console.log("Waiting for start signal from page...")
      await page.waitForFunction('window.triggerRenderer == true', { timeout: 120000 })
      console.log('Preloading took', Date.now() - command_start, 'ms')

      command_start = Date.now();
      console.log('Starting recording...')
      await page.evaluate((width, height) => {
          window.recorder.startRecording({
            enableTabCaptureAPI: true,
            fixVideoSeekingIssues: true,
            width: width,
            height: height,
          });
      }, width, height);

      console.log("Waiting for stop signal from page...")
      await page.waitForFunction('window.triggerRenderer == false', { timeout: length + 5000 })
      console.log('Got stop signal after', Date.now() - record_start, 'ms')

      await page.evaluate(() => {
        window.recorder.stopRecording();
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

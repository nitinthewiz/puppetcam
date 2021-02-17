const puppeteer = require('puppeteer-core');
const Xvfb = require('xvfb');

const argv = require('yargs')
  .command('$0 <url>', 'Record a video from a given url and save it to the Downloads folder', (yargs) => yargs
    .positional('url', { describe: 'URL to record the video from', type: 'string' })
    .option('o', { alias: 'output', demandOption: false, default: 'video.mp4', describe: 'Output filename', type: 'string' })
    .option('l', { alias: 'length', demandOption: false, default: 5000, describe: 'Video length in milliseconds', type: 'number' })
    .option('w', { alias: 'width', demandOption: false, default: 1920, describe: 'Video width', type: 'number' })
    .option('h', { alias: 'height', demandOption: false, default: 1080, describe: 'Video height', type: 'number' })
    .option('t', { alias: 'trigger', demandOption: false, default: false, describe: 'Use trigger from website', type: 'boolean' })
    .option('s', { alias: 'start-timeout', demandOption: false, default: 120000, describe: 'Start trigger timeout', type: 'number' })
    .option('e', { alias: 'end-timeout', demandOption: false, default: 5000, describe: 'End trigger timeout', type: 'number' })
  ).argv;

var xvfb = null;

async function main() {
    const width_screen = argv.width + 1
    const height_screen = argv.height + 1 + 44

    console.error('url: ' + argv.url)
    console.error('filename: ' + argv.output)
    console.error('length: ' + argv.length + ' ms')
    console.error('screen resolution: ' + width_screen + 'x' + height_screen)
    console.error('video resolution: ' + argv.width + 'x' + argv.height)

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
        '--hide-scrollbars',
      ],
      ignoreDefaultArgs: [
        '--mute-audio',
      ],
      ignoreHTTPSErrors: true,
      dumpio: false, /* change to true for chrome debugging */
    }

    console.error('Launching browser')
    xvfb.startSync()
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    let command_start
    let record_start

    const video_data = await new Promise(async (resolve, reject) => {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto(argv.url, {waitUntil: 'networkidle2'})

      await page.exposeFunction('onMessageReceivedEvent', e => {
        if (!e.data.messageFromContentScript1234) {
          return;
        }

        if (e.data.startedRecording == true) {
          console.error('Recording started in', Date.now() - command_start, 'ms, it will take', argv.length, 'ms')
          record_start = Date.now()
          if (!argv.trigger) {
            page.evaluate(time_ms => {
              setTimeout(() => window.recorder.stopRecording(), time_ms);
            }, argv.length + 100);
          }
        }

        if (e.data.stoppedRecording == true) {
          console.error('Recording finished, it took', Date.now() - record_start, 'ms')
          resolve({
            path: e.data.downloadPath,
            size: e.data.downloadSize,
          })
        }

        if (e.data.failedRecording == true) {
          console.error('Recording failed after', Date.now() - record_start, 'ms')
          reject()
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

      if (argv.trigger) {
        command_start = Date.now();
        console.error("Waiting for start signal from page...")
        await page.waitForFunction('window.triggerRenderer == true', { timeout: argv.startTimeout })
        console.error('Preloading took', Date.now() - command_start, 'ms')
      }

      command_start = Date.now();
      console.error('Starting recording...')
      await page.evaluate((width, height, filename) => {
          window.recorder.startRecording({
            enableTabCaptureAPI: true,
            fixVideoSeekingIssues: true,
            width: width,
            height: height,
            sendBlobInMessage: false,
            saveFileAsDownload: true,
            saveFileName: filename,
            videoCodec: "H264",
          });
      }, argv.width, argv.height, argv.output);

      if (argv.trigger) {
        console.error("Waiting for stop signal from page...")
        try {
          await page.waitForFunction('window.triggerRenderer == false', { timeout: argv.length + argv.endTimeout })
          console.error('Got stop signal after', Date.now() - record_start, 'ms')
        } catch (e) {
          console.error('Stop signal timed out after', Date.now() - record_start, 'ms')
        }

        await page.evaluate(() => {
          window.recorder.stopRecording();
        });
      }
    })

    console.log(JSON.stringify(video_data))
    const fileSize = video_data.size/1024/1024;
    console.error('File saved to', video_data.path, '(size:', fileSize.toFixed(2), 'MB)')

    console.error('Closing browser')
    await browser.close()
    xvfb.stopSync()
}

main()

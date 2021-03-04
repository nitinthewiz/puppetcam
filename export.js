const fs = require('fs');
const puppeteer = require('puppeteer-core');
const Xvfb = require('xvfb');

const path = require('path');
const child_process = require('child_process');
const ffmpeg = require('ffmpeg-static');

var xvfb = null;
var ffvideo;

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
      displayNum: 101,
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
        '--start-maximized',
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

    console.log('Launching browser')
    xvfb.startSync()
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    let record_start

    const video_data = await new Promise(async (resolve) => {
      await page._client.send('Emulation.clearDeviceMetricsOverride')
      await page.goto(url, {waitUntil: 'networkidle2'})

      await page.exposeFunction('onMessageReceivedEvent', e => {
        if (!e.data.messageFromContentScript1234) {
          return;
        }

        if (e.data.startedRecording == true) {
          console.log('Recording started, it will take', length/1000, 'seconds')
          record_start = Date.now()
          page.evaluate(time_ms => {
            setTimeout(async function() {
              window.recorder.stopRecording();
              // ffVideo.stdin.pause();
              // ffVideo.kill();
            }, time_ms);
          }, length + 100);
        }

        if (e.data.stoppedRecording == true) {
          ffVideo.kill();
          console.log('Recording finished, it took', Date.now() - record_start, 'ms')
          resolve(e.data.file)
        }
      });

      await page.evaluate(type => {
        window.addEventListener(type, e => {
          window.onMessageReceivedEvent({type, data: e.data});
        });
      }, "message");

      console.log('Starting recording...')
      console.log(ffmpeg)
      // ffVideo = child_process.spawn(ffmpeg, [
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   30,
      //   '-i',
      //   ':101.0',
      //   '-c:v',
      //   'libx264',
      //   '-crf',
      //   '0',
      //   // '-preset',
      //   // 'veryslow',
      //   '-y',
      //   '/home/node/Downloads/helloooo1.mkv',
      // ]);
      ffVideo = child_process.spawn( ffmpeg, [
        '-probesize',
        '100M',
        '-f',
        'x11grab',
        '-video_size',
        `${width_screen}x${height_screen}`,
        '-r',
        60,
        '-i',
        ':101.0',
        // '-pix_fmt',
        // 'yuv420p',
        '-y',
        '/home/node/Downloads/hello6.mpg',
      ] );
      // ffVideo = child_process.spawn( ffmpeg, [
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   30,
      //   '-i',
      //   ':101.0',
      //   '-c:v',
      //   'libx264rgb',
      //   '-crf',
      //   '0',
      //   '-y',
      //   '/home/node/Downloads/output.mkv',
      // ] );
      ffVideo.stdout.on('data', (data) => {
        console.log(`stdout:\n${data}`);
      });

      ffVideo.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      ffVideo.on('error', (error) => {
        console.error(`error: ${error.message}`);
      });

      ffVideo.on('close', (code) => {
        console.log(`child process closed with code ${code}`);
      });

      ffVideo.on('exit', (code) => {
        console.log(`child process exited with code ${code}`);
      });
      // ffVideo = child_process.spawn(ffmpeg, [
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   30,
      //   '-i',
      //   ':101.0',
      //   '-c:v',
      //   'ffvhuff',
      //   '-y',
      //   '/home/node/Downloads/helloooo.mkv',
      // ]);
      // ffVideo = child_process.spawn(ffmpeg, [
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   30,
      //   '-i',
      //   ':101.0',
      //   '-c:v',
      //   'libx265',
      //   '-crf',
      //   '0',
      //   '-tune',
      //   'film',
      //   '-y',
      //   '/home/node/Downloads/'+exportname+'.mpg',
      // ]);
      
      
      await page.evaluate((width, height) => {
          window.recorder = new RecordRTC_Extension();
          window.recorder.startRecording({
            enableTabCaptureAPI: true,
            fixVideoSeekingIssues: true,
            width: width,
            height: height,
          });
      }, width, height);
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

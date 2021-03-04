const fs = require('fs');
const puppeteer = require('puppeteer-core');
const Xvfb = require('xvfb');

const path = require('path');
const child_process = require('child_process');
const execa = require('execa');
const ffmpeg = require('ffmpeg-static');

var xvfb = null;
var ffvideo;

(async function () {
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
        '--enable-automation', // https://stackoverflow.com/questions/64138152/puppeteer-chrome-is-being-controlled-by-automated-test-software
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

    await new Promise(async () => {
      await page._client.send('Emulation.clearDeviceMetricsOverride');
      // await page.keyboard.sendCharacter('F11');
      await page.goto(url, {waitUntil: 'networkidle2'});
      await page.screenshot({path: '/home/node/Downloads/'+exportname+'.png'});

      console.log('Starting recording...');
      console.log(ffmpeg);

      ffVideo = child_process.spawn(ffmpeg, [
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
        '-codec:v',
        // 'libx264rgb',
        'libx264',
        '-threads',
        0,
        '-crf',
        0,
        // '-pix_fmt',
        // 'yuv420p',
        '-y',
        // '/home/node/Downloads/hello9.mpg',
        '/home/node/Downloads/hello25.mp4',
      ]);
      // ffVideo = execa(ffmpeg, [
      //   '-probesize',
      //   '100M',
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   60,
      //   '-i',
      //   ':101.0',
      //   '-codec:v',
      //   // 'libx264rgb',
      //   'libx264',
      //   '-threads',
      //   0,
      //   // '-b',
      //   // '100M'
      //   '-crf',
      //   0,
      //   // '-q',
      //   // 0,
      //   // '-vf',
      //   // 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      //   // '-preset',
      //   // 'ultrafast',
      //   '-y',
      //   '/home/node/Downloads/hello24.mp4',
      //   // '/home/node/Downloads/hello24.raw',
      //   // '/home/node/Downloads/hello22.mkv',
      //   // '/home/node/Downloads/'+exportname+'.mkv',
      //   // '/home/node/Downloads/'+exportname+'.mpg',
      // ]);
      // ffVideo = child_process.spawn(ffmpeg, [
      //   '-probesize',
      //   '100M',
      //   '-f',
      //   'x11grab',
      //   '-video_size',
      //   `${width_screen}x${height_screen}`,
      //   '-r',
      //   30,
      //   '-i',
      //   ':101.0',
      //   '-codec:v',
      //   'libx264rgb',
      //   '-threads',
      //   0,
      //   '-crf',
      //   0,
      //   // '-vf',
      //   // 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
      //   // '-preset',
      //   // 'ultrafast',
      //   '-y',
      //   '/home/node/Downloads/hello13.mp4',
      // ]);
      setTimeout(async () => {
        await ffVideo.stdin.pause();
        await ffVideo.kill('SIGINT');
        // ffVideo.stdin.end();
        // ffVideo.kill('SIGINT');
        // await ffVideo.cancel();
        // ffVideo.cancel('SIGINT');
        // await ffVideo.kill();
        console.log('Closing browser');
        await browser.close();
        console.log('Stopping XVFB Sync');
        xvfb.stopSync();
      }, length + 100);

      // try {
      //   await ffVideo.stdout.pipe(process.stdout);
      // } catch (error) {
      //   console.log(ffVideo.killed); // true
      //   console.log(ffVideo.isCanceled); // true
      // }

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
    });
})();

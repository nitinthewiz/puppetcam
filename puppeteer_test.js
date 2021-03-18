const puppeteer = require('puppeteer-core');

var options = {
  // executablePath: '/usr/bin/google-chrome',
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-features=PreloadMediaEngagementData,AutoplayIgnoreWebAudio,MediaEngagementBypassAutoplayPolicies',
    '--start-maximized',
    '--allow-http-screen-capture',
    '--whitelisted-extension-id=eomjhcckfpplejknaligcpjdjabdnakc',
    // '--load-extension=' + __dirname + '/recorder-extension',
    // '--disable-extensions-except=' + __dirname + '/recorder-extension',
    '--load-extension=' + __dirname + '/am-chrome-extensions/screen-recording',
    '--disable-extensions-except=' + __dirname + '/am-chrome-extensions/screen-recording',
    '--start-fullscreen',
    '--disable-infobars',
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

const browser = puppeteer.launch(options)
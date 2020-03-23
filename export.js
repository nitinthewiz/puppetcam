const puppeteer = require('puppeteer');
const Xvfb      = require('xvfb');
var xvfb        = new Xvfb({silent: true});
var width       = 1920;
var height      = 1080;
var options     = {
  headless: false,
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--auto-select-desktop-capture-source=puppetcam',
    '--load-extension=' + __dirname,
    '--disable-extensions-except=' + __dirname,
    '--disable-infobars',
    `--window-size=${width},${height}`,
  ],
}

async function main() {
    var url = process.argv[2]
    var exportname = process.argv[3]
    var length = process.argv[4] ? parseInt(process.argv[4]) : 5000 
    
    xvfb.startSync()

    console.log('Launching browser')
    const browser = await puppeteer.launch(options)
    const pages = await browser.pages()
    const page = pages[0]
    await page._client.send('Emulation.clearDeviceMetricsOverride')
    await page.goto(url, {waitUntil: 'networkidle2'})
    await page.setBypassCSP(true)

    // Perform any actions that have to be captured in the exported video
    console.log('Waiting for ' + length + 'ms')
    await page.waitFor(length)

    console.log('Sending commands')
    await page.evaluate(filename=>{
        window.postMessage({type: 'SET_EXPORT_PATH', filename: filename}, '*')
        window.postMessage({type: 'REC_STOP'}, '*')
    }, exportname)

    // Wait for download of webm to complete
    console.log('Wait for download complete')
    await page.waitForSelector('html.downloadComplete', {timeout: 0})
    console.log('Closing browser')
    await browser.close()

    xvfb.stopSync()
}

main()


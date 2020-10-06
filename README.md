# Puppetcam

Create screencast of a website

## Examples

### Record given length video from website

```sh
docker run -v "${PWD}/data:/home/node/Downloads" apicore/puppetcam https://tobiasahlin.com/spinkit/ -l 10000
```

The output will be a 10 second long full HD video saved as `./data/video.webm`.

### Record video from website using webside-side triggering

```sh
docker run -v "${PWD}/data:/home/node/Downloads" apicore/puppetcam https://site-triggered.example/ -t -l 10000
```

The recording is started when the `window.triggerRenderer` variable on the website becomes `true` and it is stopped when the same variable becomes `false` again. This option can be used to control the recording from the website itself. In this case the `--length` parameter is only used to set a sensible timeout. The output will be a full HD video saved as `./data/video.webm`.

## Command line arguments

```
export.js <url>

Record a video from a given url

Positionals:
  url  URL to record the video from                                     [string]

Options:
      --help           Show help                                       [boolean]
      --version        Show version number                             [boolean]
  -o, --output         Output path    [string] [default: ~/Downloads/video.webm]
  -l, --length         Video length in milliseconds     [number] [default: 5000]
  -w, --width          Video width                      [number] [default: 1920]
  -h, --height         Video height                     [number] [default: 1080]
  -t, --trigger        Use trigger from website       [boolean] [default: false]
  -s, --start-timeout  Start trigger timeout          [number] [default: 120000]
  -e, --end-timeout    End trigger timeout              [number] [default: 5000]
```

## Running without Docker

### Dependencies

1. xvfb
2. chrome browser
3. nodejs
4. npm modules listed in package.json
5. up-to-date git submodules

### Preparation

```sh
npm install
npm run install-extension
```

### Usage

Use the same way as the dockerized version. A few examples:

```sh
node export.js https://tobiasahlin.com/spinkit/ -l 10000 # Outputs ~/Downloads/video.webm
node export.js https://tobiasahlin.com/spinkit/ -o spinkit.webm # Outputs ./spinkit.webm
```

## Credits

* Thanks to [@muralikg](https://github.com/muralikg) for the original puppetcam idea.
* Thanks to [@muaz-khan](https://github.com/muaz-khan) for his [screen-recording](https://github.com/muaz-khan/Chrome-Extensions/tree/master/screen-recording) chrome extension.

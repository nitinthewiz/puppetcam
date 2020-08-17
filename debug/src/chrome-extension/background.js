/* global chrome, MediaRecorder, FileReader */

console.log(`Background script loading`);
let recorder = null;
let filename = null;
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(msg => {
    console.log(msg);
    switch (msg.type) {
      case 'SET_EXPORT_PATH':
        console.log(`set export path`);
        filename = msg.filename;
        break;
      case 'REC_STOP':
        console.log(`REC STOP`);
        recorder.stop();
        break;
      case 'REC_CLIENT_PLAY':
        console.log("REC_CLIENT_PLAY");
        if (recorder) {
          return;
        }
        const tab = port.sender.tab;
        tab.url = msg.data.url;
        const size = msg.data.size || {width: 1920, height: 1080};
        chrome.desktopCapture.chooseDesktopMedia(['tab', 'audio'], streamId => {
          // Get the stream
          navigator.webkitGetUserMedia(
            {
              // audio: false,
              audio: {
                mandatory: {
                  chromeMediaSource: 'system'
                }
              },
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: streamId,
                  minWidth: size.width,
                  maxWidth: size.width,
                  minHeight: size.height,
                  maxHeight: size.height,
                  minFrameRate: 60,
                },
              },
            },
            stream => {
              var chunks = [];
              recorder = new MediaRecorder(stream, {
                videoBitsPerSecond: 10000000,
                ignoreMutedMedia: true,
                mimeType: 'video/webm;codecs=vp9,opus',
              });
              recorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                  chunks.push(event.data);
                }
              };

              recorder.onstop = function() {
                var superBuffer = new Blob(chunks, {
                  type: 'video/webm',
                });

                var url = URL.createObjectURL(superBuffer);
                // var a = document.createElement('a');
                // document.body.appendChild(a);
                // a.style = 'display: none';
                // a.href = url;
                // a.download = 'test.webm';
                // a.click();

                chrome.downloads.download(
                  {
                    url: url,
                    filename: filename,
                  },
                  () => {
                    console.log(arguments);
                  },
                );
              };

              recorder.start();
            },
            error => console.log('Unable to get user media', error),
          );
        });
        break;
      default:
        console.log('Unrecognized message', msg);
    }
  });

  chrome.downloads.onChanged.addListener(function(delta) {
    if (!delta.state || delta.state.current != 'complete') {
      return;
    }
    try {
      port.postMessage({downloadComplete: true});
    } catch (e) {}
  });
});

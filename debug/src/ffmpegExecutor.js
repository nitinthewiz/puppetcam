const { spawn } = require('child_process');

module.exports = {
    process: process
};

// function process({ inputVideo, outputVideo, timeCut }) {
function process({ inputVideo, outputVideo }) {
    let ffmpegArguments = [
        // '-ss', '0', '-t', `${timeCut}`, // https://trac.ffmpeg.org/wiki/Seeking Faster seek
        '-i', `${inputVideo}`,
        '-crf', '1', // https://blog.addpipe.com/converting-webm-to-mp4-with-ffmpeg/
        `${outputVideo}`,
        '-y', //Overwrite output files without asking
    ];

    return new Promise(function (fulfill, reject) {
        const ls = spawn('ffmpeg', ffmpegArguments);

        ls.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ls.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });

        ls.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                //path where the output video is
                fulfill(outputVideo);
            } else {
                reject(code);
            }
        });
    });
}
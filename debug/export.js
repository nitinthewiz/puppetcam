const express = require('express');
const fs = require('fs');
const videoRecorder = require('./src/videoRecorder.js');
const awsCommands = require('./src/awsCommands.js');


const app = express();
const port = 3000;

app.get('/process', async (req, res, next) => {
  const {url, time = 8000} = req.query;
  if (!url) {
    const error = new Error('missing url');
    error.httpStatusCode = 400;
    return next(error);
  }
  try {
    const videoName = await videoRecorder.record(url, time);
    // const data = await awsCommands.uploadFile({filePath:`videos/${videoName}.mp4`});
    res.redirect(`stream/${videoName}`);
    // res.send(`<html><body><video controls width="1280" height="720"><source src="${data.Location}" type="video/mp4"></video></body></html>`);

    // res.json(data);
  } catch (e) {
    //this will eventually be handled by error handling middleware
    next(e);
  }
});


app.get('/saved/:name', function (req, res) {
  const videoName = req.params.name;
  const videoUrl = `https://s3-eu-west-1.amazonaws.com/url-video/${videoName}.mp4`;
  res.send(`<html><body><video controls width="1280" height="720"><source src="${videoUrl}" type="video/mp4"></video></body></html>`);
});

app.get('/stream/:name', function(req, res) {
  const videoName = req.params.name;
  const path = `videos/${videoName}.mp4`;
  const stat = fs.statSync(path);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(path, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(path).pipe(res);
  }
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

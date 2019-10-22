#How it works:
 - express to handle API requests
 - https://github.com/GoogleChrome/puppeteer with Chrome extension to record *.webm video with MediaRecorder
 - Because Chrome extension is not supported in headless mode we are using Xvfb
 - ffmpeg to convert .webm to .mp4
 - Docker to package everything together into single unit

#Dockerfile:
- Based on Ubuntu bionic

To build image use: `docker build -t rad-video-recorder:0.0.1 .`

# set aws credentials
`AWS_ACCESS_KEY_ID=$(aws --profile default configure get aws_access_key_id)`
`AWS_SECRET_ACCESS_KEY=$(aws --profile default configure get aws_secret_access_key)`
To run image use: `docker run -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY --rm -p 3000:3000 rad-video-recorder:0.0.1`

If you want to expose `export.js` to local file you can use:
`docker run -v $(pwd)/export.js:/app/export.js -p 3000:3000 rad-video-recorder:0.0.1`

#API
`/process?url=${anywebpageurl}&time=8000`
After the video is created it will redirect to /video:videoName videoName is a uuid string.

`/video:videoName`
It streams the video directly to client from `/video` folder.

`docker exec -it dd0590c8173c /bin/bash`

`docker tag rad-video-recorder:0.0.1 eu.gcr.io/rad-platform/rad-video-recorder:0.0.2`
`docker push eu.gcr.io/rad-platform/rad-video-recorder:0.0.2`
`docker exec -it <container name> /bin/bash`



To sync files outside (and enable API and to poke around inside) - 
`docker run -it -v ~/temp/puppetcam_docker:/app/videos -p 3000:3000 rad-video-recorder:0.0.1 /bin/bash`

Note that the URL should be encoded for the best result. 

So this will not work - 
`http://localhost:3000/process?time=10000&url=https://tungs.github.io/truchet-tiles-original/#autoplay=true&switchStyle=random`

But this will -
`http://localhost:3000/process?time=10000&url=https%3A%2F%2Ftungs.github.io%2Ftruchet-tiles-original%2F%23autoplay%3Dtrue%26switchStyle%3Drandom`


TODO:

process parameters
- url
- time
- size
- position?
- callback url
# Install in complete environment
FROM node:lts-buster as npm_install
COPY ./package*.json /home/node/app/
WORKDIR /home/node/app
RUN npm install

COPY ./export.js ./run.sh ./.manifest.json.key /home/node/app/
COPY ./chrome-extensions/screen-recording /home/node/app/recorder-extension
RUN tail -n +2 ./recorder-extension/manifest.json >> .manifest.json.key \
    && mv .manifest.json.key ./recorder-extension/manifest.json

# Build the image from the slim version
FROM node:lts-buster-slim
USER root

RUN apt-get update \
    && apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 \
        libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
        libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
        libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
        libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
        libxfixes3 \
        libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
        ca-certificates fonts-liberation fonts-noto-color-emoji libappindicator1 libnss3 \
        lsb-release xdg-utils wget gosu gpg curl dos2unix \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list.d/google.list \
    && apt update && apt install -y google-chrome-stable \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/node/Downloads \
    && chown -R node:node /home/node/Downloads

COPY --from=npm_install --chown=node:node /home/node/app /home/node/app

RUN dos2unix /home/node/app/run.sh
RUN chmod +x /home/node/app/run.sh

WORKDIR /home/node/app
ENTRYPOINT ["/home/node/app/run.sh"]

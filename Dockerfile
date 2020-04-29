# Install in complete environment
FROM node:lts as npm_install
COPY ./ /home/user/app
WORKDIR /home/user/app
RUN npm install

# Build the image from the slim version
FROM node:lts-slim
USER root

RUN apt-get update \
    && apt-get -y install xvfb gconf-service libasound2 libatk1.0-0 libc6 \
        libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
        libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
        libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
        libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
        libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
        ca-certificates fonts-liberation libappindicator1 libnss3 \
        lsb-release xdg-utils wget gosu \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 2000 user \
    && useradd -u 2000 -g user -G audio,video user \
    && mkdir -p /home/user/Downloads \
    && chown -R user:user /home/user/Downloads

COPY --from=npm_install --chown=user:user /home/user/app /home/user/app

WORKDIR /home/user/app
ENTRYPOINT ["/home/user/app/run.sh"]

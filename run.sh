#!/bin/bash
chown node:node /home/node/Downloads
exec gosu node:node node export.js "$@"

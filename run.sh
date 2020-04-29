#!/bin/bash
chown user:user /home/user/Downloads
exec gosu user:user node export.js "$@"

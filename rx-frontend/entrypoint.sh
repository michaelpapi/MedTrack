#!/bin/sh
# entrypoint.sh

# Replace placeholders in env-config.js.template with actual env variables
envsubst < /usr/share/nginx/html/env-config.js.template > /usr/share/nginx/html/env-config.js

# Start Nginx
nginx -g "daemon off;"

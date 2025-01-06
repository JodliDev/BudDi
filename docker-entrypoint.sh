#!/bin/sh

chown -R node:node ./dist/config

#Run command as user node:
exec su node -c "npm run run_production"

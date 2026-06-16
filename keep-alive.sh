#!/bin/bash
while true; do
  cd /home/z/my-project
  PORT=3000 node .next/standalone/server.js
  echo "Server crashed at $(date). Restarting in 2s..."
  sleep 2
done

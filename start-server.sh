#!/bin/bash
cd /home/flashey/logifast
npx next build
while true; do
  npx next start -p 3000 2>&1 | tee /home/flashey/logifast/dev.log
  echo "Server died at $(date). Restarting..." >> /home/flashey/logifast/dev.log
  sleep 3
done

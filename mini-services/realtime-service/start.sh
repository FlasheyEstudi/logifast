#!/bin/bash
# Loop-based supervisor for the LOGIFAST realtime service.
# Mirrors the pattern used by /home/z/my-project/keep-alive.sh for the Next.js
# dev server — restart the service if it ever exits.
cd /home/flashey/logifast/mini-services/realtime-service
while true; do
  bun run dev 2>&1 | tee -a /home/flashey/logifast/mini-services/realtime-service/service.log
  echo "[supervisor] realtime-service died at $(date). Restarting in 2s..." >> /home/flashey/logifast/mini-services/realtime-service/service.log
  sleep 2
done

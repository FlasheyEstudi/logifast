#!/bin/bash
# Production startup script (P0-31 fix: usa next build + next start en lugar de next dev)
cd /home/flashey/logifast

# Construir si el build no existe
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "[$(date)] Building application..."
  npx next build 2>&1 | tee /home/flashey/logifast/build.log
fi

while true; do
  npx next start -p 3000 2>&1 | tee /home/flashey/logifast/prod.log
  echo "[$(date)] Server died. Restarting in 3s..." >> /home/flashey/logifast/prod.log
  sleep 3
done

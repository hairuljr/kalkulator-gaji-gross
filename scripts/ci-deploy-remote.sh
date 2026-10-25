#!/bin/bash
# Dijalankan di VPS sebagai root lewat sudo oleh user "deploy".
# Menerima image (docker save | gzip) lewat stdin, lalu menjalankan ulang container dengan sandbox.
set -euo pipefail
NAME=kalkulator-gaji-gross
gunzip | docker load
docker rm -f "$NAME" 2>/dev/null || true
docker run -d --name "$NAME" --restart unless-stopped \
  -p 127.0.0.1:3100:3000 \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --pids-limit 256 --memory 256m \
  "$NAME:latest"
docker image prune -f

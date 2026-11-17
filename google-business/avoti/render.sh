#!/bin/sh
# Renders every page listed in list.txt to PNG with headless Edge.
cd "$(dirname "$0")"
EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
DIR="$(cygpath -m "$PWD")"
mkdir -p png
while read -r name w h; do
  [ -z "$name" ] && continue
  [ -n "$1" ] && [ "$1" != "$name" ] && continue
  "$EDGE" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --virtual-time-budget=6000 --user-data-dir="$DIR/.edge" \
    --window-size="$w,$h" --screenshot="$DIR/png/$name.png" "file:///$DIR/$name.html" >/dev/null 2>&1
  echo "$name $(ls -la "png/$name.png" 2>/dev/null | awk '{print $5}')"
done < list.txt

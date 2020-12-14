#!/bin/bash
cd "/record/$1"
dest_dir=$2
current_dir="$PWD"
echo "Current Record path: $PWD"
for f in *.mp4; do
        if [ -f "$f" ] # does file exist?
        then
                mv "$f" "$dest_dir"     # move file into new dir
		rm "-rf" "$current_dir"
        fi
done

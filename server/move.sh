#!/bin/bash
cd "/record/$1"
dest_dir=$2
current_dir="$PWD"
echo "Current Record path: $PWD"
for f in *.mp4; do
        if [ -f "$f" ] # does file exist?
        then
		today=`date +%Y_%m_%d_%H_%M_%S`
		echo "$today"
		filename="${f%.*}"
		fname="${filename}_${today}.mp4"
                mv "$f" "${dest_dir}/${fname}"     # move file into new dir
		rm "-rf" "$current_dir"
        fi
done

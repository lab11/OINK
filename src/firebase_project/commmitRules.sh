#!/usr/bin/env bash

if [ -n "$1" ]; then echo "Error. This script takes no arguments. Quitting."; exit 1; fi

# Quit script if a command fails
set -e

read -p 'Type a commit message: ' msg

# Print what we're doing from here on out
set -x

git commit firestore.rules -m "$msg"
git push
firebase deploy --only firestore:rules

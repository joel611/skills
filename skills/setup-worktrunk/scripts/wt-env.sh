#!/bin/sh
# Usage: wt-env.sh KEY=VALUE...
# Sets each key in ./.env (creating it from ./.env.example if missing). Other keys are untouched.
set -eu
[ -f .env ] || cp .env.example .env
for kv in "$@"; do
  k=${kv%%=*}
  V=${kv#*=} awk -v k="$k" '
    BEGIN { FS = OFS = "="; v = ENVIRON["V"] }
    $1 == k { print k "=" v; found = 1; next }
    { print }
    END { if (!found) print k "=" v }
  ' .env > .env.wt-tmp && mv .env.wt-tmp .env
done

#!/usr/bin/env bash
# Switch the active `gh` account to match the current repo's git remote.
#
# Usage: switch.sh [--print] [--remote NAME] [--user USER]
#   --print        only print the resolved gh user, do not switch
#   --remote NAME  remote to read (default: origin)
#   --user USER    skip detection, switch to USER
#
# Resolution (SSH remotes): the host alias in git@<alias>:owner/repo.git is
# resolved with `ssh -T git@<alias>`, which greets with the GitHub username that
# owns the key. Result is cached in ~/.cache/gh-accounts/<alias>.
#
# HTTPS remotes carry no identity. Optional owner map, one `owner=gh-user` per
# line, in ~/.config/gh-accounts/owners. Without an entry, exits 2.
#
# Exit: 0 ok, 2 cannot resolve, 3 resolved user not logged in to gh.

set -euo pipefail

remote=origin
print_only=0
user=""
while [ $# -gt 0 ]; do
  case "$1" in
    --print) print_only=1 ;;
    --remote) remote=$2; shift ;;
    --user) user=$2; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done

cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}/gh-accounts"
owners_file="${XDG_CONFIG_HOME:-$HOME/.config}/gh-accounts/owners"

if [ -z "$user" ]; then
  url=$(git remote get-url "$remote" 2>/dev/null) || { echo "gh-accounts: no '$remote' remote" >&2; exit 2; }

  case "$url" in
    git@*|ssh://git@*)
      alias=$(printf '%s' "$url" | sed -E 's#^(git@|ssh://git@)([^:/]+)[:/].*#\2#')
      cache="$cache_dir/$alias"
      if [ -s "$cache" ]; then
        user=$(cat "$cache")
      else
        greeting=$(ssh -o BatchMode=yes -o ConnectTimeout=5 -T "git@$alias" 2>&1 || true)
        user=$(printf '%s' "$greeting" | sed -nE 's/^Hi ([^!]+)!.*/\1/p' | head -1)
        if [ -z "$user" ]; then
          echo "gh-accounts: ssh -T git@$alias gave no GitHub greeting: $greeting" >&2
          exit 2
        fi
        mkdir -p "$cache_dir" && printf '%s\n' "$user" > "$cache"
      fi
      ;;
    *)
      owner=$(printf '%s' "$url" | sed -E 's#^https?://[^/]+/([^/]+)/.*#\1#')
      if [ -f "$owners_file" ]; then
        user=$(sed -nE "s/^${owner}=(.+)$/\1/p" "$owners_file" | head -1)
      fi
      if [ -z "$user" ]; then
        echo "gh-accounts: HTTPS remote ($url) has no identity; add '$owner=<gh-user>' to $owners_file or switch the remote to an SSH alias URL" >&2
        exit 2
      fi
      ;;
  esac
fi

if [ "$print_only" = 1 ]; then
  echo "$user"
  exit 0
fi

# gh auth status prints "Logged in to github.com account <user>" per account.
if ! gh auth status 2>&1 | grep -q "account $user "; then
  echo "gh-accounts: '$user' not logged in to gh; run: gh auth login" >&2
  exit 3
fi

active=$(gh api user --jq .login 2>/dev/null || true)
if [ "$active" = "$user" ]; then
  echo "gh-accounts: already $user"
else
  gh auth switch --hostname github.com --user "$user"
  echo "gh-accounts: switched to $user"
fi

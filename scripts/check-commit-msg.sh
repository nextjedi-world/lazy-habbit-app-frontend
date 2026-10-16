#!/bin/sh
# commit-msg hook: first line must be a conventional commit. Reads the message from git's own path
# so it works in worktrees and in folders whose path contains spaces.
msg_file="$(git rev-parse --git-path COMMIT_EDITMSG)"
head -n 1 "$msg_file" | grep -Eq '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9._/-]+\))?!?: .+' || {
  echo 'Commit message must be a conventional commit, for example: feat: add paywall'
  exit 1
}

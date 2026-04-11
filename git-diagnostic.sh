#!/bin/bash
cd /workspaces/virar-stationery-website

echo "=== CURRENT GIT STATUS ==="
git status

echo ""
echo "=== GIT LOG (last 10 commits, all branches) ==="
git log --oneline -10 --all --decorate

echo ""
echo "=== LOCAL vs REMOTE (origin/main) ==="
git log --oneline --graph --all --decorate -15 | head -20

echo ""
echo "=== CHECK IF LOCAL IS AHEAD/BEHIND ==="
git rev-list --left-right --count origin/main...HEAD

echo ""
echo "=== SHOW REMOTE BRANCHES ==="
git branch -r

echo ""
echo "=== COMPARE LOCAL HEAD WITH REMOTE ==="
echo "Local HEAD:"
git rev-parse HEAD
echo "Remote origin/main:"
git rev-parse origin/main

echo ""
echo "=== DIFF LOCAL vs REMOTE index.html ==="
git diff origin/main HEAD -- index.html | head -50

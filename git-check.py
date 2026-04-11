#!/usr/bin/env python3
import subprocess
import os

os.chdir('/workspaces/virar-stationery-website')

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.stdout + result.stderr
    except Exception as e:
        return f"Error: {e}"

print("=== GIT STATUS ===")
print(run_cmd("git status"))

print("\n=== LOCAL HEAD ===")
print(run_cmd("git rev-parse HEAD"))

print("\n=== REMOTE origin/main ===")
print(run_cmd("git rev-parse origin/main 2>&1"))

print("\n=== GIT LOG (last 15 commits) ===")
print(run_cmd("git log --oneline -15 --all"))

print("\n=== COMMITS AHEAD/BEHIND ===")
print(run_cmd("git rev-list --left-right --count origin/main...HEAD 2>&1"))

print("\n=== SHOW CURRENT BRANCH AND REMOTE TRACKING ===")
print(run_cmd("git branch -vv"))

print("\n=== FETCH LATEST FROM REMOTE ===")
print(run_cmd("git fetch origin"))

print("\n=== CHECK NEW STATUS AFTER FETCH ===")
print(run_cmd("git status"))

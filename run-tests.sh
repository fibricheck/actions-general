#!/bin/bash

# Check if act is installed
if ! command -v act &> /dev/null; then
  echo "Error: 'act' is not installed."
  echo "Please install it from: https://nektosact.com/installation/index.html"
  exit 1
fi

# Build the act command
ACT_CMD="act -W ./.github/workflows/on-pull-request.yml"

# Check if running on macOS with Apple Silicon (M-series chip)
if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" ]]; then
  ACT_CMD="$ACT_CMD --container-architecture linux/amd64"
fi

# Run act
echo "Running: $ACT_CMD"
$ACT_CMD

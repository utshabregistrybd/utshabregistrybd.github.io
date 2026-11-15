#!/bin/bash
# UtsabRegistry BD - Startup Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  🌸 UtsabRegistry BD (উৎসব রেজিস্ট্রি)"
echo "  Bangladesh Marriage & Event Gift Registry Web Application"
echo "=========================================================="
echo ""
echo "Starting Python web server on http://localhost:8080 ..."
echo "Press Ctrl+C to stop."
echo ""

python3 server.py

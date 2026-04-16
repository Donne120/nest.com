#!/bin/bash
# ── nest-gen: one-click course generator ─────────────────────────────────
# Usage:  ./run.sh "AI For Everyday Life"
#         ./run.sh "AI For Everyday Life" --modules 4 --lessons 3 --dry-run
set -e

TITLE="${1:-AI For Everyday Life}"
shift 2>/dev/null || true   # pass remaining args to python

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIDEO_DIR="$SCRIPT_DIR/../../video"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          nest-gen  ·  Course Generator        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. System dependencies ────────────────────────────────────────────────
if ! command -v ffmpeg &>/dev/null; then
  echo "📦 Installing ffmpeg..."
  sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg
fi

if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install it: https://nodejs.org"
  exit 1
fi

# ── 2. Python venv ────────────────────────────────────────────────────────
cd "$SCRIPT_DIR"

if [ ! -d ".venv" ]; then
  echo "🐍 Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

# ── 3. .env ───────────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "⚠️  Created .env — fill in your NVIDIA_API_KEY and NEST_TOKEN, then run again."
  exit 0
fi

# Verify NVIDIA key is set
if grep -q "nvapi-xxx" .env 2>/dev/null; then
  echo "⚠️  Please set your NVIDIA_API_KEY in .env first."
  exit 1
fi

# ── 4. Node dependencies for Remotion ────────────────────────────────────
cd "$VIDEO_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Remotion dependencies..."
  npm install --silent
fi

# ── 5. Run generator ─────────────────────────────────────────────────────
cd "$SCRIPT_DIR"
echo "🚀 Starting course generation: \"$TITLE\""
echo ""

python3 nest_gen.py "$TITLE" "$@"

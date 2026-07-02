#!/bin/bash
set -e

RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
MAGENTA='\033[1;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

MAX_ITERATIONS=${1:-10}
SPECS_NAME=${2:-}

if [ -z "$SPECS_NAME" ]; then
  echo -e "${RED}❌ Usage: $0 <max_iterations> <specs_name>${NC}" >&2
  exit 1
fi

if ! [[ "$MAX_ITERATIONS" =~ ^[1-9][0-9]*$ ]]; then
  echo -e "${RED}❌ Error: <max_iterations> must be a positive integer, got '${BOLD}$MAX_ITERATIONS${RED}'${NC}" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPECS_DIR="$SCRIPT_DIR/.kiro/specs/$SPECS_NAME"

if [ ! -d "$SPECS_DIR" ]; then
  echo -e "${RED}❌ Error: No specs named '${BOLD}$SPECS_NAME${RED}' found in this project${NC}" >&2
  exit 1
fi

if [ ! -f "$SPECS_DIR/progress.md" ]; then
  echo "# Progress Log for spec: $SPECS_NAME" > "$SPECS_DIR/progress.md"
  echo -e "${DIM}📝 Created progress.md${NC}"
fi

TIME_LOG="$SPECS_DIR/specs_time.md"
if [ ! -f "$TIME_LOG" ]; then
  echo "# Time Log for spec: $SPECS_NAME" > "$TIME_LOG"
  echo -e "${DIM}📝 Created specs_time.md${NC}"
fi

PROMPT=$(sed "s/SPECS_NAME/$SPECS_NAME/g" "$SCRIPT_DIR/ralph-loop-prompt.md")

echo ""
echo -e "${MAGENTA}══════════════════════════════════════${NC}"
echo -e " 🚀 ${BOLD}Starting Ralph${NC}"
echo -e " ${DIM}spec:${NC} ${CYAN}$SPECS_NAME${NC}"
echo -e " ${DIM}iterations:${NC} ${CYAN}$MAX_ITERATIONS${NC}"
echo -e "${MAGENTA}══════════════════════════════════════${NC}"
echo ""

read -r -p "$(echo -e "${YELLOW}🔄 Iterate automatically through tasks? (y/n):${NC} ")" AUTO_MODE
case "$AUTO_MODE" in
  [yY]|[yY][eE][sS]) AUTO_MODE=true; echo -e " ${GREEN}✔ Auto-pilot enabled${NC}" ;;
  *) AUTO_MODE=false; echo -e " ${BLUE}✔ Manual mode — you'll confirm each iteration${NC}" ;;
esac

echo ""
echo -e "${CYAN}─── 📋 Prompt ───────────────────────────${NC}"
echo "$PROMPT"
echo -e "${CYAN}──────────────────────────────────────────${NC}"
echo ""
read -r -p "$(echo -e "${YELLOW}👀 Review the prompt above. Press Enter to launch the Ralph loop...${NC} ")"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e " 🔁 ${BOLD}Iteration ${CYAN}$i${NC}${BOLD} / ${DIM}$MAX_ITERATIONS${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"

  if [ "${ENGINE:-claude}" = "kiro" ]; then
    OUTPUT=$(echo "$PROMPT" \
      | kiro-cli chat --trust-all-tools --no-interactive 2>&1 \
      | tee /dev/stderr) || true
  else
    OUTPUT=$(echo "$PROMPT" \
      | claude -p --dangerously-skip-permissions 2>&1 \
      | tee /dev/stderr) || true
  fi

  if echo "$OUTPUT" | grep -q "COMPLETE"; then
    echo ""
    echo -e "${GREEN}══════════════════════════════════════${NC}"
    echo -e " ✅ ${BOLD}All tasks complete!${NC}"
    echo -e "${GREEN}══════════════════════════════════════${NC}"
    exit 0
  fi

  if [ "$AUTO_MODE" = false ]; then
    echo ""
    read -r -p "$(echo -e "${YELLOW}⏸️  Iteration $i done. Press Enter to continue...${NC} ")"
  fi
done

echo ""
echo -e "${RED}══════════════════════════════════════${NC}"
echo -e " ⚠️  ${BOLD}Max iterations reached${NC} ${DIM}($MAX_ITERATIONS)${NC}"
echo -e "${RED}══════════════════════════════════════${NC}"
exit 1

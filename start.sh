#!/bin/bash

# ============================================
# FactCheck AI - Start Script
# Combat Misinformation Platform
# ============================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════╗"
echo "║          FactCheck AI Platform           ║"
echo "║      Combat Misinformation System        ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Clean up used ports ----
echo -e "${YELLOW}[1/7] Cleaning up used ports...${NC}"
BACKEND_PORT=4000
FRONTEND_PORT=3000

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  else
    echo -e "  Port $port is free"
  fi
}

wait_for_port_free() {
  local port=$1
  local max_wait=10
  local waited=0
  while lsof -ti :$port >/dev/null 2>&1; do
    if [ $waited -ge $max_wait ]; then
      echo -e "${RED}  Port $port still in use after ${max_wait}s, force killing again...${NC}"
      lsof -ti :$port 2>/dev/null | xargs kill -9 2>/dev/null || true
      sleep 1
      break
    fi
    sleep 1
    waited=$((waited + 1))
  done
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# Wait until ports are actually free
wait_for_port_free $BACKEND_PORT
wait_for_port_free $FRONTEND_PORT

echo -e "${GREEN}  Ports cleaned and verified free.${NC}"

# ---- Check prerequisites ----
echo -e "${YELLOW}[2/7] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}  Node.js is not installed. Please install Node.js first.${NC}"
  exit 1
fi
echo -e "  Node.js: $(node -v)"

if ! command -v psql &> /dev/null; then
  echo -e "${RED}  PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
  exit 1
fi
echo -e "  PostgreSQL: $(psql --version | head -1)"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 3
  if ! pg_isready -q 2>/dev/null; then
    echo -e "${RED}  Could not start PostgreSQL. Please start it manually.${NC}"
    exit 1
  fi
fi
echo -e "${GREEN}  PostgreSQL is running.${NC}"

# ---- Setup Database ----
echo -e "${YELLOW}[3/7] Setting up database...${NC}"

CURRENT_USER=$(whoami)
export DATABASE_URL="postgresql://${CURRENT_USER}@localhost:5432/factcheck_db"

# Create database if it doesn't exist
if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw factcheck_db; then
  echo -e "  Creating database 'factcheck_db'..."
  createdb factcheck_db 2>/dev/null || psql -c "CREATE DATABASE factcheck_db;" 2>/dev/null || true
fi

# Update the .env file for the app to use
if [ -f "$PROJECT_DIR/.env" ]; then
  sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/factcheck_db|" "$PROJECT_DIR/.env"
fi

echo -e "${GREEN}  Database ready.${NC}"

# ---- Install Dependencies ----
echo -e "${YELLOW}[4/7] Installing server dependencies...${NC}"
cd "$PROJECT_DIR/server"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}  Server dependencies installed.${NC}"

echo -e "${YELLOW}[5/7] Installing client dependencies...${NC}"
cd "$PROJECT_DIR/client"
npm install --silent 2>&1 | tail -1
echo -e "${GREEN}  Client dependencies installed.${NC}"

# ---- Seed Database ----
echo -e "${YELLOW}[6/7] Seeding database...${NC}"
cd "$PROJECT_DIR/server"
DATABASE_URL="postgresql://${CURRENT_USER}@localhost:5432/factcheck_db" node seed.js
echo -e "${GREEN}  Database seeded with sample data.${NC}"

# ---- Start Application ----
echo -e "${YELLOW}[7/7] Starting application with hot reload...${NC}"

# Cleanup function for graceful shutdown
PIDS_TO_KILL=()
cleanup() {
  echo -e "\n${YELLOW}Shutting down...${NC}"
  for pid in "${PIDS_TO_KILL[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  kill $(jobs -p) 2>/dev/null || true
  wait 2>/dev/null || true
  echo -e "${GREEN}Goodbye!${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend with nodemon for hot reload
echo -e "${BLUE}  Starting backend on port ${BACKEND_PORT} (with nodemon hot reload)...${NC}"
cd "$PROJECT_DIR/server"
DATABASE_URL="postgresql://${CURRENT_USER}@localhost:5432/factcheck_db" npx nodemon --watch . --ext js,json index.js &
PIDS_TO_KILL+=($!)

# Wait for backend to be ready before printing success
echo -e "  Waiting for backend to start..."
BACKEND_READY=false
for i in $(seq 1 15); do
  if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
    BACKEND_READY=true
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" = true ]; then
  echo -e "${GREEN}  Backend is ready on port ${BACKEND_PORT}.${NC}"
else
  echo -e "${RED}  Backend failed to start. Check logs above.${NC}"
  exit 1
fi

# Start frontend with React dev server (has built-in hot reload)
echo -e "${BLUE}  Starting frontend on port ${FRONTEND_PORT} (with hot reload)...${NC}"
cd "$PROJECT_DIR/client"
BROWSER=none PORT=$FRONTEND_PORT npm start &
PIDS_TO_KILL+=($!)

# Wait for frontend to be ready
echo -e "  Waiting for frontend to compile..."
FRONTEND_READY=false
for i in $(seq 1 60); do
  if curl -s http://localhost:${FRONTEND_PORT} > /dev/null 2>&1; then
    FRONTEND_READY=true
    break
  fi
  sleep 2
done

if [ "$FRONTEND_READY" = true ]; then
  echo -e "${GREEN}  Frontend is ready on port ${FRONTEND_PORT}.${NC}"
else
  echo -e "${YELLOW}  Frontend is still compiling... it will be available shortly.${NC}"
fi

echo -e ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     FactCheck AI is running!             ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:${FRONTEND_PORT}          ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:${BACKEND_PORT}          ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  Login: admin@factcheck.org              ║${NC}"
echo -e "${GREEN}║  Pass:  password123                      ║${NC}"
echo -e "${GREEN}║                                          ║${NC}"
echo -e "${GREEN}║  Hot reload enabled for both servers.    ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop.                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo -e ""

# Wait for background processes (keeps script alive)
wait

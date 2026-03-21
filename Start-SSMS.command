#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  SSMS — Smart Staff Management System
#  Double-click this file to start the system!
# ═══════════════════════════════════════════════════════════════

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   🏢 Smart Staff Management System (SSMS)           ║"
echo "║   Starting servers... Please wait.                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Get local IP for WiFi access
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

# Start Backend Server in background
echo "🔧 Starting Backend Server..."
cd "$SCRIPT_DIR/backend"
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start Frontend Server in background
echo "🌐 Starting Frontend Server..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 4

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ SSMS is Running!                               ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║   🖥️  Computer:  http://localhost:5173               ║"
echo "║   📱 Mobile:    http://$LOCAL_IP:5173            ║"
echo "║                                                      ║"
echo "║   👤 Admin Login:                                    ║"
echo "║      Email:    admin@ssms.com                        ║"
echo "║      Password: Admin@123                             ║"
echo "║                                                      ║"
echo "║   Press Ctrl+C to stop the system.                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Open browser automatically
open "http://localhost:5173" 2>/dev/null || xdg-open "http://localhost:5173" 2>/dev/null

# Wait for user to press Ctrl+C
trap "echo ''; echo '🛑 Stopping SSMS...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ SSMS stopped. You can close this window.'; exit 0" INT SIGTERM

# Keep running
wait

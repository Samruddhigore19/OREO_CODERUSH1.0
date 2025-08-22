#!/bin/bash

echo "========================================"
echo " CME Detection and Alert System"
echo " Starting Backend and Frontend Services"
echo "========================================"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version
echo

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "ERROR: backend directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

if [ ! -d "my-app" ]; then
    echo "ERROR: my-app directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies for backend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install backend dependencies"
        exit 1
    fi
else
    echo "Backend dependencies already installed."
fi
cd ..

echo
echo "Installing frontend dependencies..."
cd my-app
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies for frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "Frontend dependencies already installed."
fi
cd ..

echo
echo "========================================"
echo " Starting Services"
echo "========================================"
echo

# Start backend in background
echo "Starting backend server on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

echo "Waiting for backend to start..."
sleep 5

# Start frontend in background
echo "Starting frontend development server on port 3000..."
cd my-app
npm run dev &
FRONTEND_PID=$!
cd ..

echo
echo "========================================"
echo " Services Started Successfully!"
echo "========================================"
echo
echo "Backend API:     http://localhost:3001"
echo "Frontend UI:     http://localhost:3000"
echo "WebSocket:       ws://localhost:3001/ws"
echo
echo "Backend Health:  http://localhost:3001/api/health"
echo "API Docs:        See backend/README.md"
echo
echo "The frontend will be available at http://localhost:3000"
echo "Both servers will reload automatically when you make changes."
echo
echo "Process IDs:"
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo
echo "To stop the servers, press Ctrl+C or run:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo

# Function to cleanup processes on script exit
cleanup() {
    echo
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Services stopped."
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user input or process completion
echo "Press Ctrl+C to stop all services"
wait

#!/bin/bash
# Start Nest Onboarding in development mode

echo "🚀 Starting Nest Onboarding Platform..."

# Backend
echo "📦 Setting up backend..."
cd backend
[ ! -f .env ] && cp .env.example .env
pip install -r requirements.txt -q
python seed.py
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ Backend running on http://localhost:8000"
echo "📖 API docs: http://localhost:8000/api/docs"

# Frontend
echo "📦 Setting up frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend running on http://localhost:5173"

echo ""
echo "🎉 Nest Onboarding is ready!"
echo ""
echo "Demo accounts:"
echo "  Admin:    admin@nestonboarding.com / admin123"
echo "  Manager:  manager@nestonboarding.com / manager123"
echo "  Employee: alice@nestonboarding.com / employee123"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait

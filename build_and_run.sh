#!/bin/bash

echo "🔨 Building frontend..."
cd frontend && npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
    echo "🚀 Starting server on 127.0.0.1:8000..."
    echo "📱 Visit: http://127.0.0.1:8000"
    cd .. && python app_runner.py
else
    echo "❌ Frontend build failed!"
    exit 1
fi 
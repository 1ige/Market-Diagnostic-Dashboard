#!/bin/bash
# AWS Deployment Configuration Script

echo "🚀 Market Diagnostic Dashboard - AWS Configuration"
echo ""

# Get AWS public IP
read -p "Enter your AWS public IP address (or domain): " AWS_HOST

# Choose deployment mode
echo ""
echo "Choose deployment mode:"
echo "1) Proxy mode (recommended) - All traffic through port 5173"
echo "2) Direct mode - Frontend on 5173, Backend on 8000"
read -p "Enter choice (1 or 2): " MODE

if [ "$MODE" = "1" ]; then
    echo ""
    echo "📝 Configuring PROXY MODE..."
    
    # Update frontend env
    cat > devops/env/frontend.env << EOF
# Frontend environment variables
# Proxy mode - all API requests go through Vite proxy
VITE_API_URL=/api
EOF
    
    # Update backend env
    sed -i.bak "s|CORS_ORIGINS=.*|CORS_ORIGINS=*|g" devops/env/backend.env
    
    echo "✅ Configuration updated for proxy mode"
    echo ""
    echo "Required AWS Security Group rules:"
    echo "  - Port 5173 (Frontend) - OPEN"
    echo "  - Port 8000 (Backend) - Can be closed (internal only)"
    echo ""
    echo "Access your dashboard at: http://$AWS_HOST:5173"
    
elif [ "$MODE" = "2" ]; then
    echo ""
    echo "📝 Configuring DIRECT MODE..."
    
    # Update frontend env
    cat > devops/env/frontend.env << EOF
# Frontend environment variables
# Direct mode - frontend connects directly to backend
VITE_API_URL=http://$AWS_HOST:8000
EOF
    
    # Update backend env
    sed -i.bak "s|CORS_ORIGINS=.*|CORS_ORIGINS=http://$AWS_HOST:5173|g" devops/env/backend.env
    
    echo "✅ Configuration updated for direct mode"
    echo ""
    echo "Required AWS Security Group rules:"
    echo "  - Port 5173 (Frontend) - OPEN"
    echo "  - Port 8000 (Backend) - OPEN"
    echo ""
    echo "Access your dashboard at: http://$AWS_HOST:5173"
    
else
    echo "❌ Invalid choice"
    exit 1
fi

# Ask about deployment
echo ""
read -p "Deploy now? (y/n): " DEPLOY

if [ "$DEPLOY" = "y" ] || [ "$DEPLOY" = "Y" ]; then
    echo ""
    echo "🔨 Rebuilding and restarting containers..."
    docker compose down
    docker compose up -d --build
    
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 5
    
    echo ""
    echo "📋 Checking service status..."
    docker compose ps
    
    echo ""
    echo "✅ Deployment complete!"
    echo ""
    echo "Test your deployment:"
    echo "  Backend health: curl http://localhost:8000/health"
    if [ "$MODE" = "1" ]; then
        echo "  Proxy test: docker exec market_frontend wget -qO- http://localhost:5173/api/health"
    fi
    echo ""
    echo "View logs: docker compose logs -f"
else
    echo ""
    echo "⚠️  Configuration saved but not deployed."
    echo "To deploy manually, run: docker compose down && docker compose up -d --build"
fi

echo ""
echo "📚 For more details, see AWS_DEPLOYMENT.md"

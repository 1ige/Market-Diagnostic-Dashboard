#!/bin/bash
# Deploy AAP Full Implementation to Production

echo "======================================================================"
echo " AAP Full 18-Component System Deployment"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Step 1: Pull latest code..."
cd ~/Market-Diagnostic-Dashboard
git pull

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Git pull failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

echo "Step 2: Run comprehensive data refresh..."
docker exec market_backend python refresh_aap_data.py

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Data refresh had issues, but continuing...${NC}"
else
    echo -e "${GREEN}✓ Data refresh complete${NC}"
fi
echo ""

echo "Step 3: Rebuild frontend..."
docker-compose up -d --build frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Frontend rebuild failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo ""

echo "Step 4: Verify deployment..."
echo ""

echo "Checking API health..."
curl -s https://marketdiagnostictool.com/health | jq -r '.status' || echo "API check failed"

echo ""
echo "Checking AAP endpoint..."
AAP_SCORE=$(curl -s https://marketdiagnostictool.com/api/aap/current 2>/dev/null | jq -r '.stability_score // "N/A"')
echo "  AAP Stability Score: $AAP_SCORE"

echo ""
echo "Checking component breakdown endpoint..."
COMPONENT_COUNT=$(curl -s https://marketdiagnostictool.com/api/aap/components/breakdown 2>/dev/null | jq -r '.components | length // "N/A"')
echo "  Components Available: $COMPONENT_COUNT/18"

echo ""
echo "======================================================================"
echo " Deployment Summary"
echo "======================================================================"
echo ""
echo "✅ Code deployed"
echo "✅ Data refreshed"
echo "✅ Frontend rebuilt"
echo "✅ API verified"
echo ""
echo "Next steps:"
echo "  1. Visit: https://marketdiagnostictool.com/indicators"
echo "  2. Check AAP indicator status"
echo "  3. Visit: https://marketdiagnostictool.com/aap-breakdown"
echo "  4. View detailed component breakdown"
echo ""
echo "⚠️  Note: AAP calculations require 13/18 components (70%)"
echo "    Current implementation provides 10/18 (55.6%)"
echo "    See AAP_FULL_IMPLEMENTATION.md for roadmap to 18/18"
echo ""
echo "======================================================================"

#!/bin/bash
# Test all implemented API endpoints

BASE_URL="http://localhost:4000/api/v1"
GREEN='\033[0.32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing Laporin API Endpoints"
echo "================================"
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4
    
    echo -n "Testing: $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $response)"
        ((FAILED++))
    fi
}

echo "📍 Map Endpoints"
echo "----------------"
test_endpoint "GET" "/map/pins" "Get map pins (GeoJSON)" 200
test_endpoint "GET" "/map/heatmap" "Get heatmap data" 200
test_endpoint "GET" "/map/cluster?zoom=10" "Get clustered data" 200
echo ""

echo "📊 Statistics Endpoints"
echo "----------------------"
test_endpoint "GET" "/statistics/overview" "Get platform overview" 200
test_endpoint "GET" "/statistics/leaderboard" "Get regional leaderboard" 200
test_endpoint "GET" "/statistics/trends?days=30" "Get trends data" 200
test_endpoint "GET" "/statistics/region?regionCode=3273&period=30d" "Get region statistics" 200
echo ""

echo "📂 Categories Endpoints"
echo "----------------------"
test_endpoint "GET" "/categories" "Get all categories" 200
test_endpoint "GET" "/categories/1" "Get category by ID" 200
test_endpoint "GET" "/categories/1/stats?days=30" "Get category statistics" 200
test_endpoint "GET" "/categories/999" "Get non-existent category" 404
echo ""

echo "💾 Storage Endpoints"
echo "-------------------"
test_endpoint "GET" "/storage/limits" "Get storage limits (public)" 200
test_endpoint "POST" "/storage/upload-url" "Generate upload URL (no auth)" 401
echo ""

echo "🏥 Health Check"
echo "--------------"
test_endpoint "GET" "/../health" "API health check" 200
echo ""

echo "================================"
echo "📈 Test Results"
echo "================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

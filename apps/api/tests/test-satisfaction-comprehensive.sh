#!/bin/bash
# Comprehensive test for satisfaction endpoint
# Tests all acceptance criteria from Requirements 5.1-5.5

BASE_URL="http://localhost:4000/api/v1"
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@laporin.com","password":"password123"}' | jq -r '.data.accessToken')

OFFICER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"officer@laporin.com","password":"password123"}' | jq -r '.data.accessToken')

SUPER_ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@laporin.com","password":"password123"}' | jq -r '.data.accessToken')

echo "=========================================="
echo "Satisfaction Endpoint Comprehensive Tests"
echo "=========================================="
echo ""

# Test 1: Admin can access satisfaction data (Requirement 5.1, 5.2)
echo "Test 1: Admin access with 30-day period"
RESPONSE=$(curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$RESPONSE" | jq .
echo ""

# Test 2: Different time periods (Requirement 5.2)
echo "Test 2: 90-day period"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=90" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

echo "Test 3: 365-day period"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=365" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

# Test 4: Officer role-based filtering (Requirement 5.2)
echo "Test 4: Officer access (should see only assigned reports)"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=30" \
  -H "Authorization: Bearer $OFFICER_TOKEN" | jq .
echo ""

# Test 5: Super admin access (Requirement 5.2)
echo "Test 5: Super admin access (should see all agencies)"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=30" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" | jq .
echo ""

# Test 6: Verify response format (Requirements 5.3, 5.4, 5.5)
echo "Test 6: Verify response format"
RESPONSE=$(curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Check if averageRating is rounded to 1 decimal place (Requirement 5.5)
AVG_RATING=$(echo "$RESPONSE" | jq -r '.data.averageRating')
TOTAL_RATINGS=$(echo "$RESPONSE" | jq -r '.data.totalRatings')

echo "Average Rating: $AVG_RATING (should be rounded to 1 decimal)"
echo "Total Ratings: $TOTAL_RATINGS"
echo ""

# Test 7: Verify cache is working
echo "Test 7: Verify Redis cache"
redis-cli -u "redis://default:z0AnxoXXQ4YNsQPA94gFS9kQ7FGN4DJA@redis-14758.c334.asia-southeast2-1.gce.cloud.redislabs.com:14758" \
  KEYS "analytics:satisfaction:*" 2>/dev/null | grep -v "Warning"
echo ""

# Test 8: Verify cache TTL (should be 300 seconds = 5 minutes)
echo "Test 8: Verify cache TTL"
TTL=$(redis-cli -u "redis://default:z0AnxoXXQ4YNsQPA94gFS9kQ7FGN4DJA@redis-14758.c334.asia-southeast2-1.gce.cloud.redislabs.com:14758" \
  TTL "analytics:satisfaction:00000000-0000-0000-0000-000000000001:30" 2>/dev/null | grep -v "Warning")
echo "TTL: $TTL seconds (should be <= 300)"
echo ""

# Test 9: Unauthorized access (should fail)
echo "Test 9: Unauthorized access (should fail with 401)"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=30" | jq .
echo ""

# Test 10: Invalid period (should use default 30)
echo "Test 10: Invalid period parameter (should use default 30)"
curl -s -X GET "$BASE_URL/gov/analytics/satisfaction?period=invalid" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="

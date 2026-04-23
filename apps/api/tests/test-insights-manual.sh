#!/bin/bash

# Manual test script for Analytics Insights Endpoint
# Requirements: 7.1, 7.2, 7.3, 7.4

BASE_URL="http://localhost:4000/api/v1"

echo "🚀 Testing Analytics Insights Endpoint"
echo "========================================"

# Step 1: Login as admin
echo ""
echo "📝 Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@laporin.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Cannot proceed with tests."
  exit 1
fi

echo "✅ Login successful. Token obtained."

# Step 2: Test insights endpoint without cached data
echo ""
echo "📊 Step 2: Testing insights endpoint (no cache)..."
INSIGHTS_RESPONSE=$(curl -s -X GET "$BASE_URL/gov/analytics/insights" \
  -H "Authorization: Bearer $TOKEN")

echo "$INSIGHTS_RESPONSE" | jq '.'

# Validate response structure
SUCCESS=$(echo "$INSIGHTS_RESPONSE" | jq -r '.success')
INSIGHTS=$(echo "$INSIGHTS_RESPONSE" | jq -r '.data.insights')
GENERATED_AT=$(echo "$INSIGHTS_RESPONSE" | jq -r '.data.generatedAt')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Response has success=true"
else
  echo "❌ Response has success=false"
fi

if [ "$INSIGHTS" != "null" ]; then
  echo "✅ Response has insights array"
else
  echo "❌ Response missing insights array"
fi

if [ "$GENERATED_AT" = "null" ]; then
  echo "✅ generatedAt is null (no cache)"
else
  echo "⚠️  generatedAt is not null: $GENERATED_AT"
fi

# Step 3: Manually set cache data in Redis
echo ""
echo "📦 Step 3: Setting cache data in Redis..."
redis-cli SET "analytics:insights:00000000-0000-0000-0000-000000000001" '{"insights":["Laporan jalan rusak meningkat 25% minggu ini","Kategori lampu jalan memiliki waktu penyelesaian tercepat","Tingkat kepuasan warga mencapai 4.2/5.0"],"generatedAt":"2024-01-15T10:30:00.000Z"}' > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Cache data set successfully"
else
  echo "❌ Failed to set cache data (is Redis running?)"
fi

# Step 4: Test insights endpoint with cached data
echo ""
echo "📊 Step 4: Testing insights endpoint (with cache)..."
INSIGHTS_CACHED_RESPONSE=$(curl -s -X GET "$BASE_URL/gov/analytics/insights" \
  -H "Authorization: Bearer $TOKEN")

echo "$INSIGHTS_CACHED_RESPONSE" | jq '.'

# Validate cached response
CACHED_SUCCESS=$(echo "$INSIGHTS_CACHED_RESPONSE" | jq -r '.success')
CACHED_INSIGHTS=$(echo "$INSIGHTS_CACHED_RESPONSE" | jq -r '.data.insights | length')
CACHED_GENERATED_AT=$(echo "$INSIGHTS_CACHED_RESPONSE" | jq -r '.data.generatedAt')

if [ "$CACHED_SUCCESS" = "true" ]; then
  echo "✅ Cached response has success=true"
else
  echo "❌ Cached response has success=false"
fi

if [ "$CACHED_INSIGHTS" -gt 0 ]; then
  echo "✅ Cached response has $CACHED_INSIGHTS insights"
else
  echo "❌ Cached response has no insights"
fi

if [ "$CACHED_GENERATED_AT" != "null" ]; then
  echo "✅ generatedAt is set: $CACHED_GENERATED_AT"
else
  echo "❌ generatedAt is null (should be set from cache)"
fi

# Step 5: Test without authentication
echo ""
echo "🔒 Step 5: Testing without authentication..."
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/gov/analytics/insights")

echo "$UNAUTH_RESPONSE" | jq '.'

UNAUTH_SUCCESS=$(echo "$UNAUTH_RESPONSE" | jq -r '.success')

if [ "$UNAUTH_SUCCESS" = "false" ]; then
  echo "✅ Correctly rejected unauthorized request"
else
  echo "❌ Should reject unauthorized request"
fi

# Summary
echo ""
echo "========================================"
echo "✅ Test completed!"
echo ""
echo "To clean up Redis cache:"
echo "  redis-cli DEL analytics:insights:00000000-0000-0000-0000-000000000001"

#!/bin/bash

# Sprint Planning & Planning Poker API Test Script
# Run: chmod +x test-sprint-planning.sh && ./test-sprint-planning.sh

BASE_URL="http://localhost:5000/api/v1/pm"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Sprint Planning & Planning Poker Tests${NC}"
echo -e "${YELLOW}========================================${NC}"

# You need to set these values from your database
# Get a valid JWT token by logging in first
TOKEN="YOUR_JWT_TOKEN_HERE"
ORGANIZATION_ID="YOUR_ORG_ID_HERE"
PROJECT_ID="YOUR_PROJECT_ID_HERE"
SPRINT_ID="YOUR_SPRINT_ID_HERE"
TASK_ID="YOUR_TASK_ID_HERE"

# Headers
AUTH_HEADER="Authorization: Bearer $TOKEN"
ORG_HEADER="X-Organization-ID: $ORGANIZATION_ID"
CONTENT_TYPE="Content-Type: application/json"

echo ""
echo -e "${GREEN}1. Testing Sprint Planning Summary${NC}"
echo "GET $BASE_URL/sprints/$SPRINT_ID/planning"
curl -s -X GET "$BASE_URL/sprints/$SPRINT_ID/planning" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" | jq .

echo ""
echo -e "${GREEN}2. Testing Update Team Capacity${NC}"
echo "PUT $BASE_URL/sprints/$SPRINT_ID/capacity"
curl -s -X PUT "$BASE_URL/sprints/$SPRINT_ID/capacity" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -H "$CONTENT_TYPE" \
  -d '{
    "teamCapacity": [
      {
        "userId": "USER_ID_1",
        "availableDays": 10,
        "hoursPerDay": 8,
        "plannedLeave": 0,
        "meetingHours": 5
      }
    ]
  }' | jq .

echo ""
echo -e "${GREEN}3. Testing Update Sprint Settings${NC}"
echo "PUT $BASE_URL/sprints/$SPRINT_ID/settings"
curl -s -X PUT "$BASE_URL/sprints/$SPRINT_ID/settings" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -H "$CONTENT_TYPE" \
  -d '{
    "settings": {
      "requireGoal": true,
      "requireEstimates": true,
      "enforceCapacity": false
    }
  }' | jq .

echo ""
echo -e "${GREEN}4. Testing Create Planning Poker Session${NC}"
echo "POST $BASE_URL/tasks/$TASK_ID/poker"
POKER_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks/$TASK_ID/poker" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -H "$CONTENT_TYPE" \
  -d '{
    "estimationType": "story_points"
  }')
echo "$POKER_RESPONSE" | jq .
SESSION_ID=$(echo "$POKER_RESPONSE" | jq -r '.data.session._id // empty')

if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ]; then
  echo ""
  echo -e "${GREEN}5. Testing Get Poker Session${NC}"
  echo "GET $BASE_URL/poker/$SESSION_ID"
  curl -s -X GET "$BASE_URL/poker/$SESSION_ID" \
    -H "$AUTH_HEADER" \
    -H "$ORG_HEADER" | jq .

  echo ""
  echo -e "${GREEN}6. Testing Submit Vote${NC}"
  echo "POST $BASE_URL/poker/$SESSION_ID/vote"
  curl -s -X POST "$BASE_URL/poker/$SESSION_ID/vote" \
    -H "$AUTH_HEADER" \
    -H "$ORG_HEADER" \
    -H "$CONTENT_TYPE" \
    -d '{"value": 5}' | jq .

  echo ""
  echo -e "${GREEN}7. Testing Reveal Votes${NC}"
  echo "POST $BASE_URL/poker/$SESSION_ID/reveal"
  curl -s -X POST "$BASE_URL/poker/$SESSION_ID/reveal" \
    -H "$AUTH_HEADER" \
    -H "$ORG_HEADER" | jq .

  echo ""
  echo -e "${GREEN}8. Testing Complete Session${NC}"
  echo "POST $BASE_URL/poker/$SESSION_ID/complete"
  curl -s -X POST "$BASE_URL/poker/$SESSION_ID/complete" \
    -H "$AUTH_HEADER" \
    -H "$ORG_HEADER" \
    -H "$CONTENT_TYPE" \
    -d '{"finalEstimate": 5}' | jq .
else
  echo -e "${RED}Could not create poker session, skipping poker tests${NC}"
fi

echo ""
echo -e "${GREEN}9. Testing Start Sprint (with validation)${NC}"
echo "POST $BASE_URL/sprints/$SPRINT_ID/start"
curl -s -X POST "$BASE_URL/sprints/$SPRINT_ID/start" \
  -H "$AUTH_HEADER" \
  -H "$ORG_HEADER" \
  -H "$CONTENT_TYPE" \
  -d '{
    "skipValidation": false,
    "participants": []
  }' | jq .

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Tests Complete${NC}"
echo -e "${YELLOW}========================================${NC}"

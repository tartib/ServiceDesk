#!/bin/bash

# Test Planning Poker Flow
# Usage: ./test-poker.sh <AUTH_TOKEN> <PROJECT_ID>

BASE_URL="http://localhost:5000/api/pm"
TOKEN="${1:-YOUR_TOKEN_HERE}"
PROJECT_ID="${2:-YOUR_PROJECT_ID}"

echo "=== Planning Poker Test ==="
echo ""

# Step 1: Create a task
echo "1. Creating task..."
TASK_RESPONSE=$(curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Task for Planning Poker",
    "type": "story",
    "priority": "medium",
    "description": "This is a test task to verify Planning Poker functionality"
  }')

echo "$TASK_RESPONSE" | jq .

TASK_ID=$(echo "$TASK_RESPONSE" | jq -r '.data.task._id')

if [ "$TASK_ID" == "null" ] || [ -z "$TASK_ID" ]; then
  echo "❌ Failed to create task"
  exit 1
fi

echo "✅ Task created: $TASK_ID"
echo ""

# Step 2: Create Planning Poker session
echo "2. Creating Planning Poker session..."
POKER_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks/$TASK_ID/poker" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "estimationType": "story_points"
  }')

echo "$POKER_RESPONSE" | jq .

SESSION_ID=$(echo "$POKER_RESPONSE" | jq -r '.data.session._id')

if [ "$SESSION_ID" == "null" ] || [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create poker session"
  exit 1
fi

echo "✅ Poker session created: $SESSION_ID"
echo ""

# Step 3: Submit a vote
echo "3. Submitting vote (5 points)..."
VOTE_RESPONSE=$(curl -s -X POST "$BASE_URL/poker/$SESSION_ID/vote" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "value": 5
  }')

echo "$VOTE_RESPONSE" | jq .
echo ""

# Step 4: Reveal votes
echo "4. Revealing votes..."
REVEAL_RESPONSE=$(curl -s -X POST "$BASE_URL/poker/$SESSION_ID/reveal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "$REVEAL_RESPONSE" | jq .
echo ""

# Step 5: Complete session
echo "5. Completing session with estimate 5..."
COMPLETE_RESPONSE=$(curl -s -X POST "$BASE_URL/poker/$SESSION_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "finalEstimate": 5
  }')

echo "$COMPLETE_RESPONSE" | jq .
echo ""

# Step 6: Verify task has story points
echo "6. Verifying task has story points..."
TASK_CHECK=$(curl -s -X GET "$BASE_URL/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN")

STORY_POINTS=$(echo "$TASK_CHECK" | jq -r '.data.task.storyPoints')
echo "Task story points: $STORY_POINTS"

if [ "$STORY_POINTS" == "5" ]; then
  echo "✅ SUCCESS! Task now has 5 story points"
else
  echo "❌ FAILED! Expected 5 story points, got: $STORY_POINTS"
fi

echo ""
echo "=== Test Complete ==="

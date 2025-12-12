#!/bin/bash

# Black Donut Comment System - Testing Script
# Usage: bash comment-tests.sh

BASE_URL="http://localhost:3000"
FOOD_ID=""
COMMENT_ID=""
USER_TOKEN=""
PARTNER_TOKEN=""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Black Donut Comment System - Testing Script             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Add Comment
test_add_comment() {
    echo -e "${YELLOW}[TEST 1] Adding Comment...${NC}"
    
    if [ -z "$FOOD_ID" ] || [ -z "$USER_TOKEN" ]; then
        echo -e "${RED}❌ Missing FOOD_ID or USER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/comments" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -d "{\"foodId\": \"$FOOD_ID\", \"text\": \"This looks delicious! 🍛\"}")
    
    COMMENT_ID=$(echo $RESPONSE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$COMMENT_ID" ]; then
        echo -e "${GREEN}✅ Comment added successfully${NC}"
        echo -e "Comment ID: ${BLUE}$COMMENT_ID${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to add comment${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Test 2: Get Comments
test_get_comments() {
    echo ""
    echo -e "${YELLOW}[TEST 2] Getting Comments for Food...${NC}"
    
    if [ -z "$FOOD_ID" ]; then
        echo -e "${RED}❌ Missing FOOD_ID${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/api/comments/food/$FOOD_ID")
    
    COUNT=$(echo $RESPONSE | grep -o '"_id"' | wc -l)
    
    echo -e "${GREEN}✅ Retrieved $COUNT comments${NC}"
    echo $RESPONSE | head -c 200
    echo "..."
    return 0
}

# Test 3: Pin Comment
test_pin_comment() {
    echo ""
    echo -e "${YELLOW}[TEST 3] Pinning Comment...${NC}"
    
    if [ -z "$COMMENT_ID" ] || [ -z "$PARTNER_TOKEN" ]; then
        echo -e "${RED}❌ Missing COMMENT_ID or PARTNER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X PUT "$BASE_URL/api/comments/engagement/$COMMENT_ID/pin" \
        -H "Authorization: Bearer $PARTNER_TOKEN")
    
    if echo $RESPONSE | grep -q "pinned\|unpinned"; then
        echo -e "${GREEN}✅ Comment pin status toggled${NC}"
        echo $RESPONSE
        return 0
    else
        echo -e "${RED}❌ Failed to pin comment${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Test 4: Reply to Comment
test_reply_comment() {
    echo ""
    echo -e "${YELLOW}[TEST 4] Replying to Comment...${NC}"
    
    if [ -z "$COMMENT_ID" ] || [ -z "$PARTNER_TOKEN" ]; then
        echo -e "${RED}❌ Missing COMMENT_ID or PARTNER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/comments/engagement/$COMMENT_ID/reply" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $PARTNER_TOKEN" \
        -d "{\"text\": \"Thank you! DM us for orders 😊\"}")
    
    if echo $RESPONSE | grep -q "reply\|Reply"; then
        echo -e "${GREEN}✅ Reply added successfully${NC}"
        echo $RESPONSE | head -c 300
        echo "..."
        return 0
    else
        echo -e "${RED}❌ Failed to reply${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Test 5: Get Engagement Stats
test_engagement_stats() {
    echo ""
    echo -e "${YELLOW}[TEST 5] Getting Engagement Stats...${NC}"
    
    if [ -z "$FOOD_ID" ] || [ -z "$PARTNER_TOKEN" ]; then
        echo -e "${RED}❌ Missing FOOD_ID or PARTNER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X GET "$BASE_URL/api/comments/engagement/$FOOD_ID" \
        -H "Authorization: Bearer $PARTNER_TOKEN")
    
    if echo $RESPONSE | grep -q "likes\|comments\|saves"; then
        echo -e "${GREEN}✅ Engagement stats retrieved${NC}"
        echo $RESPONSE
        return 0
    else
        echo -e "${RED}❌ Failed to get stats${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Test 6: Delete Comment as Owner
test_delete_comment_owner() {
    echo ""
    echo -e "${YELLOW}[TEST 6] Deleting Comment as Partner...${NC}"
    
    if [ -z "$COMMENT_ID" ] || [ -z "$PARTNER_TOKEN" ]; then
        echo -e "${RED}❌ Missing COMMENT_ID or PARTNER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/comments/engagement/$COMMENT_ID" \
        -H "Authorization: Bearer $PARTNER_TOKEN")
    
    if echo $RESPONSE | grep -q "deleted"; then
        echo -e "${GREEN}✅ Comment deleted successfully${NC}"
        echo $RESPONSE
        return 0
    else
        echo -e "${RED}❌ Failed to delete comment${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Test 7: Delete Own Comment as User
test_delete_own_comment() {
    echo ""
    echo -e "${YELLOW}[TEST 7] Deleting Own Comment as User...${NC}"
    
    if [ -z "$COMMENT_ID" ] || [ -z "$USER_TOKEN" ]; then
        echo -e "${RED}❌ Missing COMMENT_ID or USER_TOKEN${NC}"
        return 1
    fi
    
    RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/comments/$COMMENT_ID" \
        -H "Authorization: Bearer $USER_TOKEN")
    
    if echo $RESPONSE | grep -q "deleted"; then
        echo -e "${GREEN}✅ Comment deleted successfully${NC}"
        echo $RESPONSE
        return 0
    else
        echo -e "${RED}❌ Failed to delete comment${NC}"
        echo $RESPONSE
        return 1
    fi
}

# Interactive Menu
show_menu() {
    echo ""
    echo -e "${BLUE}========== TEST MENU ==========${NC}"
    echo "1) Add Comment"
    echo "2) Get Comments"
    echo "3) Pin Comment"
    echo "4) Reply to Comment"
    echo "5) Get Engagement Stats"
    echo "6) Delete Comment (as Partner)"
    echo "7) Delete Comment (as User)"
    echo "8) Run All Tests"
    echo "9) Set Tokens (required first)"
    echo "0) Exit"
    echo -e "${BLUE}==============================${NC}"
}

set_tokens() {
    echo ""
    echo -e "${YELLOW}Setting Test Variables...${NC}"
    read -p "Enter BASE_URL [http://localhost:3000]: " BASE_URL
    BASE_URL=${BASE_URL:-"http://localhost:3000"}
    
    read -p "Enter FOOD_ID: " FOOD_ID
    read -p "Enter COMMENT_ID (optional): " COMMENT_ID
    read -p "Enter USER_TOKEN: " USER_TOKEN
    read -p "Enter PARTNER_TOKEN: " PARTNER_TOKEN
    
    echo -e "${GREEN}✅ Variables set${NC}"
}

run_all_tests() {
    echo ""
    echo -e "${BLUE}Running all tests...${NC}"
    echo ""
    
    test_add_comment && \
    test_get_comments && \
    test_pin_comment && \
    test_reply_comment && \
    test_engagement_stats && \
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        ✅ All Tests Completed!        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
}

# Main loop
while true; do
    show_menu
    read -p "Choose an option: " choice
    
    case $choice in
        1) test_add_comment ;;
        2) test_get_comments ;;
        3) test_pin_comment ;;
        4) test_reply_comment ;;
        5) test_engagement_stats ;;
        6) test_delete_comment_owner ;;
        7) test_delete_own_comment ;;
        8) run_all_tests ;;
        9) set_tokens ;;
        0) echo -e "${YELLOW}Exiting...${NC}"; exit 0 ;;
        *) echo -e "${RED}Invalid option${NC}" ;;
    esac
done

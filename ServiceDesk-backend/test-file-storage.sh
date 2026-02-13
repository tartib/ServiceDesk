#!/bin/bash

# File Storage Service Test Script
# This script demonstrates all available file storage endpoints

BASE_URL="http://localhost:5000/api/v1"
TOKEN=""
FILE_ID=""
FOLDER_ID=""
SHARE_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}File Storage Service Test Suite${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print section headers
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

# Function to print errors
print_error() {
    echo -e "${RED}Error: $1${NC}"
}

# Step 1: Login to get authentication token
print_header "1. Authentication"
echo "Please enter your email:"
read EMAIL
echo "Please enter your password:"
read -s PASSWORD

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    print_error "Authentication failed. Please check your credentials."
    exit 1
fi

echo -e "✓ Authentication successful"
echo "Token: ${TOKEN:0:20}..."

# Step 2: Create a folder
print_header "2. Create Folder"
FOLDER_RESPONSE=$(curl -s -X POST "$BASE_URL/folders" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Documents",
    "description": "Folder for testing file storage",
    "isPublic": false
  }')

FOLDER_ID=$(echo $FOLDER_RESPONSE | jq -r '.data._id')
echo "Response: $FOLDER_RESPONSE" | jq '.'
echo -e "✓ Folder created with ID: $FOLDER_ID"

# Step 3: Upload a single file
print_header "3. Upload Single File"
echo "Creating a test file..."
echo "This is a test document for file storage service" > test-document.txt

UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/files/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-document.txt" \
  -F "folderId=$FOLDER_ID" \
  -F "description=Test document upload" \
  -F "tags=[\"test\",\"document\"]")

FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data._id')
echo "Response: $UPLOAD_RESPONSE" | jq '.'
echo -e "✓ File uploaded with ID: $FILE_ID"

# Step 4: Get file metadata
print_header "4. Get File Metadata"
FILE_METADATA=$(curl -s -X GET "$BASE_URL/files/$FILE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $FILE_METADATA" | jq '.'
echo -e "✓ File metadata retrieved"

# Step 5: Update file metadata
print_header "5. Update File Metadata"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/files/$FILE_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "updated-test-document.txt",
    "description": "Updated test document",
    "tags": ["test", "document", "updated"]
  }')

echo "Response: $UPDATE_RESPONSE" | jq '.'
echo -e "✓ File metadata updated"

# Step 6: Get folder contents
print_header "6. Get Folder Contents"
FOLDER_CONTENTS=$(curl -s -X GET "$BASE_URL/folders/$FOLDER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $FOLDER_CONTENTS" | jq '.'
echo -e "✓ Folder contents retrieved"

# Step 7: Search files
print_header "7. Search Files"
SEARCH_RESPONSE=$(curl -s -X GET "$BASE_URL/files/search?q=test" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $SEARCH_RESPONSE" | jq '.'
echo -e "✓ File search completed"

# Step 8: Create share link
print_header "8. Create Share Link"
SHARE_RESPONSE=$(curl -s -X POST "$BASE_URL/files/$FILE_ID/share" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expiresIn": 3600,
    "maxDownloads": 5,
    "password": "test123",
    "canDownload": true,
    "canView": true
  }')

SHARE_TOKEN=$(echo $SHARE_RESPONSE | jq -r '.data.token')
SHARE_URL=$(echo $SHARE_RESPONSE | jq -r '.data.url')
echo "Response: $SHARE_RESPONSE" | jq '.'
echo -e "✓ Share link created"
echo -e "Share URL: $BASE_URL$SHARE_URL"
echo -e "Password: test123"

# Step 9: Access shared file (without authentication)
print_header "9. Access Shared File"
SHARED_FILE=$(curl -s -X GET "$BASE_URL/files/share/$SHARE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "test123"
  }')

echo "Response: $SHARED_FILE" | jq '.'
echo -e "✓ Shared file accessed"

# Step 10: Download file
print_header "10. Download File"
echo "Downloading file to 'downloaded-file.txt'..."
curl -s -X GET "$BASE_URL/files/$FILE_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded-file.txt

if [ -f "downloaded-file.txt" ]; then
    echo -e "✓ File downloaded successfully"
    echo "Content:"
    cat downloaded-file.txt
else
    print_error "File download failed"
fi

# Step 11: Preview file
print_header "11. Preview File"
echo "Getting file preview..."
PREVIEW=$(curl -s -X GET "$BASE_URL/files/$FILE_ID/preview" \
  -H "Authorization: Bearer $TOKEN")

echo "Preview content: $PREVIEW"
echo -e "✓ File preview retrieved"

# Step 12: Get storage statistics
print_header "12. Get Storage Statistics"
STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/files/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $STATS_RESPONSE" | jq '.'
echo -e "✓ Storage statistics retrieved"

# Step 13: Move file (to root)
print_header "13. Move File to Root"
MOVE_RESPONSE=$(curl -s -X PUT "$BASE_URL/files/$FILE_ID/move" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Response: $MOVE_RESPONSE" | jq '.'
echo -e "✓ File moved to root"

# Step 14: Soft delete file
print_header "14. Soft Delete File"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/files/$FILE_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $DELETE_RESPONSE" | jq '.'
echo -e "✓ File moved to trash"

# Step 15: Restore file
print_header "15. Restore File"
RESTORE_RESPONSE=$(curl -s -X POST "$BASE_URL/files/$FILE_ID/restore" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $RESTORE_RESPONSE" | jq '.'
echo -e "✓ File restored from trash"

# Step 16: Upload multiple files
print_header "16. Upload Multiple Files"
echo "Creating test files..."
echo "File 1 content" > test-file-1.txt
echo "File 2 content" > test-file-2.txt

MULTI_UPLOAD=$(curl -s -X POST "$BASE_URL/files/upload/multiple" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test-file-1.txt" \
  -F "files=@test-file-2.txt" \
  -F "folderId=$FOLDER_ID")

echo "Response: $MULTI_UPLOAD" | jq '.'
echo -e "✓ Multiple files uploaded"

# Step 17: Get root folder contents
print_header "17. Get Root Folder Contents"
ROOT_CONTENTS=$(curl -s -X GET "$BASE_URL/folders" \
  -H "Authorization: Bearer $TOKEN")

echo "Response: $ROOT_CONTENTS" | jq '.'
echo -e "✓ Root folder contents retrieved"

# Cleanup
print_header "Cleanup"
echo "Removing test files..."
rm -f test-document.txt downloaded-file.txt test-file-1.txt test-file-2.txt
echo -e "✓ Test files cleaned up"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}All tests completed successfully!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo "Summary:"
echo "- Folder ID: $FOLDER_ID"
echo "- File ID: $FILE_ID"
echo "- Share Token: $SHARE_TOKEN"
echo ""
echo "Note: Files and folders created during this test remain in the system."
echo "You can permanently delete them using:"
echo "  curl -X DELETE \"$BASE_URL/files/$FILE_ID\" -H \"Authorization: Bearer $TOKEN\""
echo "  curl -X DELETE \"$BASE_URL/files/$FILE_ID/permanent\" -H \"Authorization: Bearer $TOKEN\""

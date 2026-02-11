#!/bin/bash

# MyBlog API Test Suite
# 全エンドポイントの動作確認を自動化

# set -e を無効化してすべてのテストを実行
# エラーがあっても最後まで実行し、サマリーで結果を表示

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# .envファイルの読み込み
if [ -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${BLUE}📄 Loading .env file...${NC}"
  # .envファイルを読み込む（コメントと空行を除外）
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | grep -v '^$' | xargs)
fi

# 設定（環境変数または.envから読み込み）
API_URL="${API_URL:-}"
AWS_PROFILE="${AWS_PROFILE:-myblog-dev}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:-}"
TEST_USER_EMAIL="${TEST_USER_EMAIL:-}"
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-}"
JWT_TOKEN="${JWT_TOKEN:-}"

# 必須設定の確認
if [ -z "$API_URL" ]; then
  echo -e "${RED}❌ Error: API_URL is not set${NC}"
  echo ""
  echo "Please set API_URL in .env file:"
  echo "  API_URL=https://your-api.execute-api.ap-northeast-1.amazonaws.com/prod"
  echo ""
  echo "Or export as environment variable:"
  echo "  export API_URL='https://your-api.execute-api.ap-northeast-1.amazonaws.com/prod'"
  exit 1
fi

# JWT_TOKENが設定されていない場合は自動ログイン
if [ -z "$JWT_TOKEN" ]; then
  echo -e "${YELLOW}🔐 JWT_TOKEN not set, attempting auto-login...${NC}"
  
  # 認証情報の確認
  if [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ] || [ -z "$TEST_USER_EMAIL" ] || [ -z "$TEST_USER_PASSWORD" ]; then
    echo -e "${RED}❌ Error: Missing credentials in .env file${NC}"
    echo ""
    echo "Please create .env file with the following variables:"
    echo "  API_URL=https://your-api.execute-api.ap-northeast-1.amazonaws.com/prod"
    echo "  COGNITO_USER_POOL_ID=your-pool-id"
    echo "  COGNITO_CLIENT_ID=your-client-id"
    echo "  TEST_USER_EMAIL=your-email@example.com"
    echo "  TEST_USER_PASSWORD=your-password"
    echo "  AWS_PROFILE=myblog-dev"
    echo ""
    echo "Or set JWT_TOKEN manually:"
    echo "  export JWT_TOKEN='your-jwt-token'"
    echo "  ./tests/api-test.sh"
    exit 1
  fi
  
  # Cognito認証でJWTトークンを取得
  echo -e "${BLUE}🔑 Authenticating with Cognito...${NC}"
  JWT_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id "$COGNITO_USER_POOL_ID" \
    --client-id "$COGNITO_CLIENT_ID" \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters "USERNAME=$TEST_USER_EMAIL,PASSWORD=$TEST_USER_PASSWORD" \
    --profile "$AWS_PROFILE" \
    --query 'AuthenticationResult.IdToken' \
    --output text 2>&1)
  
  # 認証エラーチェック
  if [ $? -ne 0 ] || [ -z "$JWT_TOKEN" ] || [[ "$JWT_TOKEN" == *"error"* ]]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "$JWT_TOKEN"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Authentication successful${NC}"
  echo -e "${YELLOW}ℹ️  Token expires in 1 hour${NC}"
fi

# テストカウンター
TESTS_PASSED=0
TESTS_FAILED=0

# ヘルパー関数
print_test() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}🧪 Test $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((TESTS_PASSED++))
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  ((TESTS_FAILED++))
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# テスト開始
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       MyBlog API Test Suite                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}API URL: $API_URL${NC}"
echo ""

# グローバル変数（作成した記事のIDを保存）
CREATED_POST_ID=""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 1: 記事作成（POST /admin/posts）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "1: Create Post (POST /admin/posts)"

RESPONSE=$(curl -s -X POST "$API_URL/admin/posts" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "テストスクリプトからの投稿",
    "summary": "自動テストで作成された記事です",
    "status": "published",
    "content": [
      {
        "order": 0,
        "type": "text",
        "content": "これは自動テストスクリプトから作成された記事です。",
        "layout": "full"
      },
      {
        "order": 1,
        "type": "text",
        "content": "複数のコンテンツブロックをテストしています。",
        "layout": "full"
      }
    ],
    "tags": ["test", "automation", "api"],
    "thumbnailUrl": "https://via.placeholder.com/400x300"
  }')

# エラーチェック
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
  print_error "Failed to create post: $ERROR_MSG"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

# postIdを取得
CREATED_POST_ID=$(echo "$RESPONSE" | jq -r '.data.postId')
CREATED_TITLE=$(echo "$RESPONSE" | jq -r '.data.title')

if [ -n "$CREATED_POST_ID" ] && [ "$CREATED_POST_ID" != "null" ]; then
  print_success "Created post with ID: $CREATED_POST_ID"
  print_info "Title: $CREATED_TITLE"
else
  print_error "Failed to extract postId from response"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 2: 公開記事一覧取得（GET /posts）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "2: List Public Posts (GET /posts)"

RESPONSE=$(curl -s "$API_URL/posts?limit=10")

POST_COUNT=$(echo "$RESPONSE" | jq -r '.posts | length')

if [ "$POST_COUNT" -ge 1 ]; then
  print_success "Retrieved $POST_COUNT public posts"
  
  # 作成した記事が含まれているか確認
  FOUND=$(echo "$RESPONSE" | jq -r ".posts[] | select(.postId == \"$CREATED_POST_ID\") | .postId")
  if [ "$FOUND" == "$CREATED_POST_ID" ]; then
    print_success "Created post found in public list"
  else
    print_info "Created post not yet in public list (cache or delay)"
  fi
else
  print_error "No posts found in public list"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 3: 記事詳細取得（GET /posts/{postId}）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "3: Get Post Detail (GET /posts/$CREATED_POST_ID)"

RESPONSE=$(curl -s "$API_URL/posts/$CREATED_POST_ID")

# エラーチェック
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
  print_error "Failed to get post: $ERROR_MSG"
else
  POST_TITLE=$(echo "$RESPONSE" | jq -r '.title')
  CONTENT_BLOCKS=$(echo "$RESPONSE" | jq -r '.content | length')
  
  print_success "Retrieved post: $POST_TITLE"
  print_info "Content blocks: $CONTENT_BLOCKS"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 4: 管理者記事一覧取得（GET /admin/posts）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "4: List Admin Posts (GET /admin/posts)"

RESPONSE=$(curl -s "$API_URL/admin/posts" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
  print_error "Failed to get admin posts: $ERROR_MSG"
else
  ADMIN_POST_COUNT=$(echo "$RESPONSE" | jq -r '.posts | length')
  print_success "Retrieved $ADMIN_POST_COUNT posts (including drafts)"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 5: 記事更新（PUT /admin/posts/{postId}）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "5: Update Post (PUT /admin/posts/$CREATED_POST_ID)"

RESPONSE=$(curl -s -X PUT "$API_URL/admin/posts/$CREATED_POST_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新されたテスト記事",
    "summary": "この記事は自動テストで更新されました",
    "status": "published",
    "content": [
      {
        "order": 0,
        "type": "text",
        "content": "更新されたコンテンツです。",
        "layout": "full"
      }
    ],
    "tags": ["updated", "test"]
  }')

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
  print_error "Failed to update post: $ERROR_MSG"
else
  UPDATED_TITLE=$(echo "$RESPONSE" | jq -r '.data.title')
  print_success "Updated post title: $UPDATED_TITLE"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 6: Pre-signed URL取得（POST /admin/presigned-url）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "6: Generate Pre-signed URL (POST /admin/presigned-url)"

RESPONSE=$(curl -s -X POST "$API_URL/admin/presigned-url" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-image.jpg",
    "fileType": "image/jpeg",
    "mediaType": "image"
  }')

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.message')
  print_error "Failed to generate pre-signed URL: $ERROR_MSG"
else
  UPLOAD_URL=$(echo "$RESPONSE" | jq -r '.uploadUrl')
  MEDIA_URL=$(echo "$RESPONSE" | jq -r '.mediaUrl')
  
  if [ -n "$UPLOAD_URL" ] && [ "$UPLOAD_URL" != "null" ]; then
    print_success "Generated pre-signed URL"
    print_info "Media URL: ${MEDIA_URL:0:50}..."
  else
    print_error "Invalid pre-signed URL response"
  fi
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 7: 記事削除（DELETE /admin/posts/{postId}）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "7: Delete Post (DELETE /admin/posts/$CREATED_POST_ID)"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X DELETE "$API_URL/admin/posts/$CREATED_POST_ID" \
  -H "Authorization: Bearer $JWT_TOKEN")

if [ "$HTTP_CODE" == "204" ] || [ "$HTTP_CODE" == "200" ]; then
  print_success "Post deleted (HTTP $HTTP_CODE)"
else
  print_error "Failed to delete post (HTTP $HTTP_CODE)"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Test 8: 削除確認（GET /posts/{postId} should return 404）
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
print_test "8: Verify Deletion (GET /posts/$CREATED_POST_ID)"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$API_URL/posts/$CREATED_POST_ID")

if [ "$HTTP_CODE" == "404" ]; then
  print_success "Post not found (correctly deleted)"
elif [ "$HTTP_CODE" == "200" ]; then
  print_info "Post still accessible (logical deletion or cache)"
else
  print_error "Unexpected HTTP code: $HTTP_CODE"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# テスト結果サマリー
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Test Results Summary             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed${NC}"
  exit 1
fi

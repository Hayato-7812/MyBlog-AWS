# テスト戦略ドキュメント

## 1. 概要

### 1.1 目的

本ドキュメントは、MyBlogプロジェクトにおけるテスト戦略を定義し、品質保証のためのアプローチを明確にすることを目的とする。

### 1.2 対象範囲

- バックエンドAPI（Lambda関数、API Gateway）
- データ層（DynamoDB）
- 認証・認可（Cognito）
- インフラストラクチャ（CDK）
- フロントエンド（将来実装）

---

## 2. テストレベルと戦略

### 2.1 テストピラミッド

```
        /\
       /  \
      / E2E \ ← 少数（高コスト、高価値）
     /------\
    /  統合  \ ← 中程度（中コスト、中価値）
   /----------\
  /  単体テスト  \ ← 多数（低コスト、高速）
 /--------------\
```

### 2.2 各テストレベルの定義

#### Level 1: 単体テスト（Unit Tests）

**対象:**
- Lambda関数の個別ロジック
- ユーティリティ関数
- バリデーション関数

**ツール:**
- Jest
- TypeScript

**実装場所:**
```
myblog-aws/lambda/*/handler.test.ts
myblog-aws/lambda/*/types.test.ts
```

**実行頻度:**
- コミット前
- プルリクエスト時
- CI/CDパイプライン

**カバレッジ目標:**
- コードカバレッジ: 80%以上
- 重要なビジネスロジック: 100%

#### Level 2: 統合テスト（Integration Tests）

**対象:**
- API エンドポイント（E2E API呼び出し）
- DynamoDB との連携
- Cognito 認証フロー
- S3 Pre-signed URL生成

**ツール:**
- シェルスクリプト (`tests/api-test.sh`)
- Newman (Postman CLI)
- Node.js + Axios

**実装場所:**
```
tests/api-test.sh
tests/integration/*.test.ts
```

**実行頻度:**
- デプロイ後
- 定期的（日次/週次）
- 本番リリース前

**カバレッジ目標:**
- 全APIエンドポイント: 100%
- 主要ユースケース: 100%

#### Level 3: E2Eテスト（End-to-End Tests）

**対象:**
- ユーザージャーニー全体
- フロントエンド + バックエンド
- ブラウザ自動化

**ツール:**
- Playwright
- Cypress

**実装場所:**
```
e2e/*.spec.ts
```

**実行頻度:**
- 本番リリース前
- 重要な機能追加後

**カバレッジ目標:**
- クリティカルユーザーフロー: 100%
- 一般的なユーザーフロー: 80%

---

## 3. 現在の実装状況

### 3.1 Phase 1: 統合テスト（現在）✅

**実装済み:**
- ✅ `tests/api-test.sh` - APIエンドポイント統合テスト
- ✅ 全8エンドポイントのテスト

**テストカバレッジ:**
```
✅ POST   /admin/posts              - 記事作成
✅ GET    /posts                    - 公開記事一覧
✅ GET    /posts/{postId}           - 記事詳細
✅ GET    /admin/posts              - 管理者記事一覧
✅ PUT    /admin/posts/{postId}     - 記事更新
✅ POST   /admin/presigned-url      - Pre-signed URL生成
✅ DELETE /admin/posts/{postId}     - 記事削除
✅ GET    /posts/{postId} (削除後)  - 削除確認
```

### 3.2 Phase 2: 単体テスト（未実装）⬜

**計画:**
- [ ] Lambda関数の単体テスト
- [ ] バリデーション関数のテスト
- [ ] DynamoDBクエリロジックのテスト

### 3.3 Phase 3: E2Eテスト（未実装）⬜

**計画:**
- [ ] フロントエンド実装後に着手
- [ ] Playwrightセットアップ
- [ ] クリティカルユーザーフローの自動化

---

## 4. テスト実行ガイド

### 4.1 統合テスト実行方法

#### 前提条件

```bash
# jq（JSONパーサー）のインストール
brew install jq  # macOS
sudo apt install jq  # Linux
```

#### セットアップ（初回のみ）

```bash
# 1. CDKデプロイ後、環境変数を自動同期
./scripts/sync-env.sh

# 自動的に.envファイルが生成され、以下が設定される:
# - API_URL
# - COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID
# - DYNAMODB_TABLE_NAME
# - MEDIA_BUCKET_NAME, MEDIA_CLOUDFRONT_DOMAIN
# - FRONTEND_BUCKET_NAME, FRONTEND_CLOUDFRONT_DOMAIN
# - AWS_REGION

# 2. テストユーザーのパスワードを.envに設定
vi .env
# TEST_USER_PASSWORD=YourSecurePassword123!

# 3. テストスクリプトに実行権限付与
chmod +x tests/api-test.sh
```

#### 実行（自動ログイン）

```bash
# シンプル実行（推奨）
# .envファイルから自動的に設定を読み込み、Cognito認証も自動実行
./tests/api-test.sh
```

**自動実行される処理:**
1. .envファイル読み込み
2. JWT_TOKENがない場合、Cognito自動ログイン
3. 全8エンドポイントのテスト実行
4. 記事作成 → 更新 → 削除の一連フロー

**JWT トークンの有効期限:**
- IDトークン: **1時間**
- アクセストークン: **1時間**
- リフレッシュトークン: **30日**

テストスクリプトは自動的にトークンの有効期限を表示します。

#### 手動JWT設定（オプション）

```bash
# 手動でJWTトークンを取得して使用する場合
export JWT_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id ap-northeast-1_aMvLFicqR \
  --client-id 1ppe419ddmqtl8hrerrbjeij37 \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=your-email@example.com,PASSWORD=YourPassword \
  --profile myblog-dev \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# テスト実行
./tests/api-test.sh

# カスタムAPI URLでのテスト
API_URL=https://custom-api.example.com/prod ./tests/api-test.sh
```

#### 出力例

```
╔════════════════════════════════════════════╗
║       MyBlog API Test Suite                ║
╚════════════════════════════════════════════╝

API URL: https://lrpjzr35ob.execute-api.ap-northeast-1.amazonaws.com/prod

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Test 1: Create Post (POST /admin/posts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Created post with ID: 01JBCD1234ABCD
ℹ️  Title: テストスクリプトからの投稿

...

╔════════════════════════════════════════════╗
║           Test Results Summary             ║
╚════════════════════════════════════════════╝

✅ Passed: 10
❌ Failed: 0

🎉 All tests passed!
```

### 4.2 単体テスト実行方法（将来実装）

```bash
# Lambda関数の単体テスト
cd myblog-aws/lambda/create-post
npm install
npm test

# すべてのLambda関数をテスト
cd myblog-aws
npm test
```

### 4.3 E2Eテスト実行方法（将来実装）

```bash
# Playwright セットアップ
npm install -D @playwright/test
npx playwright install

# E2Eテスト実行
npx playwright test

# ヘッドレスモードで実行
npx playwright test --headed

# 特定のブラウザでテスト
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

---

## 5. CI/CD統合

### 5.1 GitHub Actions ワークフロー

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # 単体テスト
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd myblog-aws
          npm install
      - name: Run unit tests
        run: npm test

  # 統合テスト（デプロイ後）
  integration-test:
    runs-on: ubuntu-latest
    needs: [deploy]  # デプロイ後に実行
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-1
      
      - name: Get JWT Token
        id: auth
        run: |
          TOKEN=$(aws cognito-idp admin-initiate-auth \
            --user-pool-id ${{ secrets.USER_POOL_ID }} \
            --client-id ${{ secrets.CLIENT_ID }} \
            --auth-flow ADMIN_NO_SRP_AUTH \
            --auth-parameters USERNAME=${{ secrets.TEST_USER }},PASSWORD=${{ secrets.TEST_PASSWORD }} \
            --query 'AuthenticationResult.IdToken' \
            --output text)
          echo "::add-mask::$TOKEN"
          echo "token=$TOKEN" >> $GITHUB_OUTPUT
      
      - name: Run API integration tests
        env:
          JWT_TOKEN: ${{ steps.auth.outputs.token }}
          API_URL: ${{ secrets.API_URL }}
        run: |
          chmod +x tests/api-test.sh
          ./tests/api-test.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/

  # E2Eテスト
  e2e-test:
    runs-on: ubuntu-latest
    needs: [deploy]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install Playwright
        run: |
          npm install -D @playwright/test
          npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.2 デプロイ前ゲート

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    uses: ./.github/workflows/test.yml
  
  deploy:
    needs: [test]  # テストが成功した場合のみデプロイ
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: npx cdk deploy --all --require-approval never
```

---

## 6. テストデータ管理

### 6.1 テスト用データの準備

#### DynamoDBテストデータ

```bash
# テストデータ投入スクリプト
cat > tests/seed-data.sh << 'EOF'
#!/bin/bash

TABLE_NAME="MyBlog-DataStack-MyBlogTable394864E0-13PY4G3B4TQLW"

# サンプル記事1
aws dynamodb put-item \
  --table-name $TABLE_NAME \
  --item '{
    "pk": {"S": "POST#sample-001"},
    "sk": {"S": "METADATA"},
    "postId": {"S": "sample-001"},
    "title": {"S": "サンプル記事1"},
    "summary": {"S": "テスト用のサンプル記事です"},
    "status": {"S": "published"},
    "createdAt": {"S": "2025-01-01T00:00:00Z"},
    "updatedAt": {"S": "2025-01-01T00:00:00Z"}
  }' \
  --profile myblog-dev

# サンプル記事2（下書き）
aws dynamodb put-item \
  --table-name $TABLE_NAME \
  --item '{
    "pk": {"S": "POST#sample-002"},
    "sk": {"S": "METADATA"},
    "postId": {"S": "sample-002"},
    "title": {"S": "サンプル記事2（下書き）"},
    "summary": {"S": "テスト用の下書き記事です"},
    "status": {"S": "draft"},
    "createdAt": {"S": "2025-01-02T00:00:00Z"},
    "updatedAt": {"S": "2025-01-02T00:00:00Z"}
  }' \
  --profile myblog-dev
EOF

chmod +x tests/seed-data.sh
```

### 6.2 テスト後のクリーンアップ

```bash
# テストデータ削除スクリプト
cat > tests/cleanup-data.sh << 'EOF'
#!/bin/bash

TABLE_NAME="MyBlog-DataStack-MyBlogTable394864E0-13PY4G3B4TQLW"

# tag=testのアイテムを削除
aws dynamodb scan \
  --table-name $TABLE_NAME \
  --filter-expression "contains(tags, :tag)" \
  --expression-attribute-values '{":tag":{"S":"test"}}' \
  --profile myblog-dev \
  | jq -r '.Items[] | .pk.S + " " + .sk.S' \
  | while read pk sk; do
      aws dynamodb delete-item \
        --table-name $TABLE_NAME \
        --key "{\"pk\":{\"S\":\"$pk\"},\"sk\":{\"S\":\"$sk\"}}" \
        --profile myblog-dev
    done
EOF

chmod +x tests/cleanup-data.sh
```

---

## 7. モニタリングとレポート

### 7.1 CloudWatch Logs確認

```bash
# Lambda関数のログ確認
aws logs tail /aws/lambda/MyBlog-AppStack-CreatePostFunction --follow --profile myblog-dev

# API Gatewayのログ確認
aws logs tail /aws/apigateway/MyBlog-AppStack --follow --profile myblog-dev
```

### 7.2 テストメトリクス

**追跡すべき指標:**
- テスト実行時間
- テスト成功率
- コードカバレッジ
- API レスポンスタイム
- エラー率

**ダッシュボード:**
- CloudWatch Dashboard
- GitHub Actions Summary
- Playwright Test Report

---

## 8. ベストプラクティス

### 8.1 テストコードの品質

**原則:**
1. **FIRST原則**
   - Fast: 高速
   - Independent: 独立
   - Repeatable: 再現可能
   - Self-validating: 自己検証
   - Timely: タイムリー

2. **AAA パターン**
   - Arrange: 準備
   - Act: 実行
   - Assert: 検証

3. **1テスト1検証**
   - 各テストは1つの概念のみを検証

### 8.2 テストの命名規則

```typescript
// Good
describe('createPost', () => {
  it('should validate required fields', () => { ... });
  it('should create post with valid data', () => { ... });
  it('should reject post without title', () => { ... });
});

// Bad
describe('Tests', () => {
  it('test1', () => { ... });
  it('test2', () => { ... });
});
```

### 8.3 テスト環境の分離

**環境:**
- Development: 開発者ローカル
- Testing: CI/CD自動テスト
- Staging: リリース前検証
- Production: 本番環境

**分離方法:**
- CDK Contextによる環境切り替え
- 環境変数による設定
- 専用のAWSアカウント（オプション）

---

## 9. 今後の改善計画

### 9.1 短期（1-2週間）

- [x] 統合テストスクリプト作成 ✅
- [ ] CI/CD パイプライン構築
- [ ] テストカバレッジレポート導入

### 9.2 中期（1-2ヶ月）

- [ ] Lambda単体テスト実装
- [ ] Postman Collectionエクスポート
- [ ] パフォーマンステスト導入
- [ ] セキュリティテスト（OWASP検証）

### 9.3 長期（3ヶ月以上）

- [ ] E2Eテスト自動化（Playwright）
- [ ] 負荷テスト（Gatling/K6）
- [ ] Chaos Engineering（AWS FIS）
- [ ] テストデータ自動生成ツール

---

## 10. 参考資料

### 10.1 ツール・フレームワーク

- **Jest**: https://jestjs.io/
- **Playwright**: https://playwright.dev/
- **Newman**: https://www.npmjs.com/package/newman
- **AWS Testing Best Practices**: https://docs.aws.amazon.com/wellarchitected/latest/framework/

### 10.2 関連ドキュメント

- `02-3-api-design.md` - API仕様
- `04-4-Lambda-implementation-guide.md` - Lambda実装ガイド
- `tests/api-test.sh` - 統合テストスクリプト
- `.github/workflows/` - CI/CDワークフロー（将来実装）

---

## 付録

### A. テストコマンド一覧

```bash
# 統合テスト
./tests/api-test.sh

# 単体テスト（将来）
npm test

# E2Eテスト（将来）
npx playwright test

# カバレッジレポート（将来）
npm run test:coverage

# テストデータ投入
./tests/seed-data.sh

# テストデータクリーンアップ
./tests/cleanup-data.sh
```

### B. トラブルシューティング

**問題: JWT_TOKENエラー**
```bash
# 解決策: トークンを再取得
aws cognito-idp admin-initiate-auth ...
```

**問題: jqコマンドが見つからない**
```bash
# 解決策: jqをインストール
brew install jq  # macOS
sudo apt install jq  # Linux
```

**問題: API Gatewayタイムアウト**
```bash
# 解決策: Lambda実行時間とAPI Gatewayタイムアウトを確認
# Lambda: 最大15分
# API Gateway: 最大29秒
```

---

**最終更新: 2026/02/11**
**バージョン: 1.0.0**

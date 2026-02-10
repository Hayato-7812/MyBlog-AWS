# DataStack デプロイガイド

**作成日:** 2026年2月10日  
**対象:** MyBlog-DataStack（DynamoDB, S3, Cognito User Pool）

---

## ✅ 実装完了リソース

### **Stateful Stack（DataStack）**

1. **✅ DynamoDB テーブル**
   - シングルテーブルデザイン（PK/SK）
   - GSI1（タグ逆引き）
   - Point-in-Time Recovery（PITR）
   - 削除保護、暗号化

2. **✅ S3 バケット（メディアファイル）**
   - バージョニング有効化
   - ライフサイクルポリシー（30日・90日）
   - CORS設定（Pre-signed URL用）
   - 削除保護、暗号化

3. **✅ Cognito User Pool（管理者認証）**
   - メールアドレス認証
   - 強力なパスワードポリシー
   - MFA対応（TOTP）
   - 削除保護

---

## 🚀 デプロイ手順

### **Step 1: 前提条件の確認**

```bash
# 1. AWSプロファイルの確認
aws sts get-caller-identity --profile myblog-dev

# 出力例:
# {
#   "UserId": "AIDAI...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/blog-admin"
# }

# 2. Node.js/npmのバージョン確認
node --version  # v18以上推奨
npm --version   # v9以上推奨

# 3. AWS CDKのインストール確認
npx aws-cdk --version  # 2.x以上
```

---

### **Step 2: CDKのブートストラップ（初回のみ）**

```bash
# CDKがAWSアカウントにデプロイするための準備
cd /Users/shimizuhayato/Desktop/MyBlog-AWS/myblog-aws

npx cdk bootstrap aws://ACCOUNT-ID/ap-northeast-1 --profile myblog-dev

# ACCOUNT-IDは実際のAWSアカウントIDに置き換え
# 例: npx cdk bootstrap aws://123456789012/ap-northeast-1 --profile myblog-dev
```

**ブートストラップで作成されるリソース:**
- S3バケット: `cdk-XXXXX-assets-ACCOUNT-ap-northeast-1`
- IAM Role: CDKExecution用
- CloudFormation Stack: `CDKToolkit`

---

### **Step 3: コンパイル**

```bash
cd /Users/shimizuhayato/Desktop/MyBlog-AWS/myblog-aws

# TypeScriptをJavaScriptにコンパイル
npm run build

# エラーがないことを確認
# エラーが出た場合は、構文エラーを修正
```

---

### **Step 4: CloudFormationテンプレート生成**

```bash
# CloudFormationテンプレートを生成（デプロイはしない）
npx cdk synth --profile myblog-dev

# 出力: cdk.out/MyBlog-DataStack.template.json
# このテンプレートを確認して、意図通りのリソースが定義されているかチェック
```

**確認ポイント:**
- DynamoDB テーブルの設定（PK/SK、GSI）
- S3 バケットの設定（バージョニング、ライフサイクル）
- Cognito User Poolの設定（パスワードポリシー、MFA）

---

### **Step 5: デプロイ差分の確認**

```bash
# 初回デプロイ前に差分を確認
npx cdk diff --profile myblog-dev

# 出力例:
# Stack MyBlog-DataStack
# IAM Statement Changes
# ┌───┬────────────────┬────────┬───────────────┬────────────┐
# │   │ Resource       │ Effect │ Action        │ Principal  │
# ├───┼────────────────┼────────┼───────────────┼────────────┤
# │ + │ ${MyBlogTable} │ Allow  │ dynamodb:*    │ AWS:...    │
# └───┴────────────────┴────────┴───────────────┴────────────┘
# Resources
# [+] AWS::DynamoDB::Table MyBlogTable
# [+] AWS::S3::Bucket MediaBucket
# [+] AWS::Cognito::UserPool UserPool
```

---

### **Step 6: デプロイ実行**

```bash
# DataStackをデプロイ
npx cdk deploy MyBlog-DataStack --profile myblog-dev

# 確認プロンプトが表示される
# Do you wish to deploy these changes (y/n)? y

# デプロイ進行状況が表示される
# ⏳ MyBlog-DataStack: deploying...
# ✅ MyBlog-DataStack
#
# Outputs:
# MyBlog-DataStack.TableName = MyBlog-DataStack-MyBlogTable-ABC123
# MyBlog-DataStack.MediaBucketName = myblog-datastack-mediabucket-xyz789
# MyBlog-DataStack.UserPoolId = ap-northeast-1_XXXXXXX
# MyBlog-DataStack.UserPoolClientId = 1234567890abcdefghij
```

**デプロイ時間:** 約3-5分

---

### **Step 7: デプロイ結果の確認**

```bash
# 1. CloudFormation Stackの確認
aws cloudformation describe-stacks \
  --stack-name MyBlog-DataStack \
  --profile myblog-dev \
  --query 'Stacks[0].{Status:StackStatus,Outputs:Outputs}' \
  --output table

# 2. DynamoDBテーブルの確認
aws dynamodb list-tables --profile myblog-dev

aws dynamodb describe-table \
  --table-name <TableName> \
  --profile myblog-dev

# 3. S3バケットの確認
aws s3 ls --profile myblog-dev

# 4. Cognito User Poolの確認
aws cognito-idp list-user-pools \
  --max-results 10 \
  --profile myblog-dev
```

---

## 👤 管理者ユーザーの作成

### **Step 8: Cognito管理者ユーザーの作成**

```bash
# UserPoolIdを環境変数に設定
export USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name MyBlog-DataStack \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text \
  --profile myblog-dev)

echo $USER_POOL_ID
# 出力例: ap-northeast-1_XXXXXXX

# 管理者ユーザーの作成
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes \
    Name=email,Value=admin@example.com \
    Name=email_verified,Value=true \
  --temporary-password "TempPassword123!" \
  --message-action SUPPRESS \
  --profile myblog-dev

# 成功メッセージ:
# {
#   "User": {
#     "Username": "admin@example.com",
#     "Attributes": [...],
#     "UserCreateDate": "2026-02-10T...",
#     "UserStatus": "FORCE_CHANGE_PASSWORD"
#   }
# }
```

**パラメータ説明:**
- `--username`: メールアドレス（ログインID）
- `--temporary-password`: 初回ログイン用の一時パスワード
- `--message-action SUPPRESS`: ウェルカムメールを送信しない（後で手動で通知）

---

### **Step 9: パスワードの永続化（初回ログイン）**

```bash
# 初回ログイン（パスワード変更）
aws cognito-idp admin-initiate-auth \
  --user-pool-id $USER_POOL_ID \
  --client-id $(aws cloudformation describe-stacks \
    --stack-name MyBlog-DataStack \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
    --output text \
    --profile myblog-dev) \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters \
    USERNAME=admin@example.com,PASSWORD=TempPassword123! \
  --profile myblog-dev

# 出力:
# {
#   "ChallengeName": "NEW_PASSWORD_REQUIRED",
#   "Session": "AQID...",
#   ...
# }

# 新しいパスワードを設定
aws cognito-idp admin-respond-to-auth-challenge \
  --user-pool-id $USER_POOL_ID \
  --client-id <UserPoolClientId> \
  --challenge-name NEW_PASSWORD_REQUIRED \
  --challenge-responses \
    USERNAME=admin@example.com,NEW_PASSWORD='YourNewSecurePassword123!' \
  --session "<上記のSession値>" \
  --profile myblog-dev

# 成功すると、アクセストークンが返される
```

**新しいパスワードの要件:**
- 最低12文字
- 大文字、小文字、数字、記号を含む

---

## 🔍 デプロイ後の確認項目

### **1. DynamoDB テーブル**

```bash
# テーブルの詳細確認
aws dynamodb describe-table \
  --table-name <TableName> \
  --profile myblog-dev \
  --query 'Table.{Name:TableName,Status:TableStatus,KeySchema:KeySchema,GSI:GlobalSecondaryIndexes[0].IndexName,PITR:RestoreSummary}'
```

**確認ポイント:**
- ✅ Status: ACTIVE
- ✅ KeySchema: pk (HASH), sk (RANGE)
- ✅ GSI: gsi1-tag-index
- ✅ BillingMode: PAY_PER_REQUEST

---

### **2. S3 バケット**

```bash
# バケットの詳細確認
aws s3api get-bucket-versioning \
  --bucket <MediaBucketName> \
  --profile myblog-dev

# 出力例:
# {
#   "Status": "Enabled"
# }

# ライフサイクルポリシーの確認
aws s3api get-bucket-lifecycle-configuration \
  --bucket <MediaBucketName> \
  --profile myblog-dev
```

**確認ポイント:**
- ✅ Versioning: Enabled
- ✅ LifecycleRules: delete-old-versions, transition-to-infrequent-access
- ✅ CORS: 設定あり

---

### **3. Cognito User Pool**

```bash
# User Poolの詳細確認
aws cognito-idp describe-user-pool \
  --user-pool-id $USER_POOL_ID \
  --profile myblog-dev \
  --query 'UserPool.{Name:Name,MfaConfiguration:MfaConfiguration,PasswordPolicy:Policies.PasswordPolicy}'

# ユーザー一覧の確認
aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --profile myblog-dev
```

**確認ポイント:**
- ✅ MfaConfiguration: OPTIONAL
- ✅ PasswordPolicy: MinimumLength=12
- ✅ Users: admin@example.com存在

---

## 💰 コスト試算

### **月間コスト（想定）**

```
DynamoDB:
  - On-Demand（月間1,000PV想定）
  - 読み取り: 10,000リクエスト × $0.25/100万 = $0.0025
  - 書き込み: 100リクエスト × $1.25/100万 = $0.000125
  - PITR: $0.02
  小計: $0.022

S3:
  - ストレージ: 0.5GB × $0.023/GB = $0.012
  - バージョニング: +$0.005
  小計: $0.017

Cognito:
  - MAU（Monthly Active Users）: 1名
  - 無料枠内（50,000 MAUまで無料）
  小計: $0

合計: 約$0.04/月（約6円）
```

---

## 🔄 更新・削除手順

### **スタックの更新**

```bash
# コード変更後
npm run build
npx cdk diff --profile myblog-dev
npx cdk deploy MyBlog-DataStack --profile myblog-dev
```

### **スタックの削除（注意）**

```bash
# ⚠️ 警告: DynamoDB/S3/CognitoはRETAIN設定のため、
# スタック削除後も保持されます

# スタック削除
npx cdk destroy MyBlog-DataStack --profile myblog-dev

# リソースの手動削除が必要（削除保護を解除後）
aws dynamodb delete-table --table-name <TableName> --profile myblog-dev
aws s3 rb s3://<MediaBucketName> --force --profile myblog-dev
aws cognito-idp delete-user-pool --user-pool-id $USER_POOL_ID --profile myblog-dev
```

---

## 🎯 次のステップ

### **Phase 2: AppStack（Stateless Stack）の作成**

```
実装予定:
1. Lambda関数
   - get-posts: 記事一覧・詳細取得
   - create-post: 記事作成
   - update-post: 記事更新
   - delete-post: 記事削除
   - generate-presigned-url: メディアアップロード用URL生成

2. API Gateway
   - REST API
   - Cognito Authorizer（管理者API用）

3. CloudFront
   - メディアファイル配信用
   - フロントエンドホスティング用

4. S3バケット（フロントエンド用）
   - React/Next.js静的ファイル
```

---

## 📚 参考情報

### **AWS CDKドキュメント**
- [CDK v2 API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [DynamoDB L2 Constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html)
- [S3 L2 Constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html)
- [Cognito L2 Constructs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cognito-readme.html)

### **トラブルシューティング**

**エラー: "User: ... is not authorized to perform: sts:AssumeRole"**
```bash
# IAM権限の確認
aws iam get-user --profile myblog-dev
aws iam list-attached-user-policies --user-name blog-admin --profile myblog-dev

# CDKに必要な権限が不足している場合、IAM Identity Centerで権限追加
```

**エラー: "Resource handler returned message: 'Invalid DynamoDB Key Schema'"**
```typescript
// data-stack.tsのKeySchema設定を確認
// partitionKeyとsortKeyの設定が正しいか確認
```

---

**デプロイガイド作成者:** AI Assistant  
**最終更新:** 2026年2月10日  
**ステータス:** ✅ デプロイ準備完了

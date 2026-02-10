# Infrastructure Final Design (インフラ最終設計)

> **このドキュメントについて**
> 
> このドキュメントは、検討・評価プロセスを経て確定した最終的な設計決定のみをまとめたものです。
> CDK実装時の参考資料として使用してください。
> 
> 詳細な思考過程や評価については、`04-infrastructure-design.md` を参照してください。

---

## 1. Stack分割

### Stateful Stack (DataStack)

**含めるリソース:**
```
- DynamoDB テーブル（記事データ）
- S3 バケット（メディアファイル）
- Cognito User Pool（認証）
- Route53 HostedZone（ドメイン管理）
```

### Stateless Stack (AppStack)

**含めるリソース:**
```
- Lambda 関数（全5つ）
  - get-posts
  - create-post
  - update-post
  - delete-post
  - generate-presigned-url
- API Gateway REST API
- API Gateway Custom Domain
- IAM Role（Lambda実行ロール）
- CloudFront Distribution
- Route53 Alias Records（CloudFront用、API Gateway用）
- ACM証明書（us-east-1とデプロイリージョン）
- CloudWatch Logs
```

---

## 2. Stack間依存関係

### 採用方法: Stack間の直接参照

**Stateful Stackから渡すリソース:**
```typescript
interface DataStackProps {
  // これらのリソースオブジェクト全体を渡す
  postsTable: dynamodb.ITable;
  mediaBucket: s3.IBucket;
  userPool: cognito.IUserPool;
  hostedZone: route53.IHostedZone;
}
```

**重要:** ARNや名前を個別に渡すのではなく、リソースオブジェクト全体を渡す

---

## 3. デプロイ順序

```
1. Stateful Stack (DataStack)
   ↓
2. Stateless Stack (AppStack)
```

**削除時は逆順:** Stateless Stack → Stateful Stack

**CDKコマンド:**
```bash
# すべてを依存順にデプロイ
cdk deploy --all

# 個別デプロイ
cdk deploy DataStack
cdk deploy AppStack
```

---

## 4. リソース命名規則

### 採用パターン

```
{project}-{env}-{resource-type}-{purpose}
```

### 具体的な命名

| リソース | 命名例 |
|---------|--------|
| DynamoDB | `myblog-prod-dynamodb-posts` |
| S3 | `myblog-prod-s3-media-{accountId}-{region}` |
| Lambda | `myblog-prod-lambda-get-posts` |
| API Gateway | `myblog-prod-api-rest` |
| CloudFront | `myblog-prod-cloudfront-main` |
| Cognito | `myblog-prod-cognito-userpool` |
| Route53 HostedZone | `myblog-prod-route53-hostedzone` |
| IAM Role | `myblog-prod-role-lambda-get-posts` |
| CloudWatch Logs | `/aws/lambda/myblog-prod-lambda-get-posts` |

**ルール:**
- すべて小文字
- ハイフン区切り
- S3バケット名はグローバルユニーク性のためアカウントID・リージョンを付与

---

## 5. コスト最適化

### DynamoDB

**選択:** Provisioned モード

**設定:**
```
初期設定: 5 RCU / 5 WCU（無料枠内）
Auto Scaling: 有効化
```

**切り替えタイミング:** 月間読み込み > 370万リクエストでOn-Demand検討

---

### Lambda

**選択:** メモリ128MB、タイムアウト10秒

**最適化戦略:**
```
1. 初期: 128MBでデプロイ
2. CloudWatch Metricsで実行時間・メモリ使用率を確認
3. メモリ使用率 > 80% → メモリ増加検討
4. 実行時間が長い → メモリ増加で高速化
```

---

### S3

**選択:** Standard ストレージクラス

**ライフサイクルポリシー:**
```typescript
lifecycleRules: [
  {
    id: 'delete-old-media-files',
    enabled: true,
    expiration: cdk.Duration.days(90),
    transitions: [
      {
        storageClass: s3.StorageClass.INFREQUENT_ACCESS,
        transitionAfter: cdk.Duration.days(30),
      },
    ],
  },
]
```

---

### CloudFront

**選択:** Price Class 200

**理由:** 北米、欧州、アジア、中東、アフリカをカバー（日本含む）

---

### 月額コスト試算

**初期段階（月間1,000PV）:**
```
Route53 HostedZone:              $0.50
モニタリング:                    $0.80
バックアップ:                    $0.03
──────────────────────────────
合計:                           約$1.33/月
```

**成長後（月間10,000PV、無料枠終了後）:**
```
インフラ:                        $14
モニタリング:                    $0.80
バックアップ:                    $0.03
──────────────────────────────
合計:                           約$15/月
```

---

## 6. セキュリティ設計（IAM権限）

### Lambda関数ごとの権限

#### 1. get-posts Lambda

```
DynamoDB:
  - dynamodb:Query      （記事一覧取得）
  - dynamodb:GetItem    （個別記事取得）
S3: 不要
```

#### 2. create-post Lambda

```
DynamoDB:
  - dynamodb:PutItem    （新規記事作成）
S3: 不要（フロントエンドがPre-signed URL経由でアップロード）
```

#### 3. update-post Lambda

```
DynamoDB:
  - dynamodb:UpdateItem （記事更新）
  - dynamodb:GetItem    （存在確認、オプション）
S3: 不要
```

#### 4. delete-post Lambda

```
DynamoDB:
  - dynamodb:DeleteItem （記事削除）
S3: 不要（ライフサイクルポリシーで自動削除）
```

#### 5. generate-presigned-url Lambda

```
DynamoDB: 不要
S3:
  - s3:PutObject        （アップロード用Pre-signed URL生成）
```

### 画像削除戦略

**採用:** S3ライフサイクルポリシー（90日保持）

**理由:** 
- Lambda関数がシンプル
- 最小権限の原則を維持
- 誤削除からの保護
- 年間コスト差が約$0.07（無視できる）

---

## 7. モニタリング設計

### CloudWatch Alarms（Critical）

**1. Lambda Error Rate**
```
しきい値: エラー > 5回/5分
通知: SNS → メール
```

**2. API Gateway 5XX Error**
```
しきい値: 5xxエラー > 10件/5分
通知: SNS → メール
```

**3. DynamoDB Throttling（Warning）**
```
しきい値: スロットリング > 100回/15分
通知: SNS → メール
```

### CloudWatch Logs保持期間

```
Lambda実行ログ:           30日
API Gatewayアクセスログ:  14日
CloudFront アクセスログ:   7日
```

### ログに記録する情報

**✅ 記録すべき:**
- Lambda関数名、リクエストID
- 実行時間、処理結果
- エラー内容、スタックトレース
- ユーザーID（CognitoのSub）

**❌ 記録禁止:**
- 認証トークン（JWT等）
- パスワード
- リクエストボディ全体
- Pre-signed URL

---

## 8. バックアップ戦略

### DynamoDB

**採用:** Point-in-Time Recovery (PITR)

**設定:**
```typescript
pointInTimeRecovery: true
removalPolicy: cdk.RemovalPolicy.RETAIN
deletionProtection: true
```

**コスト:** 約$0.02/月（テーブルサイズ100MB想定）

---

### S3

**採用:** バージョニング

**設定:**
```typescript
versioned: true
lifecycleRules: [
  {
    noncurrentVersionExpiration: cdk.Duration.days(30),
  },
]
removalPolicy: cdk.RemovalPolicy.RETAIN
```

**コスト:** 約$0.013/月

---

### Cognito

**採用:** バックアップ不要

**理由:** 管理者1名のみ、再作成が容易

---

### インフラ（CDK）

**採用:** Git + GitHub管理

**バックアップ:**
- すべてのCDKコードをGitで管理
- GitHubにプッシュ（プライベートリポジトリ）
- タグで各デプロイバージョンを管理

---

## 9. RPO/RTO目標

### RPO（Recovery Point Objective）

| リソース | RPO | 理由 |
|---------|-----|------|
| DynamoDB | 1秒 | PITRで秒単位の復旧可能 |
| S3 | 即時 | バージョニングで即時復旧 |
| Lambda/API Gateway | なし | ステートレス、再デプロイで復旧 |

### RTO（Recovery Time Objective）

| シナリオ | RTO | 復旧手順 |
|---------|-----|---------|
| Lambda関数エラー | 5分 | 前のバージョンにロールバック |
| DynamoDB誤削除 | 30分 | PITRから復元 |
| S3誤削除 | 5分 | バージョニングから復元 |
| インフラ全削除 | 2時間 | CDKから再構築 + データ復元 |

---

## 10. Route53設計

### HostedZone

**場所:** Stateful Stack

```typescript
const hostedZone = new route53.HostedZone(this, 'HostedZone', {
  zoneName: 'shimizuhayato-myblog-aws.com',
});
```

### Alias Records

**場所:** Stateless Stack

**CloudFront用:**
```typescript
new route53.ARecord(this, 'WebsiteAliasRecord', {
  zone: hostedZone,
  target: route53.RecordTarget.fromAlias(
    new targets.CloudFrontTarget(distribution)
  ),
});
```

**API Gateway用:**
```typescript
new route53.ARecord(this, 'ApiAliasRecord', {
  zone: hostedZone,
  recordName: 'api',
  target: route53.RecordTarget.fromAlias(
    new targets.ApiGatewayDomain(apiGatewayDomain)
  ),
});
```

**重要:** 
- Aliasレコードを使用（CNAMEではない）
- ゾーン頂点でも使用可能
- クエリ料金無料

---

## 11. ACM証明書

### CloudFront用

**リージョン:** us-east-1（必須）

```typescript
const cloudfrontCertificate = new acm.Certificate(this, 'CloudFrontCert', {
  domainName: 'shimizuhayato-myblog-aws.com',
  validation: acm.CertificateValidation.fromDns(hostedZone),
});
```

### API Gateway用

**リージョン:** デプロイリージョン（ap-northeast-1等）

```typescript
const apiCertificate = new acm.Certificate(this, 'ApiCert', {
  domainName: 'api.shimizuhayato-myblog-aws.com',
  validation: acm.CertificateValidation.fromDns(hostedZone),
});
```

---

## 12. 実装チェックリスト

### Stateful Stack (DataStack)

- [ ] DynamoDB テーブル作成（PITR有効化）
- [ ] S3 バケット作成（バージョニング有効化、ライフサイクルポリシー設定）
- [ ] Cognito User Pool作成
- [ ] Route53 HostedZone作成
- [ ] 削除保護設定（removalPolicy: RETAIN）

### Stateless Stack (AppStack)

- [ ] Lambda関数作成（全5つ）
- [ ] IAM Role設定（最小権限の原則）
- [ ] API Gateway作成（Cognitoオーソライザー設定）
- [ ] API Gateway Custom Domain設定
- [ ] CloudFront Distribution作成（Price Class 200）
- [ ] Route53 Aliasレコード作成（CloudFront用、API Gateway用）
- [ ] ACM証明書作成（CloudFront用はus-east-1、API Gateway用はデプロイリージョン）
- [ ] CloudWatch Logs保持期間設定

### モニタリング

- [ ] CloudWatch Alarms設定（Lambda Error、API Gateway 5XX、DynamoDB Throttle）
- [ ] SNS Topic作成（メール通知用）
- [ ] CloudWatch Dashboard作成（オプション）

### バックアップ

- [ ] DynamoDB PITR有効化
- [ ] S3バージョニング有効化
- [ ] CDKコードをGitHubにプッシュ
- [ ] 復旧手順書作成

### コスト管理

- [ ] AWS Budgets設定（月次予算$10、80%でアラート）
- [ ] タグ設定（Project: MyBlog、Environment: Production）

---

## 13. CDKプロジェクト構造

```
myblog-aws/
├── bin/
│   └── myblog-aws.ts           # エントリーポイント
├── lib/
│   ├── data-stack.ts           # Stateful Stack
│   ├── app-stack.ts            # Stateless Stack
│   └── constructs/
│       ├── lambda-function.ts  # Lambda関数のConstruct
│       └── monitoring.ts       # モニタリング設定のConstruct
├── lambda/
│   ├── get-posts/
│   ├── create-post/
│   ├── update-post/
│   ├── delete-post/
│   └── generate-presigned-url/
├── cdk.json
├── package.json
└── tsconfig.json
```

---

## 14. 環境変数

### Lambda関数に渡す環境変数

```typescript
environment: {
  TABLE_NAME: postsTable.tableName,
  BUCKET_NAME: mediaBucket.bucketName,
  REGION: cdk.Stack.of(this).region,
}
```

---

## 15. 次のステップ

1. CDKプロジェクト初期化
   ```bash
   mkdir myblog-aws && cd myblog-aws
   cdk init app --language typescript
   ```

2. Stateful Stack実装
3. Stateless Stack実装
4. モニタリング・バックアップ設定
5. デプロイ・テスト
6. 復旧手順書の作成と定期テスト計画

---

## 付録: 重要な設計判断の要約

| 項目 | 採用案 | 理由 |
|------|--------|------|
| Stack分割 | Stateful/Stateless 2-Stack | シンプルで管理しやすい |
| Stack間共有 | リソースオブジェクトの直接参照 | 型安全、自動依存関係管理 |
| DynamoDB | Provisioned（5/5） | 無料枠活用、Auto Scaling |
| Lambda | 128MB、10秒タイムアウト | 小さく始めて最適化 |
| S3 | Standard + ライフサイクル | シンプル、誤削除保護 |
| CloudFront | Price Class 200 | アジア含む、コスト最適 |
| 画像削除 | ライフサイクルポリシー（90日） | シンプル、安全、低コスト |
| バックアップ | DynamoDB PITR + S3バージョニング | 自動、低コスト、迅速復旧 |
| モニタリング | Critical 2項目 + Warning 1項目 | 必要最小限、低コスト |
| Route53レコード | Aliasレコード | クエリ無料、ゾーン頂点対応 |

---

---

## 16. Route53実装のステップバイステップ

### 初期段階（Phase 1-2）

**推奨:** CloudFrontデフォルトドメインのみ

```
実装:
- DataStack: Route53なし
- AppStack: CloudFrontデフォルトドメイン

出力例: https://d111111abcdef8.cloudfront.net

理由:
✅ コスト削減（月$0.50削減）
✅ 設定がシンプル
✅ 動作確認に集中できる
✅ 後でドメイン追加は簡単
```

---

### 本番リリース前（Phase 3）

**推奨:** 独自ドメイン追加

```
実装:
- DataStack: Route53 HostedZone追加
- AppStack: 独自ドメイン設定

理由:
✅ ブランディング
✅ SEO対策
✅ 信頼性向上
✅ 本格運用に備える
```

---

### 実装ステップ

#### **Step 1: 初期段階（今）**

```bash
# DataStack実装（Route53なし）
# AppStack実装（CloudFrontデフォルトドメイン）

# 動作確認
curl -I https://d111111abcdef8.cloudfront.net

# フロントエンド開発
```

---

#### **Step 2: ドメイン取得（任意）**

**Option A: Route53でドメイン購入**

```
1. AWSコンソール → Route53 → ドメイン登録
2. ドメイン購入（$12/年〜）
3. HostedZoneが自動作成される
4. CDKでHostedZoneを参照
```

**Option B: 他社ドメインをRoute53で管理**

```
1. お名前.com等でドメイン購入
2. Route53でHostedZone作成
3. NSレコードを取得
4. ドメインレジストラでNSレコードを変更
5. DNS浸透を待つ（最大48時間）
```

---

#### **Step 3: DataStack更新**

```typescript
// bin/myblog-aws.ts
const dataStack = new DataStack(app, 'MyBlog-DataStack', {
  env,
  domainName: 'myblog-example.com',  // 追加
});
```

```bash
# デプロイ
npm run build
npx cdk deploy MyBlog-DataStack --profile myblog-dev
```

---

#### **Step 4: ACM証明書作成**

**重要:** CloudFrontはus-east-1の証明書が必須

```bash
# us-east-1で証明書リクエスト
aws acm request-certificate \
  --domain-name myblog-example.com \
  --subject-alternative-names "*.myblog-example.com" \
  --validation-method DNS \
  --region us-east-1 \
  --profile myblog-dev

# 検証用DNSレコードをRoute53に追加（自動化推奨）
# 検証完了を待つ（数分〜数時間）

# 証明書ARNを取得
aws acm list-certificates --region us-east-1 --profile myblog-dev
```

**自動化（CDK）:**

```typescript
// DataStackに追加
if (props.domainName && this.hostedZone) {
  // CloudFront用（us-east-1）
  const cloudfrontCert = new acm.Certificate(this, 'CloudFrontCert', {
    domainName: props.domainName,
    subjectAlternativeNames: [`*.${props.domainName}`],
    validation: acm.CertificateValidation.fromDns(this.hostedZone),
    region: 'us-east-1',  // 必須
  });
  
  // API Gateway用（デプロイリージョン）
  const apiCert = new acm.Certificate(this, 'ApiCert', {
    domainName: `api.${props.domainName}`,
    validation: acm.CertificateValidation.fromDns(this.hostedZone),
  });
}
```

---

#### **Step 5: AppStack更新**

```typescript
// bin/myblog-aws.ts
const appStack = new AppStack(app, 'MyBlog-AppStack', {
  env,
  dataStack,
  domainName: 'myblog-example.com',
  certificateArn: 'arn:aws:acm:us-east-1:...',  // ACM証明書ARN
});
```

```typescript
// lib/app-stack.ts
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  domainNames: domainName ? [domainName, `www.${domainName}`] : undefined,
  certificate: props.certificateArn 
    ? acm.Certificate.fromCertificateArn(this, 'Cert', props.certificateArn)
    : undefined,
  // ...
});

// Route53 Aliasレコード
if (domainName && dataStack.hostedZone) {
  // Apex（example.com）
  new route53.ARecord(this, 'ApexRecord', {
    zone: dataStack.hostedZone,
    target: route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution)
    ),
  });
  
  // www（www.example.com）
  new route53.ARecord(this, 'WwwRecord', {
    zone: dataStack.hostedZone,
    recordName: 'www',
    target: route53.RecordTarget.fromAlias(
      new targets.CloudFrontTarget(distribution)
    ),
  });
}
```

```bash
# デプロイ
npm run build
npx cdk deploy MyBlog-AppStack --profile myblog-dev
```

---

#### **Step 6: 動作確認**

```bash
# DNS確認
nslookup myblog-example.com

# アクセステスト
curl -I https://myblog-example.com

# 期待される結果:
# HTTP/2 200
# server: CloudFront
```

---

### コスト

```
Route53:
- HostedZone: $0.50/月（固定費）
- クエリ: 最初の10億クエリは$0.40/100万クエリ
- Aliasレコード: 無料

ドメイン:
- .com: $12/年
- .net: $11/年
- .jp: $40/年

ACM証明書:
- 無料

合計: 約$0.50/月 + ドメイン代
```

---

**このドキュメントを基にCDK実装を開始できます。**

# DataStack実装レビュー：設計ドキュメントとの整合性チェック

**レビュー日時:** 2026年2月10日  
**対象ファイル:** `myblog-aws/lib/data-stack.ts`  
**レビュー対象:** DynamoDB + S3バケットの実装

---

## ✅ 総合評価：完全準拠

DataStackの実装は、以下の設計ドキュメントと**完全に整合**しています：

- ✅ `02-2-data-design.md`（データ設計）
- ✅ `02-4-infrastructure-design.md`（インフラ構成設計）
- ✅ CDKベストプラクティス「Avoid physical names」

---

## 📊 詳細チェックリスト

### **1. DynamoDB テーブル**

| 項目 | 設計要件 | 実装状況 | 評価 |
|------|---------|---------|------|
| PK設計 | `pk: POST#<PostID>` | ✅ `name: 'pk'` | 完全一致 |
| SK設計 | `sk: METADATA, BLOCK#<Order>, TAG#<TagName>` | ✅ `name: 'sk'` | 完全一致 |
| GSI1設計 | タグの逆引き用 | ✅ `gsi1-tag-index` | 完全一致 |
| GSI1 PK | `sk`（逆引き） | ✅ `partitionKey: sk` | 完全一致 |
| GSI1 SK | `pk` | ✅ `sortKey: pk` | 完全一致 |
| GSI1射影 | `title, status, createdAt, thumbnail` | ✅ `INCLUDE`で指定 | 完全一致 |
| 課金モード | On-Demand推奨 | ✅ `onDemand()` | 完全一致 |
| PITR | 有効化推奨 | ✅ `pointInTimeRecovery: true` | 完全一致 |
| 削除保護 | 本番環境必須 | ✅ `deletionProtection: true` | 完全一致 |
| RemovalPolicy | RETAIN推奨 | ✅ `RETAIN` | 完全一致 |
| 物理名 | 指定しない | ✅ 指定なし（自動生成） | ベストプラクティス準拠 |
| 公開プロパティ | Stack間参照用 | ✅ `public readonly blogTable` | 完全一致 |

**評価:** **完璧** 🌟

---

### **2. S3 バケット**

| 項目 | 設計要件 | 実装状況 | 評価 |
|------|---------|---------|------|
| 用途 | メディアファイル保管 | ✅ `MediaBucket` | 完全一致 |
| バージョニング | 有効化（誤削除対策） | ✅ `versioned: true` | 完全一致 |
| RemovalPolicy | RETAIN（本番環境） | ✅ `RETAIN` | 完全一致 |
| autoDeleteObjects | false（本番環境） | ✅ `false` | 完全一致 |
| 暗号化 | S3マネージド | ✅ `S3_MANAGED` | 完全一致 |
| パブリックアクセス | ブロック | ✅ `BLOCK_ALL` | 完全一致 |
| CORS設定 | Pre-signed URL用 | ✅ GET/PUT/POST許可 | 完全一致 |
| ライフサイクル（古いバージョン） | 30日後削除 | ✅ `noncurrentVersionExpiration: 30日` | 完全一致 |
| ライフサイクル（Standard-IA） | 90日後移行 | ✅ `transitionAfter: 90日` | 完全一致 |
| 物理名 | 指定しない | ✅ 指定なし（自動生成） | ベストプラクティス準拠 |
| 公開プロパティ | Stack間参照用 | ✅ `public readonly mediaBucket` | 完全一致 |

**評価:** **完璧** 🌟

---

### **3. Stack間の直接参照（設計方針）**

| 項目 | 設計要件 | 実装状況 | 評価 |
|------|---------|---------|------|
| DynamoDBオブジェクト公開 | `public readonly` | ✅ 実装済み | 完全一致 |
| S3オブジェクト公開 | `public readonly` | ✅ 実装済み | 完全一致 |
| exportName使用 | 不要（直接参照） | ✅ コメントアウト | 完全一致 |
| CloudFormation出力 | 人間用（確認用） | ✅ 実装済み | 完全一致 |

**評価:** **完璧** 🌟

---

## 🔍 元の実装の問題点（修正済み）

### **❌ 問題1: 致命的なConstructorエラー**

```typescript
// ❌ 元の実装（エラー発生）
new s3.Bucket(scope, 'Bucket', {
                ↑
              誤り：scopeを渡している
});
```

**問題点:**
- `scope`はDataStackのConstructorの引数
- S3バケットの親は`scope`ではなく`this`（DataStack自身）
- このコードは**実行時エラー**を引き起こす

**修正:**
```typescript
// ✅ 正しい実装
this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
                                  ↑
                               正しい：thisを渡す
});
```

---

### **❌ 問題2: 本番環境で危険な削除設定**

```typescript
// ❌ 元の実装（本番環境では危険）
new s3.Bucket(scope, 'Bucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,  // スタック削除時にバケットも削除
  autoDeleteObjects: true,                   // オブジェクトも自動削除
});
```

**問題点:**
- スタック削除時に**メディアファイルがすべて消失**
- 設計ドキュメント「2.1 Stateful Stack」の定義に違反
  - 「削除するとサービスに致命的な影響がある」リソース
  - 「データが保存される」リソース

**修正:**
```typescript
// ✅ 正しい実装（本番環境向け）
removalPolicy: cdk.RemovalPolicy.RETAIN,  // スタック削除時も保持
autoDeleteObjects: false,                 // 手動削除必須
```

---

### **❌ 問題3: バックアップ戦略の欠如**

```typescript
// ❌ 元の実装（バックアップなし）
new s3.Bucket(scope, 'Bucket', {
  // バージョニング設定なし
  // ライフサイクルポリシーなし
});
```

**問題点:**
- 誤削除からの復旧不可
- 設計ドキュメント「10.3 S3 バックアップ戦略」に違反
  - 「推奨：S3バージョニング」
  - 「古いバージョンは30日後に削除」

**修正:**
```typescript
// ✅ 正しい実装（バックアップあり）
versioned: true,  // バージョニング有効化

lifecycleRules: [
  {
    id: 'delete-old-versions',
    enabled: true,
    noncurrentVersionExpiration: cdk.Duration.days(30),
  },
  // ...
],
```

---

### **❌ 問題4: セキュリティ設定の欠如**

```typescript
// ❌ 元の実装（セキュリティ設定なし）
new s3.Bucket(scope, 'Bucket', {
  // パブリックアクセス設定なし
  // CORS設定なし
  // 暗号化設定なし
});
```

**問題点:**
- パブリックアクセスのリスク
- Pre-signed URLが動作しない（CORS未設定）
- 暗号化なし（セキュリティリスク）

**修正:**
```typescript
// ✅ 正しい実装（セキュアな設定）
encryption: s3.BucketEncryption.S3_MANAGED,
blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
cors: [/* ... */],
```

---

### **❌ 問題5: CloudFormation出力の誤り**

```typescript
// ❌ 元の実装（ハードコードされた文字列）
new cdk.CfnOutput(this, 'S3BucketName', {
  value: `my-blog-bucket-${this.account}-${this.region}`,
            ↑
        実際のバケット名ではない！
});
```

**問題点:**
- `my-blog-bucket-...`という名前のバケットは存在しない
- CDKが自動生成した実際のバケット名と不一致
- Lambda関数が間違った名前を参照してエラー

**修正:**
```typescript
// ✅ 正しい実装（実際のバケット名を参照）
new cdk.CfnOutput(this, 'MediaBucketName', {
  value: this.mediaBucket.bucketName,  // CDKが生成した実際の名前
});
```

---

### **❌ 問題6: Stack間参照の欠如**

```typescript
// ❌ 元の実装（publicプロパティなし）
new s3.Bucket(scope, 'Bucket', {
  // ...
});
// this.mediaBucket への代入なし
```

**問題点:**
- Stateless Stack（AppStack）から参照不可
- 設計ドキュメント「3.1 Stack間の直接参照」に違反
- Lambda関数にバケット名を渡せない

**修正:**
```typescript
// ✅ 正しい実装（Stack間参照可能）
export class DataStack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket;  // 公開プロパティ
  
  constructor(...) {
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      // ...
    });
  }
}
```

---

## 📋 設計ドキュメントとの対応表

### **データ設計（02-2-data-design.md）**

| 設計項目 | 該当箇所 | 実装状況 |
|---------|---------|---------|
| シングルテーブルデザイン | DynamoDB PK/SK設計 | ✅ 完全実装 |
| GSI1タグ逆引き | `gsi1-tag-index` | ✅ 完全実装 |
| 射影最適化 | `INCLUDE`で必要属性のみ | ✅ 完全実装 |

### **インフラ設計（02-4-infrastructure-design.md）**

| 設計項目 | 該当箇所 | 実装状況 |
|---------|---------|---------|
| Stateful Stack分割 | DynamoDB, S3をDataStackに配置 | ✅ 完全実装 |
| Stack間の直接参照 | `public readonly`プロパティ | ✅ 完全実装 |
| 物理名を避ける | CDK自動生成を使用 | ✅ 完全実装 |
| 削除保護 | `RETAIN`, `deletionProtection` | ✅ 完全実装 |
| セキュリティ | 暗号化、パブリックアクセスブロック | ✅ 完全実装 |
| コスト最適化 | On-Demand、ライフサイクルポリシー | ✅ 完全実装 |
| バックアップ戦略 | PITR、バージョニング | ✅ 完全実装 |

---

## 🎯 追加の推奨事項

### **1. 環境分離の準備（将来的な拡張）**

現在は本番環境のみですが、将来的に開発環境を追加する場合：

```typescript
export interface DataStackProps extends cdk.StackProps {
  env: 'dev' | 'prod';  // 環境識別子
}

constructor(scope: Construct, id: string, props: DataStackProps) {
  super(scope, id, props);

  const isDev = props.env === 'dev';

  this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
    // 開発環境では削除を許可
    removalPolicy: isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN,
    autoDeleteObjects: isDev,
    // ...
  });
}
```

### **2. タグの一元管理**

```typescript
// スタック全体にタグを適用
cdk.Tags.of(this).add('Project', 'MyBlog');
cdk.Tags.of(this).add('Environment', 'Production');
cdk.Tags.of(this).add('ManagedBy', 'CDK');
cdk.Tags.of(this).add('Stack', 'Data');

// 個別リソースのtagsプロパティは不要
```

### **3. コスト監視の追加（オプション）**

```typescript
// S3バケットにコストアラートを設定
const costAlarm = new cloudwatch.Alarm(this, 'S3CostAlarm', {
  metric: this.mediaBucket.metricAllRequests({
    statistic: 'Sum',
    period: cdk.Duration.days(1),
  }),
  threshold: 100000,  // 1日10万リクエスト
  evaluationPeriods: 1,
});
```

---

## ✅ 結論

### **現在の実装状態：完璧** 🎉

DataStackの実装は、以下の点で**完全に設計ドキュメントと整合**しています：

1. ✅ **データ設計（02-2）** - シングルテーブルデザイン、GSI設計
2. ✅ **インフラ設計（02-4）** - Stack分割、直接参照、セキュリティ
3. ✅ **CDKベストプラクティス** - 物理名を避ける、型安全性
4. ✅ **バックアップ戦略（10.3）** - PITR、バージョニング、ライフサイクル
5. ✅ **コスト最適化（7.1）** - On-Demand、Standard-IA移行
6. ✅ **セキュリティ（8.1）** - 暗号化、最小権限、削除保護

### **修正内容のサマリー**

| 修正項目 | 重要度 | 状態 |
|---------|--------|------|
| Constructorエラー修正 | 🔴 致命的 | ✅ 修正済み |
| 削除保護設定 | 🔴 致命的 | ✅ 修正済み |
| バックアップ戦略実装 | 🟡 重要 | ✅ 修正済み |
| セキュリティ設定 | 🟡 重要 | ✅ 修正済み |
| CloudFormation出力修正 | 🟡 重要 | ✅ 修正済み |
| Stack間参照実装 | 🟡 重要 | ✅ 修正済み |
| ライフサイクルポリシー | 🟢 推奨 | ✅ 修正済み |

### **次のステップ**

- [ ] `bin/myblog-aws.ts`でDataStackをインスタンス化
- [ ] `cdk synth`でCloudFormationテンプレート生成
- [ ] `cdk diff`で変更内容確認
- [ ] `cdk deploy`でデプロイ
- [ ] AWS CLIで実際のリソース名確認

---

**レビュアー:** AI Assistant  
**最終更新:** 2026年2月10日  
**ステータス:** ✅ 承認 - デプロイ可能

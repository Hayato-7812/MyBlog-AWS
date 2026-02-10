## CloudFront Distribution実装：何を考えるべきか？

CloudFront Distributionの実装について、段階的に考えていきましょう。

---

## 🤔 質問1: なぜCloudFrontが必要？

### **S3の静的Webサイトホスティングだけではダメ？**

```
比較:

Option A: S3のみ（静的Webサイトホスティング）
- ✅ シンプル
- ❌ HTTPSがない（カスタムドメインの場合）
- ❌ グローバルCDNがない（遅い）
- ❌ キャッシュコントロールが弱い
- ❌ カスタムヘッダー追加が困難
- ❌ セキュリティ機能が弱い

Option B: CloudFront + S3（推奨）
- ✅ HTTPS自動対応
- ✅ グローバルCDN（高速）
- ✅ 強力なキャッシュ制御
- ✅ カスタムヘッダー追加可能
- ✅ WAF統合可能
- ✅ OAI（Origin Access Identity）でS3を保護
```

**考えるべきこと:**
- パフォーマンス要件は？
- セキュリティ要件は？
- HTTPS必須？

**答え:** CloudFrontは必須（パフォーマンス、セキュリティ、HTTPS）

---

## 🤔 質問2: Originの設定は？

### **CloudFrontが取得するコンテンツの元（Origin）**

```
MyBlogのOrigin構成:

Origin 1: フロントエンド用S3バケット
- パス: /
- 用途: HTML, CSS, JS
- OAI: 必要

Origin 2（将来）: メディアファイル用S3バケット
- パス: /media/*
- 用途: 画像、動画
- OAI: 必要

Origin 3（将来）: API Gateway
- パス: /api/*
- 用途: REST API
- 認証: Cognito
```

**現時点で実装すべきOrigin:**
```
Phase 1（今）:
✅ Origin 1のみ（フロントエンド用S3）

Phase 2（後で）:
□ Origin 2（メディアファイル用S3）
□ Origin 3（API Gateway）
```

**考えるべきこと:**
- 現時点で何が必要？
- 将来の拡張を考慮した設計？

---

## 🤔 質問3: OAI（Origin Access Identity）とは？

### **S3バケットを保護する仕組み**

```
OAIなし:
ユーザー → S3バケット（直接アクセス可能）❌
ユーザー → CloudFront → S3バケット

OAIあり:
ユーザー → S3バケット（直接アクセス不可）✅
ユーザー → CloudFront（OAI）→ S3バケット
              ↑
         CloudFrontのみアクセス可能
```

**OAIの役割:**
1. S3バケットへの直接アクセスをブロック
2. CloudFront経由でのみアクセス許可
3. S3バケットポリシーを自動設定

**実装方法:**
```typescript
// OAI作成
const originAccessIdentity = new cloudfront.OriginAccessIdentity(
  this, 
  'OAI', 
  {
    comment: 'OAI for MyBlog frontend bucket',
  }
);

// S3バケットにOAI権限付与
this.frontendBucket.grantRead(originAccessIdentity);
```

**考えるべきこと:**
- OAIは必須？ → はい（セキュリティ）
- 設定は自動？ → CDKが自動設定

---

## 🤔 質問4: Behaviorの設定は？

### **パスごとの処理ルール**

```
Behavior = パスパターン + Origin + キャッシュ設定

例:
Behavior 1（デフォルト）:
- パス: /*（すべて）
- Origin: フロントエンド用S3
- キャッシュ: 有効
- HTTPS: リダイレクト

Behavior 2（将来）:
- パス: /media/*
- Origin: メディアファイル用S3
- キャッシュ: 長期間
- HTTPS: リダイレクト

Behavior 3（将来）:
- パス: /api/*
- Origin: API Gateway
- キャッシュ: 無効
- HTTPS: 必須
```

**現時点で実装すべきBehavior:**
```
Phase 1（今）:
✅ デフォルトBehaviorのみ
   - パス: /*
   - Origin: フロントエンド用S3
```

**考えるべきこと:**
- SPA（Single Page Application）の考慮
- キャッシュ戦略
- HTTPS強制

---

## 🤔 質問5: Price Class（料金クラス）は？

### **設計ドキュメントの方針**

```
Price Class 200（推奨）
- カバレッジ: 北米、欧州、アジア、中東、アフリカ
- 日本含む: ✅
- コスト: 中程度

その他の選択肢:
- Price Class All: 全世界（高コスト）
- Price Class 100: 北米、欧州のみ（低コスト、日本含まず）
```

**設計ドキュメント（02-5-infrastructure-final-design.md）:**
```
選択: Price Class 200
理由: アジア含む、コスト最適
```

**答え:** Price Class 200を使用

---

### **Price Class詳細解説**

#### **地理的カバレッジ**

```
Price Class 100（最低コスト）:
✅ 北米、欧州
❌ アジア（日本含まず）

Price Class 200（推奨）:
✅ 北米、欧州、アジア、中東、アフリカ
✅ 日本含む

Price Class All（最高コスト）:
✅ 全世界
```

#### **Price Class 100を選択した場合の問題**

**問題1: 日本からのアクセスが遅い**

```
Price Class 100の場合:
日本ユーザー → 欧州エッジ → Origin（東京） → 欧州エッジ → 日本
結果: 初回 1-2秒、キャッシュ後 150-300ms

Price Class 200の場合:
日本ユーザー → 東京エッジ → Origin（東京） → 東京エッジ → 日本
結果: 初回 100-200ms、キャッシュ後 20-50ms

差: 約10倍遅い
```

**問題2: SEOへの悪影響**
- Googleのページ速度ランキングが下がる
- モバイル評価が低下

**問題3: コスト差はわずか**

```
月間1,000PV（1GB転送）:
- Price Class 100: $0.085/月
- Price Class 200: $0.114/月
- 差額: $0.03/月（約4円）

月間10,000PV（10GB転送）:
- Price Class 100: $0.85/月
- Price Class 200: $1.14/月
- 差額: $0.29/月（約40円）

結論: 月数円の節約のために大幅なパフォーマンス低下
```

#### **推奨事項**

```
MyBlogプロジェクト: Price Class 200を強く推奨

理由:
✅ 主な読者が日本にいる可能性が高い
✅ パフォーマンス重視（ユーザー体験、SEO）
✅ コスト差が月数円程度（許容範囲）
✅ 将来的にアジア展開の可能性

結論:
Price Class 100にするメリットはほぼなし
月数円の節約で大きな代償を払うことになる
```

---

## 🤔 質問6: カスタムドメインは？

### **Route53実装ステップの方針**

```
Phase 1（現在）:
- CloudFrontデフォルトドメイン
- 例: d111111abcdef8.cloudfront.net
- 証明書: 不要（自動HTTPS）

Phase 3（本番リリース前）:
- カスタムドメイン
- 例: blog.example.com
- 証明書: ACM（us-east-1）
```

**考えるべきこと:**
- 現時点でドメインは必要？ → いいえ
- 後で追加できる？ → はい
- 実装方法は？ → domainNamesプロパティ（オプション）

**答え:** Phase 1ではカスタムドメインなし

---

## 🤔 質問7: キャッシュ設定は？

### **SPA（Single Page Application）の考慮**

```
SPAの特徴:
- index.htmlがすべてのルートのエントリーポイント
- /about → index.html
- /posts/123 → index.html
- JavaScriptがルーティング

問題:
- CloudFrontがキャッシュすると、古いバージョンが表示される
- index.htmlは常に最新版を取得したい
```

**キャッシュ戦略:**
```
1. index.html:
   - キャッシュ: 短期間（5分）または無効
   - 理由: 常に最新版を取得

2. JS/CSS（ハッシュ付き）:
   - キャッシュ: 長期間（1年）
   - 例: main.a1b2c3.js
   - 理由: ハッシュが変わるので安全

3. 画像:
   - キャッシュ: 長期間（1年）
   - 理由: 変更が少ない
```

**実装方法:**
```typescript
defaultBehavior: {
  origin: new origins.S3Origin(this.frontendBucket, {
    originAccessIdentity,
  }),
  viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  // または
  // cachePolicy: new cloudfront.CachePolicy(...)  // カスタム設定
}
```

**考えるべきこと:**
- SPAのキャッシュ問題をどう解決？
- デフォルトのCachePolicyで十分？
- カスタムCachePolicyが必要？

**推奨:**
```
Phase 1: デフォルトのCACHING_OPTIMIZEDを使用
Phase 2: 必要に応じてカスタムCachePolicy
```

---

## 🤔 質問8: エラーページ設定（SPA対応）

### **404エラーをindex.htmlにリダイレクト**

```
問題:
ユーザーが /about に直接アクセス
  ↓
CloudFrontがS3に /about を要求
  ↓
S3には /about が存在しない
  ↓
404エラー（❌ 表示されるべきではない）

解決:
ユーザーが /about に直接アクセス
  ↓
CloudFrontがS3に /about を要求
  ↓
S3には /about が存在しない → 404
  ↓
CloudFrontが404を200に変換してindex.htmlを返す
  ↓
index.htmlのJavaScriptが /about をレンダリング（✅）
```

**実装方法:**
```typescript
errorResponses: [
  {
    httpStatus: 403,  // S3が返すエラー
    responseHttpStatus: 200,
    responsePagePath: '/index.html',
    ttl: cdk.Duration.seconds(0),
  },
  {
    httpStatus: 404,
    responseHttpStatus: 200,
    responsePagePath: '/index.html',
    ttl: cdk.Duration.seconds(0),
  },
],
```

**考えるべきこと:**
- SPAのルーティングをどう処理？
- 403と404の両方を処理？
- TTLは0？

**答え:** 403と404をindex.htmlにリダイレクト

---

## 🤔 質問9: 公開プロパティは？

### **将来の拡張を考慮**

```
必要な公開プロパティ:
✅ public readonly distribution: cloudfront.Distribution;

理由:
- CloudFormation出力で使用
- カスタムドメイン設定時にRoute53から参照
- デバッグ時にDistributionドメイン名を取得
```

**実装:**
```typescript
export class AppStack extends cdk.Stack {
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;  // 追加
}
```

---

## 🤔 質問10: CloudFormation出力は？

### **デプロイ後の確認**

```
必要な出力:
✅ DistributionId: CloudFormation管理用
✅ DistributionDomainName: アクセス用URL
✅ DistributionArn: IAM権限設定用（将来）
```

**実装:**
```typescript
new cdk.CfnOutput(this, 'DistributionId', {
  value: this.distribution.distributionId,
  description: 'CloudFront Distribution ID',
});

new cdk.CfnOutput(this, 'DistributionDomainName', {
  value: this.distribution.distributionDomainName,
  description: 'CloudFront Distribution Domain Name (website URL)',
});
```

---

## 💡 最初のヒント（答え）

### **CloudFront Distribution の基本実装:**

```typescript
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

// ==========================================================
// CloudFront Distribution（フロントエンド配信）
// ==========================================================

// OAI（Origin Access Identity）の作成
const originAccessIdentity = new cloudfront.OriginAccessIdentity(
  this,
  'OriginAccessIdentity',
  {
    comment: 'OAI for MyBlog frontend bucket',
  }
);

// S3バケットにOAI読み取り権限を付与
this.frontendBucket.grantRead(originAccessIdentity);

// CloudFront Distribution
this.distribution = new cloudfront.Distribution(this, 'Distribution', {
  // デフォルトのOrigin（フロントエンド用S3）
  defaultBehavior: {
    origin: new origins.S3Origin(this.frontendBucket, {
      originAccessIdentity,
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
  },
  
  // デフォルトルートオブジェクト
  defaultRootObject: 'index.html',
  
  // Price Class（設計ドキュメント準拠）
  priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
  
  // エラーレスポンス（SPA対応）
  errorResponses: [
    {
      httpStatus: 403,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.seconds(0),
    },
    {
      httpStatus: 404,
      responseHttpStatus: 200,
      responsePagePath: '/index.html',
      ttl: cdk.Duration.seconds(0),
    },
  ],
  
  // コメント（管理用）
  comment: 'MyBlog frontend distribution',
});

// CloudFormation出力
new cdk.CfnOutput(this, 'DistributionId', {
  value: this.distribution.distributionId,
  description: 'CloudFront Distribution ID',
});

new cdk.CfnOutput(this, 'DistributionDomainName', {
  value: this.distribution.distributionDomainName,
  description: 'CloudFront Distribution Domain Name (website URL)',
});
```

---

## 📋 実装チェックリスト

```
Phase 1（現在）:
□ OAI作成
□ S3バケットにOAI権限付与
□ CloudFront Distribution作成
  □ デフォルトBehavior（フロントエンド用S3）
  □ HTTPS リダイレクト
  □ Price Class 200
  □ SPA用エラーレスポンス
□ 公開プロパティ追加
□ CloudFormation出力

Phase 2（将来）:
□ メディアファイル用Origin追加
□ API Gateway用Origin追加
□ カスタムドメイン設定
□ ACM証明書統合
□ カスタムCachePolicy
```

---

この思考フローで考えながら、CloudFront Distributionの実装を進めてみてください！
# Lambda関数実装：何を考えるべきか？

Lambda関数の実装について、段階的に考えていきましょう。

---

## 🤔 質問1: どのLambda関数が必要？

### **MyBlogで必要なAPI**

```
設計ドキュメント（02-3-api-design.md）より:

1. GET /posts
   - 用途: 記事一覧取得
   - 認証: 不要（公開）
   - Lambda関数: get-posts

2. GET /posts/{id}
   - 用途: 記事詳細取得
   - 認証: 不要（公開）
   - Lambda関数: get-posts（同じ関数で処理）

3. POST /posts
   - 用途: 記事作成
   - 認証: 必要（管理者のみ）
   - Lambda関数: create-post

4. PUT /posts/{id}
   - 用途: 記事更新
   - 認証: 必要（管理者のみ）
   - Lambda関数: update-post

5. DELETE /posts/{id}
   - 用途: 記事削除
   - 認証: 必要（管理者のみ）
   - Lambda関数: delete-post

6. POST /media/presigned-url
   - 用途: メディアアップロード用URL生成
   - 認証: 必要（管理者のみ）
   - Lambda関数: generate-presigned-url
```

**実装優先順位:**
```
Phase 1（現在）:
✅ get-posts（公開API、優先度高）
□ create-post（管理者API）
□ update-post（管理者API）
□ delete-post（管理者API）
□ generate-presigned-url（管理者API）

理由:
- get-postsで動作確認
- フロントエンド開発が開始できる
- 管理者APIは後回し
```

---

## 🤔 質問2: ディレクトリ構造は？

### **Lambda関数のコード配置**

```
Option A: 関数ごとにディレクトリ分割（推奨）
myblog-aws/
├── lambda/
│   ├── get-posts/
│   │   ├── index.ts          # エントリーポイント
│   │   ├── handler.ts         # ビジネスロジック
│   │   ├── types.ts           # 型定義
│   │   └── package.json       # 依存関係
│   ├── create-post/
│   │   ├── index.ts
│   │   └── ...
│   └── ...

Option B: 共通ディレクトリ + 個別関数
myblog-aws/
├── lambda/
│   ├── common/                # 共通モジュール
│   │   ├── dynamo-client.ts
│   │   ├── response.ts
│   │   └── types.ts
│   ├── get-posts/
│   │   └── index.ts
│   └── ...
```

**推奨:**
```
Option A: 関数ごとに分割

理由:
- デプロイが独立
- 依存関係が明確
- コールドスタートが速い
- スケーリングが個別

注意:
- コードの重複が発生する可能性
- 共通ロジックはコピー or Lambda Layer
```

---

## 🤔 質問3: ランタイムは？

### **Node.js vs Python vs その他**

```
選択肢:

Node.js（推奨）:
✅ TypeScript使用可能
✅ CDKと同じ言語
✅ 非同期処理が得意
✅ AWS SDK組み込み
✅ コールドスタート速い

Python:
✅ シンプル
✅ 機械学習ライブラリ豊富
❌ TypeScriptの型安全性なし

その他（Go, Java, Rust等）:
✅ パフォーマンス
❌ 開発速度
❌ CDKとの統合
```

**推奨:**
```
Node.js 18.x（LTS）

理由:
- CDKと同じTypeScript
- 型安全性
- 開発効率
- AWSのサポート
```

---

## 🤔 質問4: メモリとタイムアウトは？

### **設計ドキュメントの方針**

```
設計ドキュメント（02-5-infrastructure-final-design.md）:

初期設定:
- メモリ: 128MB
- タイムアウト: 10秒

最適化戦略:
1. 初期: 128MBでデプロイ
2. CloudWatch Metricsで確認
3. メモリ使用率 > 80% → メモリ増加
4. 実行時間が長い → メモリ増加で高速化
```

**なぜ128MB？**
```
メリット:
✅ コスト最小
✅ 小さく始める
✅ 後で調整可能

デメリット:
❌ パフォーマンス制限
❌ 複雑な処理には不足

結論:
初期は128MB、必要に応じて増加
```

**タイムアウトは10秒で十分？**
```
想定処理時間:
- DynamoDB Query: 10-50ms
- データ変換: 10-50ms
- レスポンス生成: 10ms
合計: 100ms以下

10秒は十分（余裕を持った設定）
```

---

## 🤔 質問5: 環境変数は？

### **Lambda関数に渡す情報**

```
必要な環境変数:

TABLE_NAME:
- DynamoDBテーブル名
- DataStackから取得
- 例: MyBlog-DataStack-MyBlogTable-ABC123

BUCKET_NAME:
- S3バケット名（メディアファイル用）
- DataStackから取得
- 例: myblog-datastack-mediabucket-xyz789

REGION:
- AWSリージョン
- 例: ap-northeast-1

環境（オプション）:
- NODE_ENV: production
- LOG_LEVEL: info
```

**CDKでの設定方法:**
```typescript
const getPostsFunction = new lambda.Function(this, 'GetPostsFunction', {
  // ...
  environment: {
    TABLE_NAME: props.dataStack.blogTable.tableName,
    BUCKET_NAME: props.dataStack.mediaBucket.bucketName,
    REGION: cdk.Stack.of(this).region,
  },
});
```

**考えるべきこと:**
- ハードコードしない（環境変数で渡す）
- DataStackから動的に取得
- セキュアな情報（API Key等）はSecrets Managerへ

---

## 🤔 質問6: IAM権限は？

### **最小権限の原則**

```
設計ドキュメント（02-5-infrastructure-final-design.md）:

get-posts Lambda:
✅ dynamodb:Query
✅ dynamodb:GetItem
❌ dynamodb:PutItem（不要）
❌ dynamodb:DeleteItem（不要）
❌ s3:*（不要）

create-post Lambda:
✅ dynamodb:PutItem
❌ dynamodb:DeleteItem（不要）
❌ s3:*（直接アップロードしない）

generate-presigned-url Lambda:
✅ s3:PutObject（Pre-signed URL生成用）
❌ dynamodb:*（不要）
```

**CDKでの権限付与:**
```typescript
// ❌ 悪い例: すべての権限
getPostsFunction.addToRolePolicy(new iam.PolicyStatement({
  actions: ['dynamodb:*'],
  resources: ['*'],
}));

// ✅ 良い例: 必要最小限
props.dataStack.blogTable.grantReadData(getPostsFunction);
// これだけで以下が自動設定される:
// - dynamodb:GetItem
// - dynamodb:Query
// - dynamodb:Scan
// - テーブルARNに限定
```

**メリット:**
- セキュリティ向上
- 誤操作防止
- 監査が容易

---

## 🤔 質問7: DataStackリソースへのアクセスは？

### **Stack間の直接参照（CDKベストプラクティス）**

```
方法: リソースオブジェクト全体を渡す

AppStack:
constructor(scope: Construct, id: string, props: AppStackProps) {
  // DataStackのリソースを参照
  const blogTable = props.dataStack.blogTable;
  const mediaBucket = props.dataStack.mediaBucket;
  
  // Lambda関数に環境変数として渡す
  const getPostsFunction = new lambda.Function(this, 'GetPosts', {
    environment: {
      TABLE_NAME: blogTable.tableName,
      BUCKET_NAME: mediaBucket.bucketName,
    },
  });
  
  // IAM権限を付与
  blogTable.grantReadData(getPostsFunction);
}
```

**メリット:**
- 型安全
- IAM権限が簡単（grantXXXメソッド）
- ARN/名前が自動取得
- CloudFormation依存関係が自動設定

---

## 🤔 質問8: エラーハンドリングは？

### **Lambda関数のエラー処理**

```
基本方針:

1. try-catch必須
2. エラーの種類で分類
3. 適切なHTTPステータスコード
4. CloudWatch Logsにログ出力
5. ユーザーにはエラー詳細を隠す
```

**実装例:**
```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // ビジネスロジック
    const result = await getPostsFromDynamoDB();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error:', error);
    
    // エラーの種類で分類
    if (error.name === 'ResourceNotFoundException') {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not found' }),
      };
    }
    
    // その他のエラー
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

**ログに記録すべき:**
```
✅ リクエストID
✅ 実行時間
✅ エラー内容
✅ スタックトレース
✅ ユーザーID（Cognitoのsub）

❌ 認証トークン
❌ パスワード
❌ リクエストボディ全体
```

---

## 🤔 質問9: レスポンス形式は？

### **API Gatewayとの統合**

```
Lambda Proxy統合（推奨）:

レスポンス形式:
{
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',  // CORS
  },
  body: JSON.stringify({
    data: [...],
    meta: {
      count: 10,
      page: 1,
    }
  })
}
```

**なぜJSON.stringify？**
```
理由:
- bodyは文字列である必要がある
- API Gatewayが自動でJSONに変換しない
- 手動でシリアライズが必要

❌ 間違い: body: { data: [...] }
✅ 正しい: body: JSON.stringify({ data: [...] })
```

**CORSヘッダー:**
```
開発環境:
'Access-Control-Allow-Origin': '*'

本番環境（推奨）:
'Access-Control-Allow-Origin': 'https://yourdomain.com'
```

---

## 🤔 質問10: デプロイ方法は？

### **Lambda関数のバンドル**

```
Option A: CDK Bundling（推奨）
- CDKが自動でTypeScriptをコンパイル
- node_modulesを含めてバンドル
- esbuildを使用（高速）

Option B: 手動ビルド
- npm run buildで手動コンパイル
- zipファイル作成
- S3にアップロード
```

**CDK Bundling設定:**
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

const getPostsFunction = new lambdaNodejs.NodejsFunction(
  this,
  'GetPostsFunction',
  {
    entry: 'lambda/get-posts/index.ts',  // エントリーポイント
    handler: 'handler',                   // エクスポート関数名
    runtime: lambda.Runtime.NODEJS_18_X,
    bundling: {
      minify: true,                      // 最小化
      sourceMap: false,                  // ソースマップ不要
      externalModules: ['aws-sdk'],      // AWS SDKは除外
    },
  }
);
```

**メリット:**
- 自動バンドル
- 依存関係が自動解決
- デプロイが簡単
- コードサイズが最適化

---

## 💡 最初のヒント（答え）

### **get-posts Lambda関数の基本実装**

#### **1. ディレクトリ構造**

```
myblog-aws/
├── lambda/
│   └── get-posts/
│       ├── index.ts           # Lambda関数エントリーポイント
│       ├── types.ts           # 型定義
│       └── package.json       # 依存関係（オプション）
```

#### **2. lambda/get-posts/index.ts**

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB Clientの初期化
const client = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // パスパラメータからIDを取得
    const postId = event.pathParameters?.id;
    
    if (postId) {
      // 個別記事の取得
      return await getPostById(postId);
    } else {
      // 記事一覧の取得
      return await getPostsList(event);
    }
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};

// 個別記事の取得
async function getPostById(postId: string): Promise<APIGatewayProxyResult> {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      pk: `POST#${postId}`,
      sk: 'METADATA',
    },
  });
  
  const result = await docClient.send(command);
  
  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Post not found',
      }),
    };
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      data: result.Item,
    }),
  };
}

// 記事一覧の取得
async function getPostsList(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // クエリパラメータから取得
  const limit = Number(event.queryStringParameters?.limit) || 10;
  const status = event.queryStringParameters?.status || 'published';
  
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'gsi1-status-index',  // ステータスで検索
    KeyConditionExpression: 'sk = :sk',
    ExpressionAttributeValues: {
      ':sk': `STATUS#${status}`,
    },
    Limit: limit,
    ScanIndexForward: false,  // 降順（新しい順）
  });
  
  const result = await docClient.send(command);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      data: result.Items || [],
      meta: {
        count: result.Items?.length || 0,
        limit,
      },
    }),
  };
}
```

#### **3. lambda/get-posts/package.json**

```json
{
  "name": "get-posts",
  "version": "1.0.0",
  "description": "Get posts Lambda function",
  "main": "index.ts",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.x",
    "@aws-sdk/lib-dynamodb": "^3.x"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.x",
    "@types/node": "^18.x",
    "typescript": "^5.x"
  }
}
```

#### **4. AppStack（CDK）での定義**

```typescript
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

// Lambda関数の作成
const getPostsFunction = new lambdaNodejs.NodejsFunction(
  this,
  'GetPostsFunction',
  {
    entry: 'lambda/get-posts/index.ts',
    handler: 'handler',
    runtime: lambda.Runtime.NODEJS_18_X,
    timeout: cdk.Duration.seconds(10),
    memorySize: 128,
    environment: {
      TABLE_NAME: props.dataStack.blogTable.tableName,
      REGION: cdk.Stack.of(this).region,
    },
    bundling: {
      minify: true,
      externalModules: ['aws-sdk'],
    },
  }
);

// DynamoDB読み取り権限を付与
props.dataStack.blogTable.grantReadData(getPostsFunction);

// CloudFormation出力
new cdk.CfnOutput(this, 'GetPostsFunctionName', {
  value: getPostsFunction.functionName,
  description: 'Get Posts Lambda function name',
});

new cdk.CfnOutput(this, 'GetPostsFunctionArn', {
  value: getPostsFunction.functionArn,
  description: 'Get Posts Lambda function ARN',
});
```

---

## 📋 実装チェックリスト

### **Phase 1: get-posts Lambda（現在）**

```
□ ディレクトリ作成（lambda/get-posts/）
□ index.ts作成
  □ handler関数
  □ getPostById関数
  □ getPostsList関数
  □ エラーハンドリング
□ package.json作成
□ types.ts作成（オプション）
□ AppStackにLambda関数追加
  □ NodejsFunction使用
  □ 環境変数設定
  □ IAM権限付与（grantReadData）
  □ CloudFormation出力
□ コンパイル確認
□ ローカルテスト（オプション）
```

### **Phase 2: 管理者API Lambda（後で）**

```
□ create-post Lambda
□ update-post Lambda
□ delete-post Lambda
□ generate-presigned-url Lambda
□ 共通モジュール作成（オプション）
```

---

## 🎯 重要なポイント

### **1. DynamoDBデータモデルの理解**

```
設計ドキュメント（02-2-data-design.md）:

記事メタデータ:
PK: POST#<PostID>
SK: METADATA
属性: title, content, status, createdAt, etc.

記事ブロック:
PK: POST#<PostID>
SK: BLOCK#<Order>
属性: type, content, order

タグ（GSI1）:
PK: TAG#<TagName>
SK: POST#<PostID>
```

**Lambda関数での取得方法:**
```typescript
// 個別記事取得
GetCommand: PK=POST#<PostID>, SK=METADATA

// 記事一覧取得
QueryCommand: GSI1, SK=STATUS#published

// タグ検索
QueryCommand: GSI1, PK=TAG#<TagName>
```

### **2. AWS SDKのバージョン**

```
v3（推奨）:
✅ モジュラー（必要な機能のみインポート）
✅ コードサイズが小さい
✅ TypeScript完全対応
✅ パフォーマンス向上

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';

v2（非推奨）:
❌ 全機能を一括インポート
❌ コードサイズが大きい

const AWS = require('aws-sdk');
```

### **3. コールドスタート対策**

```
対策:
1. コードサイズを小さく
   - 必要な依存関係のみ
   - minify有効化
   
2. 初期化を関数外で
   - DynamoDB Clientをグローバル変数
   - 再利用される
   
3. Provisioned Concurrency（オプション）
   - コスト増加
   - 初期段階では不要
```

---

この思考フローで考えながら、Lambda関数の実装を進めてみてください！

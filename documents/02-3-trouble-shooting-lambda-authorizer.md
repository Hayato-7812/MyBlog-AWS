# トラブルシューティング: Lambda Authorizer実装

## 発生日時
2026年2月12日

## 問題の概要
HTTP API JWT Authorizerで継続的な401 Unauthorizedエラーが発生。Cognito設定は正しいにも関わらず認証が通らない状況が続いた。

---

## 問題1: HTTP API JWT Authorizerの限界

### 症状
```bash
$ curl -H "Authorization: Bearer $JWT_TOKEN" https://api.example.com/admin/posts
{"message":"Unauthorized"}
```

### 原因
HTTP API JWT Authorizerは以下の理由でデバッグが困難：
1. **ブラックボックス**: トークン検証プロセスが不可視
2. **限定的なログ**: CloudWatch Logsに詳細が出力されない
3. **エラーメッセージ不明瞭**: "Unauthorized"のみで原因不明

### 設定確認項目（すべて正しかった）
- ✅ issuerURL: `https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_xxxxx`
- ✅ audience: `[CLIENT_ID]`
- ✅ identitySource: `$request.header.Authorization`
- ✅ Cognitoトークンが有効

### 結論
**HTTP API JWT Authorizerでは根本原因を特定できない**

---

## 解決策: Lambda Authorizerへの切り替え

### 実装内容

#### 1. Lambda Authorizer関数作成
```typescript
// myblog-aws/lambda/jwt-authorizer/handler.ts
import { CognitoJwtVerifier } from 'aws-jwt-verify';

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.CLIENT_ID,
});

export async function handler(event: AuthorizerEvent): Promise<AuthorizerResult> {
  // 1. トークン抽出
  const token = event.headers?.['Authorization']?.replace('Bearer ', '');
  
  // 2. JWT検証
  const payload = await verifier.verify(token);
  
  // 3. ポリシー返却
  return generatePolicy(payload.sub, 'Allow', '*', {
    email: payload.email,
    sub: payload.sub,
    username: payload['cognito:username'],
  });
}
```

#### 2. 利点
- ✅ **完全な可視化**: すべてのステップをCloudWatch Logsで追跡
- ✅ **柔軟な検証**: カスタムロジック追加可能
- ✅ **詳細なエラーログ**: 問題の正確な特定が可能

---

## 問題2: HTTP API v2でのIAMポリシー形式

### 症状（第1回デプロイ後）
```json
{
  "message": "Forbidden"
}
```

Lambda Authorizerログ:
```
✅ JWT verification successful
✅ Returning Allow policy for resource: arn:aws:execute-api:...
```

### 原因
**HTTP API v2では、ResourceにARNではなく`*`（ワイルドカード）を使用する必要がある**

### 修正内容

#### Before（動作しない）
```typescript
const resource = event.methodArn;  // 具体的なARN
return generatePolicy(principalId, 'Allow', resource, context);
```

#### After（動作する）
```typescript
return generatePolicy(principalId, 'Allow', '*', context);  // ワイルドカード
```

### HTTP API v2の仕様
- REST API: 具体的なARNを指定
- HTTP API v2: **必ず`*`を使用**

---

## 問題3: Lambda Authorizerのレスポンスタイプ

### 症状（第2回デプロイ後）
Resource='*'に変更したが、まだ認証が通らない

### 原因
**HTTP API v2では`HttpLambdaResponseType.SIMPLE`を使用する必要がある**

### 修正内容

#### Before（動作しない）
```typescript
const lambdaAuthorizer = new HttpLambdaAuthorizer('LambdaAuthorizer', authorizerFunction, {
  responseTypes: [HttpLambdaResponseType.IAM],  // ❌ REST API用
  resultsCacheTtl: cdk.Duration.minutes(5),
  identitySource: ['$request.header.Authorization'],
});
```

#### After（動作する）
```typescript
const lambdaAuthorizer = new HttpLambdaAuthorizer('LambdaAuthorizer', authorizerFunction, {
  responseTypes: [HttpLambdaResponseType.SIMPLE],  // ✅ HTTP API v2用
  resultsCacheTtl: cdk.Duration.minutes(5),
  identitySource: ['$request.header.Authorization'],
});
```

### レスポンスタイプの違い

| タイプ | 用途 | Resourceフィールド |
|--------|------|-------------------|
| IAM | REST API | 具体的なARN |
| SIMPLE | HTTP API v2 | ワイルドカード(`*`) |

---

## 最終的な動作確認

### Lambda Authorizerログ
```json
{
  "authorizer": {
    "lambda": {
      "email": "user@example.com",
      "sub": "87946ab8-50e1-7051-b1e9-50b1e848c3db",
      "username": "87946ab8-50e1-7051-b1e9-50b1e848c3db"
    }
  }
}
```

### 認証情報の伝達
✅ Lambda Authorizerで検証したユーザー情報が、後続のLambda関数（create-post等）に正しく渡される

---

## まとめ：3つの重要なポイント

### 1. HTTP API v2 + Lambda Authorizerの組み合わせ
```typescript
// Lambda Authorizer関数
return generatePolicy(principalId, 'Allow', '*', context);  // Resource='*'
```

### 2. responseType=SIMPLE
```typescript
// CDK設定
const lambdaAuthorizer = new HttpLambdaAuthorizer('LambdaAuthorizer', authorizerFunction, {
  responseTypes: [HttpLambdaResponseType.SIMPLE],  // HTTP API v2用
});
```

### 3. 完全なデバッグ可能性
- CloudWatch Logsですべてのプロセスを追跡
- トークンペイロードの確認
- エラー原因の正確な特定

---

## 参考資料

### AWS公式ドキュメント
- [HTTP API Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html)
- [Lambda authorizer response format](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-lambda-authorizer.html#http-api-lambda-authorizer.payload-format-response)

### 関連ファイル
- `myblog-aws/lib/app-stack.ts`: Lambda Authorizer CDK定義
- `myblog-aws/lambda/jwt-authorizer/handler.ts`: Lambda Authorizer実装
- `myblog-aws/lambda/jwt-authorizer/types.ts`: 型定義

### Git コミット
```bash
commit b6970b8: fix: Lambda Authorizerを完全に動作させる修正
commit 93dea6f: feat: HTTP API JWT AuthorizerからLambda Authorizerへ切り替え
```

---

## 教訓

1. **HTTP API JWT Authorizerは避ける**: デバッグが困難
2. **Lambda Authorizerを使う**: 完全な制御と可視化
3. **HTTP API v2の仕様を理解**: SIMPLE responseとResource='*'
4. **CloudWatch Logsを活用**: 詳細なログで問題を早期発見

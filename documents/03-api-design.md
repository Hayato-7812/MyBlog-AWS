# API Design

## 1. 設計方針

### 1.1 基本原則

* **RESTful API**: リソース指向のURL設計とHTTPメソッドの適切な使用
* **JSON形式**: すべてのリクエスト/レスポンスはJSON形式
* **キャメルケース**: すべてのキー名は `lowerCamelCase` で統一
* **ステートレス**: セッション情報はサーバー側で保持せず、トークンベースの認証を使用
* **エラーハンドリング**: 一貫したエラーレスポンス形式

### 1.2 認証・認可

* **一般ユーザー向けAPI**: 認証不要（公開情報のみを提供）
* **管理者向けAPI**: Amazon Cognito + API Gateway Authorizerで認証
  * リクエストヘッダー: `Authorization: Bearer <JWT_TOKEN>`
  * 認証失敗時: `401 Unauthorized`
  * 認可失敗時: `403 Forbidden`

### 1.3 ベースURL

* **本番環境**: `https://api.myblog-aws.example.com`

> **注**: 開発初期段階では本番環境のみを使用します。将来的に開発・ステージング環境を分離する必要が出た場合は、CDKのコンテキスト変数を用いた環境分離を検討します。

---

## 2. エンドポイント一覧

### 2.1 一般ユーザー向けAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/posts` | 公開記事一覧取得 | 不要 |
| GET | `/api/posts/{postId}` | 記事詳細取得 | 不要 |
| GET | `/api/tags` | タグ一覧取得 | 不要 |
| GET | `/api/tags/{tagName}/posts` | タグ別記事一覧取得 | 不要 |

### 2.2 管理者向けAPI

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/admin/posts` | 全記事一覧取得（下書き含む） | 必要 |
| GET | `/api/admin/posts/{postId}` | 記事詳細取得（下書き含む） | 必要 |
| POST | `/api/admin/posts` | 記事新規作成 | 必要 |
| PUT | `/api/admin/posts/{postId}` | 記事更新 | 必要 |
| DELETE | `/api/admin/posts/{postId}` | 記事削除 | 必要 |
| POST | `/api/admin/media/upload` | メディアファイルアップロード | 必要 |

---

## 3. 一般ユーザー向けAPI詳細

### 3.1 公開記事一覧取得

公開済み（`PUBLISHED`）の記事一覧を取得する。

#### エンドポイント
```
GET /api/posts
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 | デフォルト |
|-----------|----|----|------|----------|
| `limit` | integer | × | 取得件数（1-100） | 20 |
| `nextToken` | string | × | ページネーション用トークン | - |
| `sortOrder` | string | × | ソート順（`desc`, `asc`） | `desc` |

#### リクエスト例
```http
GET /api/posts?limit=10&sortOrder=desc
```

#### レスポンス（200 OK）
```json
{
  "posts": [
    {
      "postId": "p123",
      "title": "アイルランド移住記",
      "thumbnail": "https://cloudfront.../thumb.jpg",
      "summary": "ダブリンでの新生活が始まりました...",
      "status": "published",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z",
      "tags": ["Ireland", "Travel"]
    }
  ],
  "nextToken": "eyJwb3N0SWQiOiJwMTIzIn0=",
  "hasMore": true
}
```

#### エラーレスポンス
```json
{
  "error": "InvalidParameter",
  "message": "limitは1から100の範囲で指定してください"
}
```

---

### 3.2 記事詳細取得

指定した記事IDの詳細情報（本文含む）を取得する。

#### エンドポイント
```
GET /api/posts/{postId}
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `postId` | string | ○ | 記事ID |

#### リクエスト例
```http
GET /api/posts/p123
```

#### レスポンス（200 OK）
```json
{
  "postId": "p123",
  "title": "アイルランド移住記",
  "thumbnail": "https://cloudfront.../thumb.jpg",
  "status": "published",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-20T15:30:00Z",
  "contentBlocks": [
    {
      "order": 1,
      "type": "text",
      "content": "ダブリンに到着しました...",
      "layout": "full"
    },
    {
      "order": 2,
      "type": "image",
      "content": "https://cloudfront.../image1.jpg",
      "layout": "half_left"
    },
    {
      "order": 3,
      "type": "text",
      "content": "最初の印象は...",
      "layout": "half_right"
    },
    {
      "order": 4,
      "type": "video",
      "content": "https://www.youtube.com/embed/xxxxx",
      "layout": "full"
    }
  ],
  "tags": ["Ireland", "Travel"]
}
```

#### エラーレスポンス（404 Not Found）
```json
{
  "error": "PostNotFound",
  "message": "指定された記事が見つかりません"
}
```

---

### 3.3 タグ一覧取得

システム内の全タグを取得する。

#### エンドポイント
```
GET /api/tags
```

#### リクエスト例
```http
GET /api/tags
```

#### レスポンス（200 OK）
```json
{
  "tags": [
    {
      "tagName": "Ireland",
      "postCount": 5
    },
    {
      "tagName": "Travel",
      "postCount": 8
    },
    {
      "tagName": "AWS",
      "postCount": 3
    }
  ]
}
```

---

### 3.4 タグ別記事一覧取得

指定したタグが付与された記事一覧を取得する。

#### エンドポイント
```
GET /api/tags/{tagName}/posts
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `tagName` | string | ○ | タグ名 |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 | デフォルト |
|-----------|----|----|------|----------|
| `limit` | integer | × | 取得件数（1-100） | 20 |
| `nextToken` | string | × | ページネーション用トークン | - |

#### リクエスト例
```http
GET /api/tags/Ireland/posts?limit=10
```

#### レスポンス（200 OK）
```json
{
  "tagName": "Ireland",
  "posts": [
    {
      "postId": "p123",
      "title": "アイルランド移住記",
      "thumbnail": "https://cloudfront.../thumb.jpg",
      "summary": "ダブリンでの新生活が始まりました...",
      "status": "published",
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z",
      "tags": ["Ireland", "Travel"]
    }
  ],
  "nextToken": null,
  "hasMore": false
}
```

---

## 4. 管理者向けAPI詳細

### 4.1 全記事一覧取得（下書き含む）

管理者が全ステータスの記事を取得する。

#### エンドポイント
```
GET /api/admin/posts
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 | デフォルト |
|-----------|----|----|------|----------|
| `status` | string | × | フィルター（`draft`, `published`, `archive`） | 全て |
| `limit` | integer | × | 取得件数（1-100） | 20 |
| `nextToken` | string | × | ページネーション用トークン | - |

#### リクエスト例
```http
GET /api/admin/posts?status=draft&limit=10
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### レスポンス（200 OK）
```json
{
  "posts": [
    {
      "postId": "p124",
      "title": "執筆中の記事",
      "thumbnail": null,
      "summary": "",
      "status": "draft",
      "createdAt": "2025-01-22T10:00:00Z",
      "updatedAt": "2025-01-22T12:30:00Z",
      "tags": []
    }
  ],
  "nextToken": null,
  "hasMore": false
}
```

---

### 4.2 記事詳細取得（下書き含む）

管理者が下書きを含む記事詳細を取得する。

#### エンドポイント
```
GET /api/admin/posts/{postId}
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `postId` | string | ○ | 記事ID |

#### リクエスト例
```http
GET /api/admin/posts/p124
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### レスポンス（200 OK）
一般ユーザー向けAPIの記事詳細取得と同じ構造。ただし `status` が `draft` や `archive` の記事も取得可能。

---

### 4.3 記事新規作成

新しい記事を作成する。

#### エンドポイント
```
POST /api/admin/posts
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### リクエストボディ
```json
{
  "title": "新しい記事タイトル",
  "thumbnail": "https://cloudfront.../new-thumb.jpg",
  "status": "draft",
  "contentBlocks": [
    {
      "order": 1,
      "type": "text",
      "content": "記事の本文...",
      "layout": "full"
    }
  ],
  "tags": ["NewTag", "Sample"]
}
```

#### レスポンス（201 Created）
```json
{
  "postId": "p125",
  "title": "新しい記事タイトル",
  "thumbnail": "https://cloudfront.../new-thumb.jpg",
  "status": "draft",
  "createdAt": "2025-01-23T10:00:00Z",
  "updatedAt": "2025-01-23T10:00:00Z",
  "contentBlocks": [
    {
      "order": 1,
      "type": "text",
      "content": "記事の本文...",
      "layout": "full"
    }
  ],
  "tags": ["NewTag", "Sample"]
}
```

#### エラーレスポンス（400 Bad Request）
```json
{
  "error": "ValidationError",
  "message": "titleは必須項目です"
}
```

---

### 4.4 記事更新

既存記事を更新する。

#### エンドポイント
```
PUT /api/admin/posts/{postId}
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `postId` | string | ○ | 記事ID |

#### リクエストボディ
```json
{
  "title": "更新されたタイトル",
  "thumbnail": "https://cloudfront.../updated-thumb.jpg",
  "status": "published",
  "contentBlocks": [
    {
      "order": 1,
      "type": "text",
      "content": "更新された本文...",
      "layout": "full"
    }
  ],
  "tags": ["UpdatedTag"]
}
```

#### レスポンス（200 OK）
```json
{
  "postId": "p125",
  "title": "更新されたタイトル",
  "thumbnail": "https://cloudfront.../updated-thumb.jpg",
  "status": "published",
  "createdAt": "2025-01-23T10:00:00Z",
  "updatedAt": "2025-01-23T15:00:00Z",
  "contentBlocks": [
    {
      "order": 1,
      "type": "text",
      "content": "更新された本文...",
      "layout": "full"
    }
  ],
  "tags": ["UpdatedTag"]
}
```

---

### 4.5 記事削除

記事を削除する（論理削除を推奨）。

#### エンドポイント
```
DELETE /api/admin/posts/{postId}
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `postId` | string | ○ | 記事ID |

#### リクエスト例
```http
DELETE /api/admin/posts/p125
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

#### レスポンス（204 No Content）
レスポンスボディなし

#### エラーレスポンス（404 Not Found）
```json
{
  "error": "PostNotFound",
  "message": "指定された記事が見つかりません"
}
```

---

### 4.6 メディアファイルアップロード

画像や動画をS3にアップロードし、CloudFront URLを取得する。

#### エンドポイント
```
POST /api/admin/media/upload
```

#### 認証
```http
Authorization: Bearer <JWT_TOKEN>
```

#### リクエスト
Content-Type: `multipart/form-data`

| フィールド | 型 | 必須 | 説明 |
|-----------|----|----|------|
| `file` | binary | ○ | アップロードファイル |
| `type` | string | ○ | メディアタイプ（`image`, `video`） |

#### レスポンス（201 Created）
```json
{
  "mediaId": "m001",
  "url": "https://cloudfront.../media/image1.jpg",
  "type": "image",
  "uploadedAt": "2025-01-23T16:00:00Z"
}
```

#### エラーレスポンス（400 Bad Request）
```json
{
  "error": "InvalidFileType",
  "message": "サポートされていないファイル形式です"
}
```

---

## 5. 共通仕様

### 5.1 エラーレスポンス形式

すべてのエラーレスポンスは以下の形式に統一する。

```json
{
  "error": "ErrorCode",
  "message": "人間が読めるエラーメッセージ",
  "details": {
    "field": "追加の詳細情報（オプション）"
  }
}
```

#### 主なエラーコード

| HTTPステータス | エラーコード | 説明 |
|---------------|------------|------|
| 400 | `ValidationError` | リクエストパラメータの検証エラー |
| 400 | `InvalidParameter` | パラメータの値が不正 |
| 401 | `Unauthorized` | 認証失敗 |
| 403 | `Forbidden` | 認可失敗（権限不足） |
| 404 | `PostNotFound` | 記事が見つからない |
| 404 | `TagNotFound` | タグが見つからない |
| 409 | `Conflict` | リソースの競合 |
| 500 | `InternalServerError` | サーバー内部エラー |

### 5.2 ページネーション

一覧取得系APIは、DynamoDBのページネーショントークンを利用する。

* **nextToken**: 次のページを取得するためのトークン（Base64エンコード）
* **hasMore**: 次のページが存在するかどうかのフラグ

### 5.3 レート制限

API Gatewayのスロットリング機能を利用。

* **一般ユーザー向けAPI**: 100リクエスト/秒
* **管理者向けAPI**: 50リクエスト/秒

レート制限超過時：
```json
HTTP 429 Too Many Requests
{
  "error": "TooManyRequests",
  "message": "レート制限を超過しました。しばらくしてから再試行してください"
}
```

### 5.4 CORS設定

* **一般ユーザー向けAPI**: 全オリジンから許可
* **管理者向けAPI**: 管理画面のドメインのみ許可

---

## 6. キャッシュ戦略

### 6.1 CloudFrontキャッシュ

一般ユーザー向けAPIのGETリクエストはCloudFrontでキャッシュする。

| エンドポイント | キャッシュTTL | 備考 |
|--------------|-------------|------|
| `GET /api/posts` | 5分 | 一覧は頻繁に更新されないため |
| `GET /api/posts/{postId}` | 1時間 | 記事詳細はほぼ不変 |
| `GET /api/tags` | 1時間 | タグは頻繁に変更されない |
| `GET /api/tags/{tagName}/posts` | 5分 | タグ別一覧 |

### 6.2 キャッシュ無効化

記事の更新・削除時には、該当するCloudFrontキャッシュを無効化（Invalidation）する。

---

## 7. 実装優先順位

### Phase 1: MVP（最小機能）
1. ✅ `GET /api/posts` - 公開記事一覧取得
2. ✅ `GET /api/posts/{postId}` - 記事詳細取得
3. ✅ `POST /api/admin/posts` - 記事新規作成
4. ✅ `PUT /api/admin/posts/{postId}` - 記事更新

### Phase 2: 管理機能強化
5. ⬜ `GET /api/admin/posts` - 全記事一覧取得
6. ⬜ `DELETE /api/admin/posts/{postId}` - 記事削除
7. ⬜ `POST /api/admin/media/upload` - メディアアップロード

### Phase 3: 検索・フィルタ機能
8. ⬜ `GET /api/tags` - タグ一覧取得
9. ⬜ `GET /api/tags/{tagName}/posts` - タグ別記事一覧取得

---

## 8. 参考資料

* [AWS API Gateway REST API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-rest-api.html)
* [RESTful API設計ベストプラクティス](https://restfulapi.net/)
* [DynamoDB Query & Scan](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html)
* [Amazon Cognito User Pool Authorization](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html)

---

## 9. 次のステップ

- [ ] Lambda関数の実装（Python）
- [ ] API Gatewayのリソース定義（CDK）
- [ ] Cognitoオーソライザーの設定
- [ ] CloudFrontとAPI Gatewayの統合
- [ ] APIテスト（Postman/Insomnia）

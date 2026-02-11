// リクエストの型定義

/**
 * 記事ブロックの型定義
 */
export interface ContentBlock {
  type: 'text' | 'image' | 'code' | 'quote';  // ブロックタイプ
  content: string;                             // コンテンツ本体
  order: number;                               // 表示順序（0から開始）
  layout?: 'full' | 'half_left' | 'half_right';  // レイアウト（オプション、デフォルト: full）
  metadata?: {                                 // メタデータ（オプション）
    language?: string;                         // コードブロック用（例: javascript, python）
    alt?: string;                              // 画像ブロック用（代替テキスト）
    caption?: string;                          // 画像ブロック用（キャプション）
  };
}

/**
 * PUT /posts/{postId} パスパラメータ
 */
export interface UpdatePostPathParameters {
  postId: string;  // 記事ID
}

/**
 * PUT /posts/{postId} リクエストボディ
 * 
 * 注意: すべてのフィールドがオプション（部分更新可能）
 * ただし、少なくとも1つのフィールドは必要
 */
export interface UpdatePostRequest {
  title?: string;                                           // タイトル（オプション）
  summary?: string;                                         // サマリー（オプション）
  content?: ContentBlock[];                                 // コンテンツブロック（オプション）
  status?: 'draft' | 'published' | 'archived';             // ステータス（オプション）
  tags?: string[];                                          // タグ（オプション）
  thumbnailUrl?: string;                                    // サムネイル画像URL（オプション）
}

// DynamoDB保存用の型定義

/**
 * DynamoDB記事メタデータアイテム
 */
export interface PostMetadataItem {
  pk: string;           // POST#<PostID>
  sk: string;           // METADATA
  postId: string;       // 記事ID（ULID）
  title: string;        // タイトル
  summary: string;      // サマリー
  status: 'draft' | 'published' | 'archived';  // ステータス
  authorId: string;     // 著者ID（Cognitoのsub）
  createdAt: string;    // 作成日時（ISO 8601）
  updatedAt: string;    // 更新日時（ISO 8601）
  publishedAt?: string; // 公開日時（ISO 8601、公開時のみ）
  tags?: string[];      // タグ
  thumbnailUrl?: string; // サムネイル画像URL
}

/**
 * DynamoDBステータスインデックス用アイテム（GSI1）
 */
export interface PostStatusItem {
  pk: string;           // POST#<PostID>
  sk: string;           // STATUS#<status>
  postId: string;       // 記事ID（ULID）
  title: string;        // タイトル
  summary: string;      // サマリー
  status: 'draft' | 'published' | 'archived';  // ステータス
  authorId: string;     // 著者ID
  createdAt: string;    // 作成日時
  updatedAt: string;    // 更新日時
  publishedAt?: string; // 公開日時
  thumbnailUrl?: string; // サムネイル画像URL
}

/**
 * DynamoDB記事ブロックアイテム
 */
export interface PostBlockItem {
  pk: string;           // POST#<PostID>
  sk: string;           // BLOCK#<Order>（例: BLOCK#00000, BLOCK#00001）
  postId: string;       // 記事ID
  type: 'text' | 'image' | 'code' | 'quote';  // ブロックタイプ
  content: string;      // コンテンツ本体
  order: number;        // 表示順序
  layout?: 'full' | 'half_left' | 'half_right';  // レイアウト（オプション、デフォルト: full）
  metadata?: {          // メタデータ
    language?: string;
    alt?: string;
    caption?: string;
  };
}

/**
 * DynamoDBタグアイテム（GSI1）
 */
export interface PostTagItem {
  pk: string;           // POST#<PostID>
  sk: string;           // TAG#<TagName>
  postId: string;       // 記事ID
  tagName: string;      // タグ名
  createdAt: string;    // 作成日時
}

// レスポンスの型定義

/**
 * PUT /posts/{postId} レスポンス
 */
export interface UpdatePostResponse {
  data: {
    postId: string;       // 更新された記事のID
    title: string;        // タイトル
    summary: string;      // サマリー
    status: 'draft' | 'published' | 'archived';  // ステータス
    authorId: string;     // 著者ID
    createdAt: string;    // 作成日時
    updatedAt: string;    // 更新日時
    publishedAt?: string; // 公開日時
    tags?: string[];      // タグ
    thumbnailUrl?: string; // サムネイル画像URL
  };
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: {
    field?: string;
    reason?: string;
  }[];
}

// バリデーション用の型定義

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  reason: string;
}

/**
 * Cognitoユーザー情報（API Gatewayから渡される）
 */
export interface CognitoUser {
  sub: string;          // ユーザーID
  email: string;        // メールアドレス
  'cognito:username': string;  // ユーザー名
}

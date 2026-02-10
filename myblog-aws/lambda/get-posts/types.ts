// DynamoDB記事アイテムの型定義
export interface PostItem {
  pk: string;           // POST#<PostID>
  sk: string;           // METADATA or STATUS#<status>
  postId: string;       // 記事ID（ULID）
  title: string;        // タイトル
  summary: string;      // サマリー
  status: 'draft' | 'published' | 'archived';  // ステータス
  authorId: string;     // 著者ID（Cognitoのsub）
  createdAt: string;    // 作成日時（ISO 8601）
  updatedAt: string;    // 更新日時（ISO 8601）
  publishedAt?: string; // 公開日時（ISO 8601）
  tags?: string[];      // タグ
  thumbnailUrl?: string; // サムネイル画像URL
}

// API Gatewayイベントのクエリパラメータ
export interface GetPostsQueryParams {
  limit?: string;       // 取得件数（デフォルト: 10）
  status?: 'draft' | 'published' | 'archived';  // ステータス（デフォルト: published）
  nextToken?: string;   // ページネーション用トークン
}

// レスポンスの型定義
export interface GetPostsResponse {
  data: PostItem[];
  meta: {
    count: number;
    limit: number;
    nextToken?: string;
  };
}

// エラーレスポンスの型定義
export interface ErrorResponse {
  error: string;
  message?: string;
}

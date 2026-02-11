// リクエストの型定義

/**
 * パスパラメータ
 */
export interface PathParameters {
  postId: string;
}

// レスポンスの型定義

/**
 * コンテンツブロック
 */
export interface ContentBlock {
  order: number;
  type: 'text' | 'image' | 'video';
  content: string;
  layout: 'full' | 'half_left' | 'half_right';
}

/**
 * 記事詳細
 */
export interface PostDetail {
  postId: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  contentBlocks: ContentBlock[];
  tags: string[];
}

/**
 * GET /posts/{postId} レスポンス
 */
export interface GetPostResponse {
  data: PostDetail;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  error: string;
  message?: string;
}

// DynamoDBのアイテム型定義

/**
 * DynamoDB METADATAアイテム
 */
export interface DynamoDBMetadataItem {
  pk: string;           // POST#<postId>
  sk: string;           // METADATA
  postId: string;
  title: string;
  summary: string;
  thumbnail: string | null;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * DynamoDB BLOCKアイテム
 */
export interface DynamoDBBlockItem {
  pk: string;           // POST#<postId>
  sk: string;           // BLOCK#<order>
  order: number;
  type: 'text' | 'image' | 'video';
  content: string;
  layout: 'full' | 'half_left' | 'half_right';
}

/**
 * DynamoDB TAGアイテム
 */
export interface DynamoDBTagItem {
  pk: string;           // POST#<postId>
  sk: string;           // TAG#<tagName>
}

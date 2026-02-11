// リクエストの型定義

/**
 * DELETE /posts/{postId} パスパラメータ
 */
export interface DeletePostPathParameters {
  postId: string;  // 記事ID
}

// レスポンスの型定義

/**
 * DELETE /posts/{postId} レスポンス
 */
export interface DeletePostResponse {
  message: string;
  data: {
    postId: string;       // 削除された記事のID
    deletedAt: string;    // 削除日時（ISO 8601）
  };
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse {
  error: string;
  message?: string;
}

/**
 * Cognitoユーザー情報（API Gatewayから渡される）
 */
export interface CognitoUser {
  sub: string;          // ユーザーID
  email: string;        // メールアドレス
  'cognito:username': string;  // ユーザー名
}

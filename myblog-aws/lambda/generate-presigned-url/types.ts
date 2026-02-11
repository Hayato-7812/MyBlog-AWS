// リクエストの型定義

/**
 * POST /presigned-url リクエストボディ
 */
export interface GeneratePresignedUrlRequest {
  fileName: string;     // ファイル名（拡張子含む）例: "image.jpg"
  fileType: string;     // MIMEタイプ 例: "image/jpeg"
  fileSize?: number;    // ファイルサイズ（バイト）オプション
}

// レスポンスの型定義

/**
 * POST /presigned-url レスポンス
 */
export interface GeneratePresignedUrlResponse {
  data: {
    uploadUrl: string;      // Pre-signed URL（アップロード用）
    fileUrl: string;        // ファイルの公開URL（アップロード後のアクセス用）
    fileName: string;       // 生成されたファイル名（ULID + 元のファイル名）
    expiresIn: number;      // URLの有効期限（秒）
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

/**
 * 許可されたファイルタイプの定義
 */
export const ALLOWED_FILE_TYPES = {
  // 画像
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  
  // 動画
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
} as const;

/**
 * ファイルサイズ制限（バイト）
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,  // 10MB
  video: 100 * 1024 * 1024, // 100MB
} as const;

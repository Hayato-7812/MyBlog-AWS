import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ulid } from 'ulid';
import {
  GeneratePresignedUrlRequest,
  GeneratePresignedUrlResponse,
  ValidationError,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
} from './types';

// ==========================================================
// 1: S3 Clientの初期化
// ==========================================================
const s3Client = new S3Client({ region: process.env.AWS_REGION || process.env.REGION });



// ==========================================================
// 2: 環境変数の取得
// ==========================================================
const BUCKET_NAME = process.env.BUCKET_NAME!;
const REGION = process.env.REGION!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;

// ==========================================================
// 3: Pre-signed URLの有効期限（秒）
// ==========================================================
const EXPIRATION_TIME = 15 * 60; // 15分


/**
 * Pre-signed URLを生成する
 * 
 * @param request - リクエストデータ
 * @returns Pre-signed URL情報
 */
export async function generatePresignedUrl(
  request: GeneratePresignedUrlRequest
): Promise<GeneratePresignedUrlResponse> {
  console.log('generatePresignedUrl called:', request);
  
  // ==========================================================
  // 4: リクエストのバリデーション
  // ==========================================================
  const validationErrors = validateRequest(request);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
  }
  
  // ==========================================================
  // TODO 5: ファイル名の生成
  // ==========================================================
  const generatedFileName = `${ulid()}${getFileExtension(request.fileName)}`;
  
  
  // ==========================================================
  // 6: S3オブジェクトキーの生成
  // ==========================================================
  // ヒント:
  // - パス: media/<fileName>
  // - 例: "media/01HXXX_image.jpg"
  
  const objectKey = `media/${generatedFileName}`;
  
  
  // ==========================================================
  // 7: PutObjectCommandの作成
  // ==========================================================
  // ヒント:
  // - Bucket: BUCKET_NAME
  // - Key: objectKey
  // - ContentType: request.fileType
  // - ContentLength: request.fileSize (オプション)
  
  /* ここにPutObjectCommandを実装 */
  const putObjectCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: objectKey,
    ContentType: request.fileType,
    ...(request.fileSize ? { ContentLength: request.fileSize } : {}),
  });
  
  
  // ==========================================================
  // 8: Pre-signed URLの生成
  // ==========================================================
  const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: EXPIRATION_TIME });
  
  
  // ==========================================================
  // 9: 公開URLの生成
  // ==========================================================
  const fileUrl = `https://${CLOUDFRONT_DOMAIN}/${objectKey}`;
  
  console.log('Pre-signed URL generated successfully');
  
  // レスポンスの構築（API設計書に準拠）
  return {
    uploadUrl,
    mediaUrl: fileUrl,
    mediaId: generatedFileName.replace(getFileExtension(generatedFileName), ''),
    expiresIn: EXPIRATION_TIME,
  };
}

/**
 * リクエストのバリデーション
 * 
 * @param request - リクエストデータ
 * @returns バリデーションエラーの配列
 */
function validateRequest(request: GeneratePresignedUrlRequest): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // ==========================================================
  // 10: fileNameのバリデーション
  // ==========================================================
    if (!request.fileName) {
        errors.push({ field: 'fileName', reason: 'File name is required' });
        } else if (request.fileName.length < 1 || request.fileName.length > 255) {
        errors.push({ field: 'fileName', reason: 'File name must be 1-255 characters' });
        } else {
        const extension = getFileExtension(request.fileName);
        if (!extension) {
        errors.push({ field: 'fileName', reason: 'File name must have a valid extension' });
        }
    }
  
  
  // ==========================================================
  // 11: fileTypeのバリデーション
  // ==========================================================
  // ヒント:
  // - 必須チェック
  // - ALLOWED_FILE_TYPESに含まれるか
  
    if (!request.fileType) {
        errors.push({ field: 'fileType', reason: 'File type is required' });
    } else if (!ALLOWED_FILE_TYPES[request.fileType as keyof typeof ALLOWED_FILE_TYPES]) {
        const allowedTypes = Object.keys(ALLOWED_FILE_TYPES).join(', ');
        errors.push({ field: 'fileType', reason: `File type is not allowed. Allowed types: ${allowedTypes}` });
    }
  
  
  // ==========================================================
  // TODO 12: fileSizeのバリデーション（提供された場合）
  // ==========================================================
    if (request.fileSize !== undefined) {
        const sizeLimit = getFileSizeLimit(request.fileType);
        if (request.fileSize <= 0) {
        errors.push({ field: 'fileSize', reason: 'File size must be greater than 0' });
        } else if (request.fileSize > sizeLimit) {
        errors.push({ field: 'fileSize', reason: `File size exceeds the limit of ${sizeLimit} bytes` });
        }
    }
  
  
  // ==========================================================
  // 13: ファイル名と拡張子の整合性チェック
  // ==========================================================
  const extension = getFileExtension(request.fileName);
  if (extension && request.fileType) {
    const allowedExtensions = ALLOWED_FILE_TYPES[request.fileType as keyof typeof ALLOWED_FILE_TYPES];
    if (allowedExtensions && !(allowedExtensions as readonly string[]).includes(extension)) {
      errors.push({ 
        field: 'fileName', 
        reason: `File extension does not match the file type. Allowed extensions for ${request.fileType}: ${allowedExtensions.join(', ')}` 
      });
    }
  }
  
  return errors;
}

/**
 * ファイル名から拡張子を取得
 * 
 * @param fileName - ファイル名
 * @returns 拡張子（ドット含む）
 */
function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.substring(lastDotIndex).toLowerCase();
}

/**
 * ファイルサイズの上限を取得
 * 
 * @param fileType - MIMEタイプ
 * @returns ファイルサイズの上限（バイト）
 */
function getFileSizeLimit(fileType: string): number {
  if (fileType.startsWith('image/')) {
    return FILE_SIZE_LIMITS.image;
  } else if (fileType.startsWith('video/')) {
    return FILE_SIZE_LIMITS.video;
  } else {
    return FILE_SIZE_LIMITS.image;
  }
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ulid } from 'ulid';
import {
  CreatePostRequest,
  PostMetadataItem,
  PostStatusItem,
  PostBlockItem,
  PostTagItem,
  CreatePostResponse,
  CognitoUser,
  ValidationError,
} from './types';

// DynamoDB Clientの初期化（コールドスタート対策）
const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

// 環境変数
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * 記事を作成する
 * 
 * @param request - 記事作成リクエスト
 * @param user - Cognitoユーザー情報
 * @returns 作成された記事情報
 */
export async function createPost(
  request: CreatePostRequest,
  user: CognitoUser
): Promise<CreatePostResponse> {
  console.log('createPost called:', { title: request.title, status: request.status, userId: user.sub });
  
  // バリデーション
  const validationErrors = validateRequest(request);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
  }
  
  // 記事IDの生成（ULID使用）
  const postId = ulid(); // 先頭にミリ秒単位のタイムスタンプがある
  const now = new Date().toISOString();
  
  const publishedAt =  request.status == 'published' ? now : undefined;
  
  // DynamoDBアイテムの作成
  const items = createDynamoDBItems(postId, request, user.sub, now, publishedAt);

  // TransactWriteCommandの形式: 各アイテムごとにPut操作を作成
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-lib-dynamodb/Class/TransactWriteCommand/
  const transactItems = items.map((item) => ({
    Put: {
      TableName: TABLE_NAME,
      Item: item,
    },
  }));
  
  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });
  
  console.log('Saving to DynamoDB...');
  await docClient.send(command);
  console.log('Post created successfully:', postId);
  
  // レスポンスの構築
  return {
    data: {
      postId,
      title: request.title,
      summary: request.summary,
      status: request.status,
      authorId: user.sub,
      createdAt: now,
      updatedAt: now,
      publishedAt,
      tags: request.tags,
      thumbnailUrl: request.thumbnailUrl,
    },
  };
}

/**
 * リクエストのバリデーション
 * 
 * @param request - 記事作成リクエスト
 * @returns バリデーションエラーの配列（エラーがない場合は空配列）
 */
function validateRequest(request: CreatePostRequest): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 1. タイトルのバリデーション
  if (!request.title) {
    errors.push({ field: 'title', reason: 'Title is required' });
  } else if (request.title.length < 1 || request.title.length > 200) {
    errors.push({ field: 'title', reason: 'Title must be 1-200 characters' });
  }
  
  // 2. サマリーのバリデーション
  if (!request.summary) {
    errors.push({ field: 'summary', reason: 'Summary is required' });
  } else if (request.summary.length < 1 || request.summary.length > 500) {
    errors.push({ field: 'summary', reason: 'Summary must be 1-500 characters' });
  }
  
  // 3. コンテンツのバリデーション
  if (!request.content) {
    errors.push({ field: 'content', reason: 'Content is required' });
    return errors;  // これ以上のチェックは不要
  }
  
  if (!Array.isArray(request.content)) {
    errors.push({ field: 'content', reason: 'Content must be an array' });
    return errors;  // これ以上のチェックは不要
  }
  
  if (request.content.length < 1) {
    errors.push({ field: 'content', reason: 'At least one content block is required' });
  }
  
  // 各ブロックの検証
  const validTypes = ['text', 'image', 'code', 'quote'];
  const validLayouts = ['full', 'half_left', 'half_right'];
  request.content.forEach((block, index) => {
    // typeの検証
    if (!block.type) {
      errors.push({ field: `content[${index}].type`, reason: 'Block type is required' });
    } else if (!validTypes.includes(block.type)) {
      errors.push({ 
        field: `content[${index}].type`, 
        reason: `Invalid block type. Must be one of: ${validTypes.join(', ')}` 
      });
    }
    
    // contentの検証
    if (!block.content) {
      errors.push({ field: `content[${index}].content`, reason: 'Block content is required' });
    }
    
    // orderの検証
    if (typeof block.order !== 'number') {
      errors.push({ field: `content[${index}].order`, reason: 'Order must be a number' });
    } else if (block.order < 0) {
      errors.push({ field: `content[${index}].order`, reason: 'Order must be non-negative' });
    } else if (!Number.isInteger(block.order)) {
      errors.push({ field: `content[${index}].order`, reason: 'Order must be an integer' });
    }
    
    // layoutの検証（オプション）
    if (block.layout && !validLayouts.includes(block.layout)) {
      errors.push({ 
        field: `content[${index}].layout`, 
        reason: `Invalid layout. Must be one of: ${validLayouts.join(', ')}` 
      });
    }
  });
  
  // order重複チェック
  if (request.content && request.content.length > 0) {
    const orders = request.content.map(block => block.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      errors.push({ field: 'content', reason: 'Duplicate block orders are not allowed' });
    }
  }
  
  // 4. ステータスのバリデーション
  if (!request.status) {
    errors.push({ field: 'status', reason: 'Status is required' });
  } else {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(request.status)) {
      errors.push({ 
        field: 'status', 
        reason: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
  }
  
  // 5. タグのバリデーション（オプション）
  if (request.tags) {
    if (!Array.isArray(request.tags)) {
      errors.push({ field: 'tags', reason: 'Tags must be an array' });
    } else if (request.tags.length > 10) {
      errors.push({ field: 'tags', reason: 'Maximum 10 tags allowed' });
    } else {
      // 各タグの検証
      request.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.length < 1 || tag.length > 50) {
          errors.push({ field: `tags[${index}]`, reason: 'Tag must be 1-50 characters' });
        }
      });
      
      // タグの重複チェック
      const uniqueTags = new Set(request.tags);
      if (uniqueTags.size !== request.tags.length) {
        errors.push({ field: 'tags', reason: 'Duplicate tags are not allowed' });
      }
    }
  }
  
  // 6. thumbnailUrlのバリデーション（オプション）
  if (request.thumbnailUrl) {
    try {
      new URL(request.thumbnailUrl);
    } catch {
      errors.push({ field: 'thumbnailUrl', reason: 'Invalid URL format' });
    }
  }
  
  return errors;
}

/**
 * DynamoDBアイテムの作成
 * 
 * @param postId - 記事ID
 * @param request - 記事作成リクエスト
 * @param authorId - 著者ID
 * @param now - 現在日時（ISO 8601）
 * @param publishedAt - 公開日時（ISO 8601、公開時のみ）
 * @returns DynamoDBアイテムの配列
 */
function createDynamoDBItems(
  postId: string,
  request: CreatePostRequest,
  authorId: string,
  now: string,
  publishedAt?: string
): any[] {
  const items: any[] = [];
  
  // 1. 記事メタデータアイテム
  const metadataItem: PostMetadataItem = {
    pk: `POST#${postId}`,
    sk: 'METADATA',
    postId,
    title: request.title,
    summary: request.summary,
    status: request.status,
    authorId,
    createdAt: now,
    updatedAt: now,
    publishedAt,
    tags: request.tags,
    thumbnailUrl: request.thumbnailUrl,
  };
  items.push(metadataItem);
  
  // 2. ステータスインデックス用アイテム（GSI1）
  const statusItem: PostStatusItem = {
    pk: `POST#${postId}`,
    sk: `STATUS#${request.status}`,
    postId,
    title: request.title,
    summary: request.summary,
    status: request.status,
    authorId,
    createdAt: now,
    updatedAt: now,
    publishedAt,
    thumbnailUrl: request.thumbnailUrl,
  };
  items.push(statusItem);
  
  // 3. 記事ブロックアイテム
  // block.orderを使用（フロントエンドが指定した意図的な順序）
  // layoutを保存して、フロントエンドでの多段組レンダリングに使用
  request.content.forEach((block) => {
    const blockItem: PostBlockItem = {
      pk: `POST#${postId}`,
      sk: `BLOCK#${block.order.toString().padStart(5, '0')}`,
      postId,
      type: block.type,
      content: block.content,
      order: block.order,
      layout: block.layout,  // layoutを追加（オプション、デフォルト: full）
      metadata: block.metadata,
    };
    items.push(blockItem);
  });
  
  // 4. タグアイテム（GSI1）
  // ベーステーブル: pk=POST#<PostID>, sk=TAG#<TagName>
  // GSI1で反転: pk=TAG#<TagName>, sk=POST#<PostID> となり、タグ検索が可能
  if (request.tags && request.tags.length > 0) {
    request.tags.forEach((tag) => {
      const tagItem: PostTagItem = {
        pk: `POST#${postId}`,  // 修正: POST#<PostID>
        sk: `TAG#${tag}`,      // 修正: TAG#<TagName>
        postId,
        tagName: tag,
        createdAt: now,
      };
      items.push(tagItem);
    });
  }
  
  return items;
}

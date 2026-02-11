import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  UpdatePostRequest,
  PostMetadataItem,
  PostStatusItem,
  PostBlockItem,
  PostTagItem,
  UpdatePostResponse,
  CognitoUser,
  ValidationError,
} from './types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * 記事を更新する
 * 
 * @param postId - 記事ID
 * @param request - 更新リクエスト
 * @param user - Cognitoユーザー情報
 * @returns 更新された記事情報
 */
export async function updatePost(
  postId: string,
  request: UpdatePostRequest,
  user: CognitoUser
): Promise<UpdatePostResponse> {
  console.log('updatePost called:', { postId, userId: user.sub });
  
  const existingPost = await getExistingPost(postId);
  
  if (existingPost.authorId !== user.sub) {
    throw new Error('Forbidden: You can only update your own posts');
  }
  
  const validationErrors = validateUpdateRequest(request);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
  }
  
  const now = new Date().toISOString();
  
  let publishedAt = existingPost.publishedAt;
  if (request.status === 'published' && 
      (existingPost.status === 'draft' || existingPost.status === 'archived')) {
    publishedAt = now;
  }
  
  const updatedTitle = request.title !== undefined ? request.title : existingPost.title;
  const updatedSummary = request.summary !== undefined ? request.summary : existingPost.summary;
  const updatedStatus = request.status !== undefined ? request.status : existingPost.status;
  const updatedTags = request.tags !== undefined ? request.tags : existingPost.tags;
  const updatedThumbnailUrl = request.thumbnailUrl !== undefined ? request.thumbnailUrl : existingPost.thumbnailUrl;
  
  const existingItems = await getAllPostItems(postId);
  
  const newItems = createDynamoDBUpdateItems(postId, {
    title: updatedTitle,
    summary: updatedSummary,
    status: updatedStatus,
    authorId: existingPost.authorId,
    createdAt: existingPost.createdAt,
    publishedAt: publishedAt,
    tags: updatedTags,
    thumbnailUrl: updatedThumbnailUrl,
    content: request.content,
  }, now);
  
  // 新しいアイテムのpk+skのセットを作成
  const newItemKeys = new Set(newItems.map(item => `${item.pk}#${item.sk}`));
  
  // 既存アイテムから、新しいアイテムと重複するものを除外
  const itemsToDelete = existingItems.filter(item => 
    !newItemKeys.has(`${item.pk}#${item.sk}`)
  );
  
  const transactItems = [
    ...itemsToDelete.map(item => ({
      Delete: {
        TableName: TABLE_NAME,
        Key: {
          pk: item.pk,
          sk: item.sk,
        },
      },
    })),
    ...newItems.map(item => ({
      Put: {
        TableName: TABLE_NAME,
        Item: item,
      },
    })),
  ];
  
  if (transactItems.length > 100) {
    throw new Error('Too many items to update in a single transaction (max 100)');
  }
  
  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });
  
  await docClient.send(command);
  
  console.log('Post updated successfully:', postId);
  
  return {
    data: {
      postId,
      title: updatedTitle,
      summary: updatedSummary,
      status: updatedStatus,
      authorId: existingPost.authorId,
      createdAt: existingPost.createdAt,
      updatedAt: now,
      publishedAt: publishedAt,
      tags: updatedTags,
      thumbnailUrl: updatedThumbnailUrl,
    },
  };
}

/**
 * 既存記事のメタデータを取得
 * 
 * @param postId - 記事ID
 * @returns 既存記事のメタデータ
 */
async function getExistingPost(postId: string): Promise<PostMetadataItem> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk AND sk = :sk',
    ExpressionAttributeValues: {
      ':pk': `POST#${postId}`,
      ':sk': 'METADATA',
    },
  });
  
  const result = await docClient.send(command);
  
  if (!result.Items || result.Items.length === 0) {
    throw new Error('Post not found');
  }
  
  return result.Items[0] as PostMetadataItem;
}

/**
 * 既存記事の全アイテムを取得
 * 
 * @param postId - 記事ID
 * @returns DynamoDBアイテムの配列
 */
async function getAllPostItems(postId: string): Promise<any[]> {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': `POST#${postId}`,
    },
  });
  
  const result = await docClient.send(command);
  return result.Items || [];
}

/**
 * 更新リクエストのバリデーション
 * 
 * @param request - 更新リクエスト
 * @returns バリデーションエラーの配列
 */
function validateUpdateRequest(request: UpdatePostRequest): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!request.title && !request.summary && !request.content && 
      !request.status && !request.tags && request.thumbnailUrl === undefined) {
    errors.push({ 
      field: 'request', 
      reason: 'At least one field is required for update' 
    });
    return errors;
  }
  
  if (request.title !== undefined) {
    if (request.title.length < 1 || request.title.length > 200) {
      errors.push({ field: 'title', reason: 'Title must be 1-200 characters' });
    }
  }
  
  if (request.summary !== undefined) {
    if (request.summary.length < 1 || request.summary.length > 500) {
      errors.push({ field: 'summary', reason: 'Summary must be 1-500 characters' });
    }
  }
  
  if (request.content !== undefined) {
    if (!Array.isArray(request.content)) {
      errors.push({ field: 'content', reason: 'Content must be an array' });
      return errors;
    }
    
    if (request.content.length < 1) {
      errors.push({ field: 'content', reason: 'At least one content block is required' });
    }
    
    const validTypes = ['text', 'image', 'code', 'quote'];
    const validLayouts = ['full', 'half_left', 'half_right'];
    request.content.forEach((block, index) => {
      if (!block.type) {
        errors.push({ field: `content[${index}].type`, reason: 'Block type is required' });
      } else if (!validTypes.includes(block.type)) {
        errors.push({ 
          field: `content[${index}].type`, 
          reason: `Invalid block type. Must be one of: ${validTypes.join(', ')}` 
        });
      }
      
      if (!block.content) {
        errors.push({ field: `content[${index}].content`, reason: 'Block content is required' });
      }
      
      if (typeof block.order !== 'number') {
        errors.push({ field: `content[${index}].order`, reason: 'Order must be a number' });
      } else if (block.order < 0) {
        errors.push({ field: `content[${index}].order`, reason: 'Order must be non-negative' });
      } else if (!Number.isInteger(block.order)) {
        errors.push({ field: `content[${index}].order`, reason: 'Order must be an integer' });
      }
      
      if (block.layout && !validLayouts.includes(block.layout)) {
        errors.push({ 
          field: `content[${index}].layout`, 
          reason: `Invalid layout. Must be one of: ${validLayouts.join(', ')}` 
        });
      }
    });
    
    if (request.content && request.content.length > 0) {
      const orders = request.content.map(block => block.order);
      const uniqueOrders = new Set(orders);
      if (uniqueOrders.size !== orders.length) {
        errors.push({ field: 'content', reason: 'Duplicate block orders are not allowed' });
      }
    }
  }
  
  if (request.status !== undefined) {
    const validStatuses = ['draft', 'published', 'archived'];
    if (!validStatuses.includes(request.status)) {
      errors.push({ 
        field: 'status', 
        reason: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
  }
  
  if (request.tags !== undefined) {
    if (!Array.isArray(request.tags)) {
      errors.push({ field: 'tags', reason: 'Tags must be an array' });
    } else if (request.tags.length > 10) {
      errors.push({ field: 'tags', reason: 'Maximum 10 tags allowed' });
    } else {
      request.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || tag.length < 1 || tag.length > 50) {
          errors.push({ field: `tags[${index}]`, reason: 'Tag must be 1-50 characters' });
        }
      });
      
      const uniqueTags = new Set(request.tags);
      if (uniqueTags.size !== request.tags.length) {
        errors.push({ field: 'tags', reason: 'Duplicate tags are not allowed' });
      }
    }
  }
  
  if (request.thumbnailUrl !== undefined && request.thumbnailUrl !== null) {
    try {
      new URL(request.thumbnailUrl);
    } catch {
      errors.push({ field: 'thumbnailUrl', reason: 'Invalid URL format' });
    }
  }
  
  return errors;
}

/**
 * DynamoDB更新用アイテムの作成
 * 
 * @param postId - 記事ID
 * @param updatedData - 更新後のデータ
 * @param now - 現在日時
 * @returns DynamoDBアイテムの配列
 */
function createDynamoDBUpdateItems(
  postId: string,
  updatedData: {
    title: string;
    summary: string;
    status: 'draft' | 'published' | 'archived';
    authorId: string;
    createdAt: string;
    publishedAt?: string;
    tags?: string[];
    thumbnailUrl?: string;
    content?: any[];
  },
  now: string
): any[] {
  const items: any[] = [];
  
  const metadataItem: PostMetadataItem = {
    pk: `POST#${postId}`,
    sk: 'METADATA',
    postId,
    title: updatedData.title,
    summary: updatedData.summary,
    status: updatedData.status,
    authorId: updatedData.authorId,
    createdAt: updatedData.createdAt,
    updatedAt: now,
    publishedAt: updatedData.publishedAt,
    tags: updatedData.tags,
    thumbnailUrl: updatedData.thumbnailUrl,
  };
  items.push(metadataItem);
  
  const statusItem: PostStatusItem = {
    pk: `POST#${postId}`,
    sk: `STATUS#${updatedData.status}`,
    postId,
    title: updatedData.title,
    summary: updatedData.summary,
    status: updatedData.status,
    authorId: updatedData.authorId,
    createdAt: updatedData.createdAt,
    updatedAt: now,
    publishedAt: updatedData.publishedAt,
    thumbnailUrl: updatedData.thumbnailUrl,
  };
  items.push(statusItem);
  
  if (updatedData.content && updatedData.content.length > 0) {
    updatedData.content.forEach((block) => {
      const blockItem: PostBlockItem = {
        pk: `POST#${postId}`,
        sk: `BLOCK#${block.order.toString().padStart(5, '0')}`,
        postId,
        type: block.type,
        content: block.content,
        order: block.order,
        layout: block.layout,
        metadata: block.metadata,
      };
      items.push(blockItem);
    });
  }
  
  if (updatedData.tags && updatedData.tags.length > 0) {
    updatedData.tags.forEach((tag) => {
      const tagItem: PostTagItem = {
        pk: `POST#${postId}`,
        sk: `TAG#${tag}`,
        postId,
        tagName: tag,
        createdAt: updatedData.createdAt,
      };
      items.push(tagItem);
    });
  }
  
  return items;
}

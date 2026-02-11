import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  PostDetail,
  GetPostResponse,
  DynamoDBMetadataItem,
  DynamoDBBlockItem,
  DynamoDBTagItem,
  ContentBlock,
} from './types';

// DynamoDB Clientの初期化（関数外で初期化してコールドスタート対策）
const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

// 環境変数
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * 記事詳細を取得する
 * 
 * @param postId - 記事ID
 * @param isAdmin - 管理者かどうか（trueの場合、下書きも取得可能）
 * @returns 記事詳細
 */
export async function getPost(
  postId: string,
  isAdmin: boolean = false
): Promise<GetPostResponse> {
  console.log('getPost called:', { postId, isAdmin });
  
  // postIdのバリデーション
  if (!postId || postId.trim() === '') {
    throw new Error('postId is required');
  }
  
  // DynamoDB Query - 記事のすべてのアイテムを取得
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': `POST#${postId}`,
    },
  });
  
  console.log('Querying DynamoDB:', JSON.stringify(command, null, 2));
  
  const result = await docClient.send(command);
  
  console.log('DynamoDB query result:', {
    itemCount: result.Items?.length || 0,
  });
  
  // データが存在しない場合
  if (!result.Items || result.Items.length === 0) {
    throw new Error('Post not found');
  }
  
  // アイテムを種類別に分類
  const metadataItem = result.Items.find(item => item.sk === 'METADATA') as DynamoDBMetadataItem | undefined;
  
  if (!metadataItem) {
    throw new Error('Post metadata not found');
  }
  
  // 一般ユーザーの場合、公開済みの記事のみアクセス可能
  if (!isAdmin && metadataItem.status !== 'published') {
    throw new Error('Post not found');
  }
  
  // BLOCKアイテムを抽出してソート
  const blockItems = result.Items
    .filter(item => item.sk.startsWith('BLOCK#'))
    .map(item => item as DynamoDBBlockItem)
    .sort((a, b) => a.order - b.order);
  
  // TAGアイテムを抽出
  const tagItems = result.Items
    .filter(item => item.sk.startsWith('TAG#'))
    .map(item => item as DynamoDBTagItem);
  
  // contentBlocksの構築
  const contentBlocks: ContentBlock[] = blockItems.map(block => ({
    order: block.order,
    type: block.type,
    content: block.content,
    layout: block.layout,
  }));
  
  // tagsの構築（TAG#を除去）
  const tags: string[] = tagItems.map(tag => tag.sk.replace('TAG#', ''));
  
  // 記事詳細の構築
  const postDetail: PostDetail = {
    postId: metadataItem.postId,
    title: metadataItem.title,
    summary: metadataItem.summary,
    thumbnail: metadataItem.thumbnail,
    status: metadataItem.status,
    authorId: metadataItem.authorId,
    createdAt: metadataItem.createdAt,
    updatedAt: metadataItem.updatedAt,
    publishedAt: metadataItem.publishedAt,
    contentBlocks,
    tags,
  };
  
  console.log('Post detail retrieved successfully:', {
    postId: postDetail.postId,
    blockCount: contentBlocks.length,
    tagCount: tags.length,
  });
  
  return {
    data: postDetail,
  };
}

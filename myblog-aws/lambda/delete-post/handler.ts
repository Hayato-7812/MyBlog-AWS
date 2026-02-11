import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DeletePostResponse, CognitoUser } from './types';

// DynamoDB Clientの初期化（コールドスタート対策）
const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

// 環境変数
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * 記事を削除する
 * 
 * @param postId - 記事ID
 * @param user - Cognitoユーザー情報
 * @returns 削除された記事情報
 */
export async function deletePost(
  postId: string,
  user: CognitoUser
): Promise<DeletePostResponse> {
  console.log('deletePost called:', { postId, userId: user.sub });
  
  // 1. 記事の存在確認と全アイテムの取得
  const items = await getAllPostItems(postId);
  
  if (items.length === 0) {
    throw new Error('Post not found');
  }
  
  // 2. 記事の所有者確認（セキュリティ）
  const metadataItem = items.find(item => item.sk === 'METADATA');
  if (!metadataItem) {
    throw new Error('Post metadata not found');
  }
  
  if (metadataItem.authorId !== user.sub) {
    throw new Error('Forbidden: You can only delete your own posts');
  }
  
  // 3. すべてのアイテムを削除
  await deleteAllPostItems(items);
  
  console.log('Post deleted successfully:', postId);
  
  const now = new Date().toISOString();
  
  // レスポンスの構築
  return {
    message: 'Post deleted successfully',
    data: {
      postId,
      deletedAt: now,
    },
  };
}

/**
 * 記事の全アイテムを取得
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
 * 記事の全アイテムを削除
 * 
 * @param items - 削除するDynamoDBアイテムの配列
 */
async function deleteAllPostItems(items: any[]): Promise<void> {
  // TransactWriteCommandは最大25件まで
  // 通常の記事なら十分だが、念のためチェック
  if (items.length > 25) {
    throw new Error('Too many items to delete in a single transaction (max 25)');
  }
  
  // 各アイテムに対してDelete操作を作成
  const transactItems = items.map((item) => ({
    Delete: {
      TableName: TABLE_NAME,
      Key: {
        pk: item.pk,
        sk: item.sk,
      },
    },
  }));
  
  const command = new TransactWriteCommand({
    TransactItems: transactItems,
  });
  
  await docClient.send(command);
}

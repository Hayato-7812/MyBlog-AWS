import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PostItem, GetPostsQueryParams, GetPostsResponse } from './types';

// DynamoDB Clientの初期化（関数外で初期化してコールドスタート対策）
const client = new DynamoDBClient({ region: process.env.AWS_REGION || process.env.REGION });
const docClient = DynamoDBDocumentClient.from(client);

// 環境変数
const TABLE_NAME = process.env.TABLE_NAME!;

/**
 * 記事一覧を取得する
 * 
 * @param queryParams - クエリパラメータ（limit, status, nextToken）
 * @returns 記事一覧とメタ情報
 */
export async function getPostsList(
  queryParams: GetPostsQueryParams
): Promise<GetPostsResponse> {
  console.log('getPostsList called with params:', queryParams);
  
  // パラメータの解析
  const limit = Number(queryParams.limit) || 10;
  const status = queryParams.status || 'published';
  const nextToken = queryParams.nextToken;
  
  // バリデーション
  if (limit < 1 || limit > 100) {
    throw new Error('limit must be between 1 and 100');
  }
  
  if (!['draft', 'published', 'archived'].includes(status)) {
    throw new Error('status must be draft, published, or archived');
  }
  
  // DynamoDB Query
  // GSI1を使用してステータスで検索
  // GSI1: pk=POST#<PostID>, sk=STATUS#<status>
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: 'GSI1',  // GSI1を使用
    KeyConditionExpression: 'sk = :sk',
    ExpressionAttributeValues: {
      ':sk': `STATUS#${status}`,
    },
    Limit: limit,
    ScanIndexForward: false,  // 降順（新しい順）
    ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
  });
  
  console.log('Querying DynamoDB with command:', JSON.stringify(command, null, 2));
  
  const result = await docClient.send(command);
  
  console.log('DynamoDB query result:', {
    count: result.Items?.length || 0,
    hasNextToken: !!result.LastEvaluatedKey,
  });
  
  // レスポンスの構築
  const response: GetPostsResponse = {
    data: (result.Items || []) as PostItem[],
    meta: {
      count: result.Items?.length || 0,
      limit,
    },
  };
  
  // ページネーショントークンの生成
  if (result.LastEvaluatedKey) {
    response.meta.nextToken = Buffer.from(
      JSON.stringify(result.LastEvaluatedKey)
    ).toString('base64');
  }
  
  return response;
}

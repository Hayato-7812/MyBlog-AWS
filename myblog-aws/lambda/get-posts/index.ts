import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPostsList } from './handler';
import { GetPostsQueryParams, ErrorResponse } from './types';

// CORS設定（環境変数から取得、デフォルトは'*'）
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// CORSヘッダー
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Lambda関数のエントリーポイント
 * GET /posts - 記事一覧取得
 * 
 * @param event - API Gatewayイベント
 * @returns API Gatewayレスポンス
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // OPTIONSリクエスト（Preflight）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }
  
  try {
    // クエリパラメータの取得
    const queryParams: GetPostsQueryParams = {
      limit: event.queryStringParameters?.limit,
      status: event.queryStringParameters?.status as any,
      nextToken: event.queryStringParameters?.nextToken,
    };
    
    // 記事一覧の取得
    const result = await getPostsList(queryParams);
    
    // 成功レスポンス
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in get-posts handler:', error);
    
    // エラーの種類で分類
    if (error instanceof Error) {
      // バリデーションエラー
      if (error.message.includes('must be')) {
        const errorResponse: ErrorResponse = {
          error: 'Bad Request',
          message: error.message,
        };
        
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify(errorResponse),
        };
      }
      
      // DynamoDBエラー
      if (error.name === 'ResourceNotFoundException') {
        const errorResponse: ErrorResponse = {
          error: 'Not Found',
          message: 'Table not found',
        };
        
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify(errorResponse),
        };
      }
    }
    
    // その他のエラー（500）
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify(errorResponse),
    };
  }
};

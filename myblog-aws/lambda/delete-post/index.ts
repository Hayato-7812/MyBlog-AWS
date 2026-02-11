import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { deletePost } from './handler';
import { ErrorResponse } from './types';

// CORS設定（環境変数から取得、デフォルトは'*'）
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// CORSヘッダー
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
};

/**
 * Lambda関数のエントリーポイント
 * DELETE /posts/{postId} - 記事削除
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
    // 1. パスパラメータの取得
    const postId = event.pathParameters?.postId;
    
    if (!postId) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'postId is required in path',
      };
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(errorResponse),
      };
    }
    
    // 2. Cognitoユーザー情報の取得
    const user = {
      sub: event.requestContext.authorizer?.claims?.sub || '',
      email: event.requestContext.authorizer?.claims?.email || '',
      'cognito:username': event.requestContext.authorizer?.claims?.['cognito:username'] || '',
    };
    
    // ユーザー認証チェック
    if (!user.sub) {
      const errorResponse: ErrorResponse = {
        error: 'Unauthorized',
        message: 'User authentication required',
      };
      return {
        statusCode: 401,
        headers: CORS_HEADERS,
        body: JSON.stringify(errorResponse),
      };
    }
    
    // 3. deletePost関数の呼び出し
    const result = await deletePost(postId, user);
    
    // 成功レスポンス（200 OK）
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in delete-post handler:', error);
    
    // エラーの種類で分類
    if (error instanceof Error) {
      // 記事が見つからない
      if (error.message.includes('Post not found')) {
        const errorResponse: ErrorResponse = {
          error: 'Not Found',
          message: error.message,
        };
        
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify(errorResponse),
        };
      }
      
      // 権限エラー
      if (error.message.includes('Forbidden')) {
        const errorResponse: ErrorResponse = {
          error: 'Forbidden',
          message: error.message,
        };
        
        return {
          statusCode: 403,
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

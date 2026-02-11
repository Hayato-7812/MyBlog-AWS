import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createPost } from './handler';
import { ErrorResponse } from './types';


// CORS設定（環境変数から取得、デフォルトは'*'）
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// CORSヘッダー
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

/**
 * Lambda関数のエントリーポイント
 * PUT api/admin/posts - 新規記事作成
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
    // 1. リクエストボディの存在チェック
    if (!event.body) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'Request body is required',
      };
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(errorResponse),
      };
    }
    
    // 2. JSON パース（専用のエラーハンドリング）
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'Invalid JSON format',
      };
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(errorResponse),
      };
    }

    // 3. Cognitoユーザー情報の取得
    // HTTP API v2では Lambda Authorizer が返したコンテキストは
    // event.requestContext.authorizer.lambda に格納される
    const authContext = (event.requestContext.authorizer as any)?.lambda || {};
    const user = {
      sub: authContext.sub || '',
      email: authContext.email || '',
      'cognito:username': authContext.username || '',
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

    // 4. createPost関数の呼び出し
    const result = await createPost(requestBody, user);
    
    // 成功レスポンス（201 Created: 新規リソースが作成された）
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in create-post handler:', error);
    
    // エラーの種類で分類
    if (error instanceof Error) {
      // バリデーションエラー
      if (error.message.includes('Validation failed')) {
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

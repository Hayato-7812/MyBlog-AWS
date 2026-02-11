import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPost } from './handler';
import { ErrorResponse } from './types';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

/**
 * Lambda関数のエントリーポイント
 * GET /posts/{postId} - 記事詳細取得
 * 
 * @param event - API Gatewayイベント
 * @returns API Gatewayレスポンス
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }
  
  try {
    // パスパラメータからpostIdを取得
    const postId = event.pathParameters?.postId;
    
    if (!postId) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'postId is required',
      };
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify(errorResponse),
      };
    }
    
    // 認証情報の確認（Lambda Authorizerから渡される）
    // 管理者の場合、下書き記事も取得可能
    // HTTP API v2では Lambda Authorizer が返したコンテキストは
    // event.requestContext.authorizer.lambda に格納される
    const authContext = (event.requestContext.authorizer as any)?.lambda || {};
    const isAdmin = !!authContext.sub;
    
    // 記事詳細を取得
    const result = await getPost(postId, isAdmin);
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in get-post handler:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Post not found' || error.message === 'Post metadata not found') {
        const errorResponse: ErrorResponse = {
          error: 'Not Found',
          message: 'The requested post does not exist',
        };
        
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify(errorResponse),
        };
      }
      
      if (error.message === 'postId is required') {
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
    }
    
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

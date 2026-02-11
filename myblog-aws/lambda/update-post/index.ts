import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { updatePost } from './handler';
import { ErrorResponse } from './types';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'PUT,OPTIONS',
};

/**
 * Lambda関数のエントリーポイント
 * PUT /posts/{postId} - 記事更新
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
    
    // HTTP API v2では Lambda Authorizer が返したコンテキストは
    // event.requestContext.authorizer.lambda に格納される
    const authContext = (event.requestContext.authorizer as any)?.lambda || {};
    const user = {
      sub: authContext.sub || '',
      email: authContext.email || '',
      'cognito:username': authContext.username || '',
    };
    
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
    
    const result = await updatePost(postId, requestBody, user);
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error in update-post handler:', error);
    
    if (error instanceof Error) {
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

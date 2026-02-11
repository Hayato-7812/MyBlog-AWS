import { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

// リクエスト型
export type AuthorizerEvent = APIGatewayRequestAuthorizerEvent;

// レスポンス型
export type AuthorizerResult = APIGatewayAuthorizerResult;

// JWTペイロード型（Cognito IdToken）
export interface CognitoIdTokenPayload {
  sub: string;
  email_verified: boolean;
  iss: string;
  'cognito:username': string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: 'id';
  auth_time: number;
  exp: number;
  iat: number;
  jti: string;
  email: string;
}

// 環境変数
export interface Environment {
  USER_POOL_ID: string;
  CLIENT_ID: string;
  REGION: string;
}

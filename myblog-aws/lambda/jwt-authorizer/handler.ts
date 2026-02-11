import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthorizerEvent, AuthorizerResult, CognitoIdTokenPayload, Environment } from './types';

// 環境変数の取得
const env: Environment = {
  USER_POOL_ID: process.env.USER_POOL_ID!,
  CLIENT_ID: process.env.CLIENT_ID!,
  REGION: process.env.REGION || 'ap-northeast-1',
};

// JWT Verifierの初期化
const verifier = CognitoJwtVerifier.create({
  userPoolId: env.USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.CLIENT_ID,
});

/**
 * HTTP API v2 SIMPLE レスポンス形式
 * IAMポリシーではなく、isAuthorized + contextを返す
 */
interface SimpleAuthorizerResponse {
  isAuthorized: boolean;
  context?: Record<string, string>;
}

/**
 * Lambda Authorizer Handler
 */
export async function handler(event: AuthorizerEvent): Promise<AuthorizerResult> {
  console.log('Lambda Authorizer invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // HTTP API v2では identitySource 配列からトークンを取得
    // CDK設定: identitySource: ['$request.header.Authorization']
    // → event.identitySource[0] に "Bearer <token>" が入る
    const authHeader = event.identitySource?.[0];
    
    if (!authHeader) {
      console.error('❌ No identitySource found');
      console.error('Event identitySource:', event.identitySource);
      throw new Error('Unauthorized');
    }

    // "Bearer "プレフィックスの除去
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    console.log('🔑 Token extracted (first 20 chars):', token.substring(0, 20) + '...');

    // JWTの検証
    console.log('🔍 Verifying JWT token...');
    const payload = await verifier.verify(token) as unknown as CognitoIdTokenPayload;
    
    console.log('✅ JWT verification successful');
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // ペイロードの検証
    if (payload.token_use !== 'id') {
      console.error('❌ Invalid token_use:', payload.token_use);
      throw new Error('Invalid token: Expected IdToken');
    }

    if (payload.aud !== env.CLIENT_ID) {
      console.error('❌ Invalid audience:', payload.aud);
      throw new Error('Invalid token: Audience mismatch');
    }

    const expectedIssuer = `https://cognito-idp.${env.REGION}.amazonaws.com/${env.USER_POOL_ID}`;
    if (payload.iss !== expectedIssuer) {
      console.error('❌ Invalid issuer:', payload.iss);
      throw new Error('Invalid token: Issuer mismatch');
    }

    console.log('✅ All validations passed');

    // HTTP API v2 SIMPLE形式でレスポンス
    const response: SimpleAuthorizerResponse = {
      isAuthorized: true,
      context: {
        email: payload.email,
        sub: payload.sub,
        username: payload['cognito:username'] || payload.email,
      },
    };

    console.log('✅ Returning isAuthorized: true');
    return response as any;

  } catch (error) {
    console.error('❌ Authorization failed:', error);
    
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // HTTP API v2 SIMPLE形式でDeny
    return {
      isAuthorized: false,
    } as any;
  }
}

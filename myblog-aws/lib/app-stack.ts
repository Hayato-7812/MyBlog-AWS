import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataStack } from './data-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { HttpApi, HttpMethod, CorsHttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';


// AppStackのプロパティにDataStackを含める
export interface AppStackProps extends cdk.StackProps {
  dataStack: DataStack;
}

export class AppStack extends cdk.Stack {
  // 公開プロパティ（CloudFrontから参照）
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    // ==========================================================
    // Stack Level Tags
    // ==========================================================
    // スタック全体に適用されるタグ（すべてのリソースに継承）
    cdk.Tags.of(this).add('Project', 'MyBlog');
    cdk.Tags.of(this).add('Stack', 'AppStack');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'MyBlog-Backend');

    // ==========================================================
    // S3バケット（フロントエンドホスティング用）
    // ==========================================================
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      // ❌ 物理名（bucketName）は指定しない
      // 理由: CDKベストプラクティス「Avoid physical names」

      // バージョニング不要（Gitで管理）
      versioned: false,

      // 暗号化（必須 - セキュリティベストプラクティス）
      encryption: s3.BucketEncryption.S3_MANAGED,

      // ブロックパブリックアクセス（必須）
      // 理由:
      // - CloudFront経由でのみアクセス
      // - OAI（Origin Access Identity）で制御
      // - 直接S3 URLでのアクセスを防ぐ
      // - Cognito認証とは別のレイヤー（多層防御）
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // 削除保護（不要 - 再ビルド可能）
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,

      // 静的Webサイトホスティング
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA対応

      // CORS設定不要
      // 理由: CloudFront経由でアクセス、Pre-signed URLはLambda経由

      // ライフサイクルポリシー不要
      // 理由: 常に最新版のみ、バージョニングなし
    });

    // ==========================================================
    // CloudFront Distribution（フロントエンド配信）
    // ==========================================================

    // OAI（Origin Access Identity）の作成
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: 'OAI for MyBlog frontend bucket',
      }
    );
    // S3バケットにOAI権限付与
    this.frontendBucket.grantRead(originAccessIdentity);

    // Behaviorの定義 (Behavior = パスパターン + Origin + キャッシュ設定)
    this.distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.frontendBucket, {
          originAccessIdentity: originAccessIdentity, // OAIを指定
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // HTTPSリダイレクト
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, 
      },
      
      // デフォルトルートオブジェクト -SPA対応
      defaultRootObject: 'index.html',
      
      // Price Class（設計ドキュメント準拠）
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,

      // エラーレスポンス（SPA対応）
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      comment: 'CloudFront Distribution for MyBlog frontend',
    });

    // ==========================================================
    // Lambda関数（get-posts）
    // ==========================================================
    const getPostsFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GetPostsFunction',
      {
        entry: 'lambda/get-posts/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.dataStack.blogTable.tableName,
          REGION: cdk.Stack.of(this).region,
          ALLOWED_ORIGIN: '*',  // Phase 1: すべてのドメインを許可
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // Lambda関数（get-post）
    // ==========================================================
    const getPostFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GetPostFunction',
      {
        entry: 'lambda/get-post/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.dataStack.blogTable.tableName,
          REGION: cdk.Stack.of(this).region,
          ALLOWED_ORIGIN: '*',
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // Lambda関数（create-post）
    // ==========================================================
    const createPostFunction = new lambdaNodejs.NodejsFunction(
      this,
      'CreatePostFunction',
      {
        entry: 'lambda/create-post/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.dataStack.blogTable.tableName,
          REGION: cdk.Stack.of(this).region,
          ALLOWED_ORIGIN: '*',
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // Lambda関数（delete-post）
    // ==========================================================
    const deletePostFunction = new lambdaNodejs.NodejsFunction(
      this,
      'DeletePostFunction',
      {
        entry: 'lambda/delete-post/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.dataStack.blogTable.tableName,
          REGION: cdk.Stack.of(this).region,
          ALLOWED_ORIGIN: '*',
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // Lambda関数（update-post）
    // ==========================================================
    const updatePostFunction = new lambdaNodejs.NodejsFunction(
      this,
      'UpdatePostFunction',
      {
        entry: 'lambda/update-post/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: props.dataStack.blogTable.tableName,
          REGION: cdk.Stack.of(this).region,
          ALLOWED_ORIGIN: '*',
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // Lambda関数（generate-presigned-url）
    // ==========================================================
    const generatePresignedUrlFunction = new lambdaNodejs.NodejsFunction(
      this,
      'GeneratePresignedUrlFunction',
      {
        entry: 'lambda/generate-presigned-url/index.ts',
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          BUCKET_NAME: props.dataStack.mediaBucket.bucketName,
          REGION: cdk.Stack.of(this).region,
          // CloudFront Distribution for media files
          CLOUDFRONT_DOMAIN: props.dataStack.mediaDistribution.distributionDomainName,
          ALLOWED_ORIGIN: '*',
        },
        bundling: {
          minify: true,
          externalModules: ['aws-sdk'],
        },
      }
    );

    // ==========================================================
    // DynamoDB権限を付与
    // ==========================================================
    props.dataStack.blogTable.grantReadData(getPostsFunction);
    props.dataStack.blogTable.grantReadData(getPostFunction);
    props.dataStack.blogTable.grantWriteData(createPostFunction);
    props.dataStack.blogTable.grantReadWriteData(deletePostFunction);
    props.dataStack.blogTable.grantReadWriteData(updatePostFunction);

    // ==========================================================
    // S3権限を付与
    // ==========================================================
    props.dataStack.mediaBucket.grantPut(generatePresignedUrlFunction);

    // ==========================================================
    // HTTP API (API Gateway v2)
    // ==========================================================
    // HTTP APIはREST APIより70%安価で、このプロジェクトに十分な機能を提供
    // コスト: $1.00/100万リクエスト (REST APIは$3.50)
    
    // JWT Authorizer（Cognito認証）
    const jwtAuthorizer = new HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${props.dataStack.userPool.userPoolId}`,
      {
        jwtAudience: [props.dataStack.userPoolClient.userPoolClientId],
        identitySource: ['$request.header.Authorization'],
        authorizerName: 'CognitoJwtAuthorizer',
      }
    );
    
    // HTTP API作成
    const httpApi = new HttpApi(this, 'MyBlogHttpApi', {
      apiName: 'MyBlog HTTP API',
      description: 'HTTP API for MyBlog application (70% cost reduction vs REST API)',
      
      // CORS設定
      corsPreflight: {
        allowOrigins: ['*'],  // Phase 1: すべてのドメインを許可
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        // allowCredentials: true は allowOrigins: ['*'] と同時に使用不可
        // Phase 2で特定のドメインに制限する際に有効化
        maxAge: cdk.Duration.days(1),
      },
    });

    // ==========================================================
    // Lambda Integrations
    // ==========================================================
    const getPostsIntegration = new HttpLambdaIntegration('GetPostsIntegration', getPostsFunction);
    const getPostIntegration = new HttpLambdaIntegration('GetPostIntegration', getPostFunction);
    const createPostIntegration = new HttpLambdaIntegration('CreatePostIntegration', createPostFunction);
    const updatePostIntegration = new HttpLambdaIntegration('UpdatePostIntegration', updatePostFunction);
    const deletePostIntegration = new HttpLambdaIntegration('DeletePostIntegration', deletePostFunction);
    const generatePresignedUrlIntegration = new HttpLambdaIntegration('GeneratePresignedUrlIntegration', generatePresignedUrlFunction);

    // ==========================================================
    // Public Routes（認証不要）
    // ==========================================================
    
    // GET /posts - 記事一覧取得（公開記事のみ）
    httpApi.addRoutes({
      path: '/posts',
      methods: [HttpMethod.GET],
      integration: getPostsIntegration,
    });
    
    // GET /posts/{postId} - 記事詳細取得（公開記事のみ）
    httpApi.addRoutes({
      path: '/posts/{postId}',
      methods: [HttpMethod.GET],
      integration: getPostIntegration,
    });

    // ==========================================================
    // Admin Routes（Cognito認証必須）
    // ==========================================================
    
    // GET /admin/posts - 記事一覧取得（すべてのステータス）
    httpApi.addRoutes({
      path: '/admin/posts',
      methods: [HttpMethod.GET],
      integration: getPostsIntegration,
      authorizer: jwtAuthorizer,
    });
    
    // POST /admin/posts - 記事新規作成
    httpApi.addRoutes({
      path: '/admin/posts',
      methods: [HttpMethod.POST],
      integration: createPostIntegration,
      authorizer: jwtAuthorizer,
    });
    
    // GET /admin/posts/{postId} - 記事詳細取得（下書き含む）
    httpApi.addRoutes({
      path: '/admin/posts/{postId}',
      methods: [HttpMethod.GET],
      integration: getPostIntegration,
      authorizer: jwtAuthorizer,
    });
    
    // PUT /admin/posts/{postId} - 記事更新
    httpApi.addRoutes({
      path: '/admin/posts/{postId}',
      methods: [HttpMethod.PUT],
      integration: updatePostIntegration,
      authorizer: jwtAuthorizer,
    });
    
    // DELETE /admin/posts/{postId} - 記事削除
    httpApi.addRoutes({
      path: '/admin/posts/{postId}',
      methods: [HttpMethod.DELETE],
      integration: deletePostIntegration,
      authorizer: jwtAuthorizer,
    });
    
    // POST /admin/presigned-url - Pre-signed URL生成
    httpApi.addRoutes({
      path: '/admin/presigned-url',
      methods: [HttpMethod.POST],
      integration: generatePresignedUrlIntegration,
      authorizer: jwtAuthorizer,
    });

    // ==========================================================
    // CloudFormation出力
    // ==========================================================
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'S3 bucket name for frontend hosting',
    });

    new cdk.CfnOutput(this, 'FrontendBucketArn', {
      value: this.frontendBucket.bucketArn,
      description: 'S3 bucket ARN for frontend hosting',
    });

    new cdk.CfnOutput(this, 'FrontendBucketWebsiteUrl', {
      value: this.frontendBucket.bucketWebsiteUrl,
      description: 'S3 website URL (not used, CloudFront only)',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name (website URL)',
    });

    new cdk.CfnOutput(this, 'GetPostsFunctionName', {
      value: getPostsFunction.functionName,
      description: 'Get Posts Lambda function name',
    });

    new cdk.CfnOutput(this, 'GetPostsFunctionArn', {
      value: getPostsFunction.functionArn,
      description: 'Get Posts Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'GetPostFunctionName', {
      value: getPostFunction.functionName,
      description: 'Get Post Lambda function name',
    });

    new cdk.CfnOutput(this, 'GetPostFunctionArn', {
      value: getPostFunction.functionArn,
      description: 'Get Post Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'CreatePostFunctionName', {
      value: createPostFunction.functionName,
      description: 'Create Post Lambda function name',
    });

    new cdk.CfnOutput(this, 'CreatePostFunctionArn', {
      value: createPostFunction.functionArn,
      description: 'Create Post Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'DeletePostFunctionName', {
      value: deletePostFunction.functionName,
      description: 'Delete Post Lambda function name',
    });

    new cdk.CfnOutput(this, 'DeletePostFunctionArn', {
      value: deletePostFunction.functionArn,
      description: 'Delete Post Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'UpdatePostFunctionName', {
      value: updatePostFunction.functionName,
      description: 'Update Post Lambda function name',
    });

    new cdk.CfnOutput(this, 'UpdatePostFunctionArn', {
      value: updatePostFunction.functionArn,
      description: 'Update Post Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'GeneratePresignedUrlFunctionName', {
      value: generatePresignedUrlFunction.functionName,
      description: 'Generate Presigned URL Lambda function name',
    });

    new cdk.CfnOutput(this, 'GeneratePresignedUrlFunctionArn', {
      value: generatePresignedUrlFunction.functionArn,
      description: 'Generate Presigned URL Lambda function ARN',
    });

    // HTTP API
    new cdk.CfnOutput(this, 'HttpApiId', {
      value: httpApi.apiId,
      description: 'HTTP API ID',
    });

    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url || '',
      description: 'HTTP API URL',
    });
  }
}

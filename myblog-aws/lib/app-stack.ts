import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DataStack } from './data-stack';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';


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



    // DynamoDB読み取り権限を付与
    props.dataStack.blogTable.grantReadData(getPostsFunction);
    props.dataStack.blogTable.grantWriteData(createPostFunction); 

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

    new cdk.CfnOutput(this, 'CreatePostFunctionName', {
      value: createPostFunction.functionName,
      description: 'Create Post Lambda function name',
    });

    new cdk.CfnOutput(this, 'CreatePostFunctionArn', {
      value: createPostFunction.functionArn,
      description: 'Create Post Lambda function ARN',
    });
  }
}

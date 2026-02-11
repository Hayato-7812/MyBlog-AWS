import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';

export class DataStack extends cdk.Stack {
  // 他のスタックから参照できるようにpublicプロパティとして公開
  public readonly blogTable: dynamodb.TableV2;
  public readonly mediaBucket: s3.Bucket;
  public readonly mediaDistribution: cloudfront.Distribution;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly apiGatewayCloudWatchRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB テーブルの作成
    this.blogTable = new dynamodb.TableV2(this, 'MyBlogTable', {
      // ❌ 物理名（tableName）は指定しない
      // 理由: CDKベストプラクティス「Avoid physical names」
      // - リソース置換時にデプロイが失敗する
      // - 複数環境での展開ができない
      // - MyBlogTableは論理ID（Logical ID）
      // - CDKが自動生成する名前（例: MyBlogDataStack-MyBlogTable-A1B2C3）を使用
      
      // パーティションキー: POST#<PostID>
      partitionKey: { 
        name: 'pk', 
        type: dynamodb.AttributeType.STRING 
      },

      // ソートキー: METADATA, BLOCK#<Order>, TAG#<TagName>
      sortKey: { 
        name: 'sk', 
        type: dynamodb.AttributeType.STRING 
      },

      // 課金モード: On-Demand（アクセスパターンが予測不可能な場合に推奨）
      billing: dynamodb.Billing.onDemand(),

      // Point-in-Time Recovery（バックアップ）を有効化
      pointInTimeRecovery: true,

      // 削除保護を有効化（本番環境では推奨）
      deletionProtection: true,

      // スタック削除時の動作（開発環境では DESTROY、本番では RETAIN を推奨）
      removalPolicy: cdk.RemovalPolicy.RETAIN,

      // 暗号化設定（デフォルトのAWS管理キーを使用）
      // encryption: dynamodb.TableEncryption.AWS_MANAGED, // デフォルトなので省略可

      // タグ付け
      tags: [
        { key: 'Project', value: 'MyBlog' },
        { key: 'Environment', value: 'Production' },
        { key: 'ManagedBy', value: 'CDK' },
      ],

      // GSI1: 汎用逆引きインデックス
      // 用途:
      // 1. タグ検索: sk='TAG#xxx' で検索（一般ユーザー・管理者）
      // 2. ステータス検索: sk='STATUS#xxx' で検索（主に管理者画面）
      // 例: 
      //   - Query(pk='TAG#AWS') → タグ「AWS」の記事一覧
      //   - Query(pk='STATUS#published') → 公開済み記事一覧
      //   - Query(pk='STATUS#draft') → 下書き記事一覧（管理者用）
      globalSecondaryIndexes: [
        {
          indexName: 'GSI1',  // 汎用逆引きインデックス
          
          // PKとSKを反転させて逆引き検索を可能にする
          // ベーステーブルの sk → GSI1 の pk
          // ベーステーブルの pk → GSI1 の sk
          partitionKey: { 
            name: 'sk',  // ベーステーブルのSK（TAG#xxx, STATUS#xxx等）
            type: dynamodb.AttributeType.STRING 
          },
          sortKey: { 
            name: 'pk',  // ベーステーブルのPK（POST#xxx）
            type: dynamodb.AttributeType.STRING 
          },

          // 射影（Projection）: 一覧表示に必要な属性のみを含める
          // title, status, createdAt, summary, thumbnail を投影
          // これにより、記事一覧表示時に追加のGetItemが不要になる
          projectionType: dynamodb.ProjectionType.INCLUDE,
          nonKeyAttributes: ['title', 'status', 'createdAt', 'summary', 'thumbnail'],
        },
      ],
    })

    // ==========================================================
    // S3 バケット（メディアファイル保管）
    // ==========================================================
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      // ❌ 物理名（bucketName）は指定しない
      // 理由: CDKベストプラクティス「Avoid physical names」
      // - CDKが自動生成する名前を使用
      // - 例: myblogdatastack-mediabucket-abc123

      // バージョニング有効化（誤削除対策）
      // 設計ドキュメント「10.3 S3 バックアップ戦略」に基づく
      versioned: true,

      // 削除保護（本番環境では必須）
      // 設計ドキュメント「2.1 Stack分割案 - Stateful Stack」に基づく
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,

      // 暗号化（デフォルトのAWS管理キー）
      encryption: s3.BucketEncryption.S3_MANAGED,

      // ブロックパブリックアクセス（CloudFront経由でのみアクセス）
      // 設計ドキュメント「8.1 セキュリティ設計」に基づく
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,

      // CORS設定（フロントエンドからの直接アップロード用）
      // Pre-signed URL経由でのアップロードに必要
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'],  // 本番環境では特定のドメインに制限推奨
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],

      // ライフサイクルポリシー
      // 設計ドキュメント「10.3 S3 バックアップ戦略」に基づく
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          // 古いバージョンは30日後に削除
          noncurrentVersionExpiration: cdk.Duration.days(30),
          // 削除マーカーの自動削除
          expiredObjectDeleteMarker: true,
        },
        {
          id: 'transition-to-infrequent-access',
          enabled: true,
          // 90日経過したファイルをStandard-IAに移行（コスト削減）
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // ==========================================================
    // CloudFront Distribution（メディア配信用）
    // ==========================================================
    
    // OAI（Origin Access Identity）の作成
    const mediaOriginAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'MediaOriginAccessIdentity',
      {
        comment: 'OAI for MyBlog media bucket',
      }
    );

    // S3バケットにOAI読み取り権限を付与
    this.mediaBucket.grantRead(mediaOriginAccessIdentity);

    // CloudFront Distribution作成
    this.mediaDistribution = new cloudfront.Distribution(this, 'MediaDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.mediaBucket, {
          originAccessIdentity: mediaOriginAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      
      // Price Class 200（北米、欧州、アジア、中東、アフリカ）
      // 設計ドキュメント「5. コスト最適化 - CloudFront」に基づく
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
      
      // コメント
      comment: 'CloudFront Distribution for MyBlog media files',
    });

    // ==========================================================
    // Cognito User Pool（管理者認証）
    // ==========================================================
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      // ❌ 物理名（userPoolName）は指定しない
      // 理由: CDKベストプラクティス「Avoid physical names」
      
      // サインイン設定
      signInAliases: {
        email: true,      // メールアドレスでサインイン
        username: false,  // ユーザー名は不要（管理者のみ）
      },
      
      // 自己登録を無効化（管理者のみ、手動作成）
      selfSignUpEnabled: false,
      
      // パスワードポリシー（強力な設定）
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      
      // MFA設定（オプション、推奨はOTP）
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: false,       // SMSは無効（コスト削減）
        otp: true,        // TOTP（Google Authenticator等）
      },
      
      // アカウント復旧
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // メール設定（Cognito標準、後でSES統合可能）
      email: cognito.UserPoolEmail.withCognito(),
      
      // 削除保護（本番環境では必須）
      // 設計ドキュメント「2.1 Stack分割案 - Stateful Stack」に基づく
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      
      // ユーザー属性
      standardAttributes: {
        email: {
          required: true,
          mutable: false,  // メールアドレスは変更不可
        },
      },
      
      // アカウントの有効期限（無期限）
      userVerification: {
        emailSubject: 'MyBlog - メールアドレスの確認',
        emailBody: '認証コード: {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    // User Pool Client（アプリケーション用）
    this.userPoolClient = this.userPool.addClient('WebClient', {
      // ❌ 物理名は指定しない
      
      // 認証フロー
      authFlows: {
        userSrp: true,         // Secure Remote Password（推奨）
        userPassword: false,   // 平文パスワードは無効（セキュリティ）
        adminUserPassword: true, // 管理者による認証（初回ログイン用）
      },
      
      // OAuth設定（将来的にソーシャルログイン用）
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,  // セキュリティ上非推奨
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
      },
      
      // トークン有効期限
      accessTokenValidity: cdk.Duration.hours(1),   // アクセストークン: 1時間
      idTokenValidity: cdk.Duration.hours(1),       // IDトークン: 1時間
      refreshTokenValidity: cdk.Duration.days(30),  // リフレッシュトークン: 30日
      
      // トークン失効を有効化
      enableTokenRevocation: true,
      
      // セキュリティ設定
      preventUserExistenceErrors: true,  // ユーザー存在チェック攻撃を防ぐ
    });

    // ==========================================================
    // API Gateway CloudWatch Logs Role
    // ==========================================================
    // API GatewayがCloudWatch Logsに書き込むためのIAMロール
    // これはAWSアカウント全体で1つのみ設定される
    this.apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      description: 'IAM role for API Gateway to write logs to CloudWatch',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // ==========================================================
    // CloudFormation出力
    // ==========================================================
    // 注意: exportNameも物理名の一種なので、環境ごとに変える必要がある
    // ただし、Stack間の直接参照を使う場合はexportNameは不要
    
    // DynamoDB
    new cdk.CfnOutput(this, 'TableName', {
      value: this.blogTable.tableName,
      description: 'DynamoDB table name for blog posts',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.blogTable.tableArn,
      description: 'DynamoDB table ARN',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    // S3
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,  // ✅ 実際のバケット名を参照
      description: 'S3 bucket name for media files',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    new cdk.CfnOutput(this, 'MediaBucketArn', {
      value: this.mediaBucket.bucketArn,
      description: 'S3 bucket ARN',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    // Cognito
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    // CloudFront Distribution (Media)
    new cdk.CfnOutput(this, 'MediaDistributionId', {
      value: this.mediaDistribution.distributionId,
      description: 'CloudFront Distribution ID for media files',
      // exportName: 不要（Stack間の直接参照を使用）
    });

    new cdk.CfnOutput(this, 'MediaDistributionDomainName', {
      value: this.mediaDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name for media files',
      // exportName: 不要（Stack間の直接参照を使用）
    });
  }
}

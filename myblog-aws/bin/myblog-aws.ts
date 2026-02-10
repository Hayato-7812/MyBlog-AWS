#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';
import { AppStack } from '../lib/app-stack';

const app = new cdk.App();

// 環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'ap-northeast-1',  // 東京リージョン
};

// Stateful Stack（データ層）
const dataStack = new DataStack(app, 'MyBlog-DataStack', {
  env,
  description: 'Data layer for MyBlog application (DynamoDB, S3, Cognito)',
});

// タグ付け（DataStack）
cdk.Tags.of(dataStack).add('Project', 'MyBlog');
cdk.Tags.of(dataStack).add('Environment', 'Production');
cdk.Tags.of(dataStack).add('ManagedBy', 'CDK');
cdk.Tags.of(dataStack).add('Stack', 'Data');

// Stateless Stack（アプリケーション層）
const appStack = new AppStack(app, 'MyBlog-AppStack', {
  env,
  dataStack,  // DataStackへの参照を渡す
  description: 'Application layer for MyBlog (S3, CloudFront, Lambda, API Gateway)',
});

// 依存関係の明示（AppStackはDataStackに依存）
appStack.addDependency(dataStack);

// タグ付け（AppStack）
cdk.Tags.of(appStack).add('Project', 'MyBlog');
cdk.Tags.of(appStack).add('Environment', 'Production');
cdk.Tags.of(appStack).add('ManagedBy', 'CDK');
cdk.Tags.of(appStack).add('Stack', 'App');

app.synth();

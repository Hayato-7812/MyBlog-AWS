#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/data-stack';

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

// タグ付け（スタック全体に適用）
cdk.Tags.of(dataStack).add('Project', 'MyBlog');
cdk.Tags.of(dataStack).add('Environment', 'Production');
cdk.Tags.of(dataStack).add('ManagedBy', 'CDK');
cdk.Tags.of(dataStack).add('Stack', 'Data');

app.synth();

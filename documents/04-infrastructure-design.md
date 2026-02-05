# Infrastructure Design (インフラ構成設計)

## 1. 設計方針

### 1.1 IaC（Infrastructure as Code）の採用

* **ツール**: AWS CDK (TypeScript)
* **バージョン管理**: すべてのインフラ定義をGitで管理
* **再現性**: いつでも同じ環境を再構築可能

### 1.2 Stack分割の基本方針

> **🤔 考えるべきポイント:**
> 
> Stack分割は、AWSリソースを「ライフサイクル」と「依存関係」に基づいて分類する作業です。
> 以下の観点で考えてみましょう：
>
> 1. **削除しても問題ないリソースはどれ？**
>    - 例：Lambda関数は削除して再デプロイしても、データは失われない
>    - 例：DynamoDBテーブルを削除すると、記事データが全て消える
>
> 2. **頻繁に更新するリソースはどれ？**
>    - 例：Lambda関数のコードは頻繁に変更する
>    - 例：DynamoDBテーブルの構造は一度決めたら滅多に変更しない
>
> 3. **他のリソースに依存されているリソースはどれ？**
>    - 例：DynamoDBテーブルはLambda関数から参照される
>    - 例：S3バケットはCloudFrontから参照される

---

## 2. Stack分割案

### 2.1 【あなたが考えてください】どのリソースをどのStackに配置するか？

以下のリソースを、Stateful StackとStateless Stackに分類してみましょう。

#### プロジェクトで使用する予定のAWSリソース一覧

- [ ] DynamoDB テーブル（記事データ）
- [ ] S3 バケット（メディアファイル保管）
- [ ] CloudFront Distribution
- [ ] API Gateway REST API
- [ ] Lambda 関数（記事取得）
- [ ] Lambda 関数（記事作成）
- [ ] Lambda 関数（記事更新）
- [ ] Lambda 関数（記事削除）
- [ ] Lambda 関数（Pre-signed URL生成）
- [ ] Cognito User Pool（ユーザー認証）
- [ ] IAM Role（Lambda実行ロール）
- [ ] CloudWatch Logs（ログ保管）

#### Stateful Stack（状態を持つリソース）

> **💡 ヒント:** 
> - 「データが保存される」リソース
> - 「削除するとサービスに致命的な影響がある」リソース
> - 「ライフサイクルが長い」リソース

**このStackに含めるべきリソース:**
```
ここにリソースをリストアップしてください

例：
- DynamoDB テーブル: myblog-posts-table
  理由：記事データが保存されており、削除すると全データが失われる

- ?
```

#### Stateless Stack（状態を持たないリソース）

> **💡 ヒント:**
> - 「削除して再作成しても問題ない」リソース
> - 「頻繁に更新される」リソース
> - 「コードの変更に伴って更新される」リソース

**このStackに含めるべきリソース:**
```
ここにリソースをリストアップしてください

例：
- Lambda 関数: get-posts-function
  理由：コード変更のたびに更新が必要。削除しても再デプロイすれば復元可能

- ?
```

---

## 3. Stack間の依存関係

### 3.1 【あなたが考えてください】どのように依存関係を解決するか？

> **🤔 考えるべきポイント:**
>
> Stateless Stack（Lambda）は、Stateful Stack（DynamoDB）の情報が必要です。
> 
> 例：Lambda関数はDynamoDBのテーブル名を知る必要がある
>
> **質問：どうやってStateless StackにStateful Stackの情報を渡しますか？**
>
> ヒント：CDKには以下の方法があります
> - CloudFormation Outputs / Exports
> - SSM Parameter Store
> - Stack間の直接参照

#### 解決方法を考えてみましょう

```typescript
// Stateful Stackで何をExportすべきか？

// 例：
// DynamoDBテーブルのARN
// DynamoDBテーブル名
// S3バケット名
// ?

// Stateless Stackでどうやってそれを参照するか？
```

---

## 4. デプロイ順序

### 4.1 【あなたが考えてください】どの順番でデプロイすべきか？

> **🤔 考えるべきポイント:**
>
> Stack間に依存関係がある場合、デプロイの順序が重要です。
>
> **質問：Stateful StackとStateless Stackは、どちらを先にデプロイすべきですか？**
>
> なぜそう考えましたか？

#### デプロイフローを考えてみましょう

```
ステップ1: ?
理由: ?

ステップ2: ?
理由: ?

ステップ3: ?（必要であれば）
理由: ?
```

---

## 5. 環境分離（将来的な拡張）

> **💭 発展的な考察:**
>
> 現時点では本番環境のみですが、将来的に開発環境を作る場合を想定してみましょう。
>
> **質問：**
> - 開発環境と本番環境で、Stackをどう分けますか？
> - 同じCDKコードで両方の環境をデプロイできますか？
>
> ヒント：CDKの `context` や環境変数を使う方法があります

---

## 6. リソース命名規則

### 6.1 【あなたが考えてください】統一的な命名規則を決めましょう

> **🤔 考えるべきポイント:**
>
> リソース名には、以下の情報を含めると管理しやすくなります：
> - プロジェクト名
> - 環境（本番/開発）
> - リソースタイプ
> - 用途

#### 命名規則の例

```
パターン1: {project}-{env}-{resource-type}-{purpose}
例：myblog-prod-lambda-get-posts

パターン2: {env}-{project}-{purpose}-{resource-type}
例：prod-myblog-get-posts-lambda

どちらが良いと思いますか？あるいは独自のパターンを考えてみましょう。
```

**あなたの命名規則:**
```
DynamoDBテーブル: ?
S3バケット: ?
Lambda関数: ?
API Gateway: ?
```

---

## 7. コスト最適化の考慮事項

### 7.1 【あなたが考えてください】コストを抑えるための設計ポイント

> **💰 考えるべきポイント:**
>
> サーバーレスは従量課金です。以下を考えてみましょう：
>
> **DynamoDB:**
> - オンデマンドモード vs プロビジョニングモード、どちらを選ぶ？
> - 個人ブログの規模で、どちらがコスト効率的？
>
> **Lambda:**
> - メモリサイズをどう設定する？（128MB? 512MB? 1024MB?）
> - タイムアウトをどう設定する？
>
> **S3:**
> - ストレージクラスは？（Standard? Intelligent-Tiering?）
>
> **CloudFront:**
> - どのエッジロケーションを有効にする？（全世界? 米国・欧州のみ?）

#### あなたの選択と理由

```
DynamoDB:
選択：?
理由：?

Lambda:
メモリ：?
タイムアウト：?
理由：?

S3:
ストレージクラス：?
理由：?
```

---

## 8. セキュリティ設計

### 8.1 【あなたが考えてください】IAM Roleの設計

> **🔒 考えるべきポイント:**
>
> Lambda関数には適切な権限のみを付与する（最小権限の原則）
>
> **質問：**
> - 「記事取得」Lambda関数には、DynamoDBの何の権限が必要？
>   - `dynamodb:GetItem`? `dynamodb:PutItem`? 両方?
> - 「記事作成」Lambda関数には？
> - 「Pre-signed URL生成」Lambda関数には、S3の何の権限が必要？

#### Lambda関数ごとの権限設計

```
get-posts Lambda:
- DynamoDB: [ここに必要な権限をリストアップ]
- S3: [必要? 不要?]

create-post Lambda:
- DynamoDB: [ここに必要な権限をリストアップ]
- S3: [必要? 不要?]

generate-presigned-url Lambda:
- DynamoDB: [必要? 不要?]
- S3: [ここに必要な権限をリストアップ]
```

---

## 9. モニタリング・ログ設計

### 9.1 【あなたが考えてください】何を監視すべきか？

> **📊 考えるべきポイント:**
>
> 本番運用時に「何かおかしい」と気づくために、何を監視しますか？
>
> **CloudWatch Metricsで監視すべき項目:**
> - Lambda関数のエラー率？
> - API GatewayのHTTP 5xxエラー数？
> - DynamoDBのスロットリングエラー？
>
> **CloudWatch Logsで記録すべき情報:**
> - すべてのAPIリクエスト？
> - エラーのみ？
> - 個人情報（ユーザーIDなど）は記録して良い？

#### 監視項目の設計

```
アラートを設定すべき項目:
1. ?
   しきい値：?
   理由：?

2. ?
   しきい値：?
   理由：?

ログに記録する情報:
- Lambda実行時間: Yes / No
- リクエストボディ: Yes / No（セキュリティ上の問題は？）
- ?
```

---

## 10. ディザスタリカバリ（災害復旧）

### 10.1 【あなたが考えてください】バックアップ戦略

> **🚨 考えるべきポイント:**
>
> 最悪の事態を想定しましょう：
> - 誤ってDynamoDBテーブルを削除してしまった
> - S3バケットのファイルを全て削除してしまった
>
> **質問：**
> - どうやってデータを復旧しますか？
> - バックアップは必要？必要なら、どのくらいの頻度で取る？
> - AWS Backupを使う？DynamoDBのポイントインタイムリカバリ？

#### バックアップ戦略

```
DynamoDB:
方法：?
頻度：?
保持期間：?

S3:
方法：?（バージョニング? AWS Backup?）
理由：?

復旧手順（簡単に）:
1. ?
2. ?
```

---

## 11. CDK実装の参考構造

> **💡 学習のヒント:**
>
> ここまで考えたことを、実際のCDKコードにどう落とし込むか？
>
> 以下は参考構造です。実装時に立ち返りましょう。

### プロジェクト構造案

```
cdk/
├── bin/
│   └── app.ts                    # CDKアプリのエントリーポイント
├── lib/
│   ├── stateful-stack.ts         # Stateful Stack（DynamoDB, S3等）
│   ├── stateless-stack.ts        # Stateless Stack（Lambda, API Gateway等）
│   └── constructs/               # 再利用可能なConstruct
│       ├── lambda-function.ts
│       └── dynamodb-table.ts
├── cdk.json                      # CDK設定
└── package.json
```

### 考えるべきポイント

```typescript
// bin/app.ts で考えるべきこと
// - Stackをどの順番でインスタンス化するか？
// - 環境変数をどう扱うか？

// lib/stateful-stack.ts で考えるべきこと
// - DynamoDBテーブルのremovalPolicyは？（RETAIN? DESTROY?）
// - S3バケットの設定は？
// - 何をOutputとしてexportするか？

// lib/stateless-stack.ts で考えるべきこと
// - Stateful Stackの値をどう受け取るか？
// - Lambda関数に環境変数をどう渡すか？
// - API GatewayとLambdaをどう接続するか？
```

---

## 12. 次のステップ

このドキュメントで考えた内容を元に、実際のCDKコードを書く準備ができました。

**実装前のチェックリスト:**
- [ ] Stateful/Stateless Stackの分割方針が明確
- [ ] Stack間の依存関係の解決方法が決まっている
- [ ] リソースの命名規則が決まっている
- [ ] IAM権限の設計が完了している
- [ ] コスト最適化の方針が決まっている
- [ ] モニタリング項目が明確
- [ ] バックアップ戦略が決まっている

**実装時の参考資料:**
- [AWS CDK公式ドキュメント](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

---

## 📝 あなたの回答を記録するセクション

> **このセクションは、あなたが考えた内容を記録する場所です。**
> 
> 上記の各質問に対する答えを、ここに書き込んでいきましょう。
> そうすることで、後で見返したときに「なぜこの設計にしたのか」が分かります。

### Stack分割の決定

```
【Stateful Stackに含めるリソース】


【Stateless Stackに含めるリソース】


【分割の理由】

```

### Stack間依存関係の解決方法

```
【選択した方法】


【実装イメージ】

```

### その他の設計決定事項

```
【命名規則】


【コスト最適化】


【セキュリティ】


【モニタリング】


【バックアップ】

```

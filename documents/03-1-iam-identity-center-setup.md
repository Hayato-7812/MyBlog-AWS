# IAM Identity Center (SSO) セットアップ手順

> **目的**
> 
> rootユーザーからの卒業：プロフェッショナルなセキュリティ環境の構築
> - rootユーザーの直接利用を避ける
> - 最小権限の原則に基づいた開発者用アカウント（blog-admin）を作成

> **📚 事前知識**
> 
> IAM Identity CenterとIAMの違い、ユースケース、ベストプラクティスについては、
> 以下のドキュメントを参照してください：
> 
> **[IAM Identity Center 基礎知識](../catch-up/IAM-identity-center-fundamentals.md)**
> 
> このドキュメントでは以下を解説しています：
> - IAM vs IAM Identity Center の技術的な違い
> - 使い分けの判断基準とフローチャート
> - ユースケース別の推奨構成
> - セキュリティベストプラクティス
> - よくある誤解と正しい理解

---

## 📋 前提条件

- [ ] AWSアカウントが作成済み
- [ ] rootユーザーでログイン可能
- [ ] メールアドレスが利用可能
- [ ] スマートフォン（MFA用）

---

## ステップ1: IAM Identity Centerの有効化

### 1-1. IAM Identity Centerにアクセス

1. AWSマネジメントコンソールにrootユーザーでログイン
2. 検索バーで「IAM Identity Center」を検索
3. 「IAM Identity Center」をクリック

### 1-2. IAM Identity Centerを有効化

1. 「Enable」または「有効化」ボタンをクリック

2. **リージョンの確認**
   ```
   推奨リージョン: 米国東部（バージニア北部）us-east-1
   理由: IAM Identity Centerは特定リージョンで管理される
   ```

3. **組織の設定**
   - 「AWS Organizations」の有効化を促される場合があります
   - 「Enable AWS Organizations」をクリック（必要に応じて）

4. 完了を待つ（数分かかる場合があります）

### 1-3. ディレクトリの選択

**推奨: Identity Center directory**
```
- 小規模プロジェクトに最適
- 追加コストなし
- セットアップが簡単
```

**他の選択肢（本プロジェクトでは不要）:**
- Active Directory
- External identity provider

---

## ステップ2: ユーザー「blog-admin」の作成

### 2-1. ユーザーを追加

1. IAM Identity Centerのダッシュボードで「Users」をクリック
2. 「Add user」をクリック

### 2-2. ユーザー情報を入力

```
ユーザー名: blog-admin
メールアドレス: あなたのメールアドレス
名: Blog
姓: Admin
表示名: Blog Admin（オプション）
```

3. 「Next」をクリック

### 2-3. グループへの追加

- 初回は「Skip」してOK
- 後で「Developers」グループなどを作成して追加可能

4. 「Add user」をクリック

### 2-4. 初期パスワードの設定

- ユーザー作成後、指定したメールアドレスに招待メールが送信されます
- メール内のリンクをクリックして、初期パスワードを設定
- パスワード要件に従って強力なパスワードを設定

---

## ステップ3: 権限セット（Permission Set）の作成

### 3-1. 権限セットの作成画面に移動

1. IAM Identity Centerのダッシュボードで「Permission sets」をクリック
2. 「Create permission set」をクリック

### 3-2. 権限セットのタイプを選択

**2つのオプションから選択:**

#### **Option 1: PowerUserAccess（推奨 - 開発初期段階）**

**簡単で包括的な権限セット**

```
名前: DeveloperAccess
説明: Full access except IAM user/role management
タイプ: Predefined permission set
ポリシー: PowerUserAccess（AWS管理ポリシー）
```

**メリット:**
- ✅ ほぼすべてのAWSサービスにアクセス可能
- ✅ IAMユーザー・ロールの作成/削除は不可（安全）
- ✅ 開発に必要な権限がすべて揃っている
- ✅ セットアップが簡単

**デメリット:**
- ⚠️ 少し権限が広すぎる
- ⚠️ プロダクション環境では避けるべき

**設定手順:**
1. 「Predefined permission set」を選択
2. 「PowerUserAccess」を選択
3. セッション期間: 8時間（推奨）
4. 「Next」をクリック
5. 名前と説明を入力
6. 「Create」をクリック

---

#### **Option 2: カスタム権限セット（推奨 - より安全）**

**より最小権限に近づけた権限セット**

```
名前: BlogDeveloperAccess
説明: Custom permission set for blog development
タイプ: Custom permission set
```

**必要なAWS管理ポリシー:**
```
- AmazonDynamoDBFullAccess       # DynamoDB操作
- AmazonS3FullAccess             # S3操作
- AWSLambda_FullAccess           # Lambda操作
- AmazonAPIGatewayAdministrator  # API Gateway操作
- CloudFrontFullAccess           # CloudFront操作
- AmazonCognitoPowerUser         # Cognito操作
- AmazonRoute53FullAccess        # Route53操作
- CloudWatchLogsFullAccess       # CloudWatch Logs操作
- IAMReadOnlyAccess              # IAMの参照（必要最小限）
- AWSCertificateManagerFullAccess # ACM操作
```

**設定手順:**
1. 「Custom permission set」を選択
2. 「Attach AWS managed policies」を選択
3. 上記のポリシーを検索して選択
4. セッション期間: 8時間（推奨）
5. 「Next」をクリック
6. 名前と説明を入力
7. 「Create」をクリック

---

### 3-3. セッション期間の設定

**推奨設定:**
```
セッション期間: 8時間
理由: 
- 1日の作業時間に十分
- セキュリティとユーザビリティのバランス
- 長時間放置による不正アクセスのリスク低減
```

**その他のオプション:**
- 4時間: より安全（短時間作業向け）
- 12時間: 長時間作業（ただしセキュリティリスク増）

---

## ステップ4: ユーザーにAWSアカウントと権限セットを割り当て

### 4-1. アカウント割り当て画面に移動

1. IAM Identity Centerのダッシュボードで「AWS accounts」をクリック
2. 自分のAWSアカウントを選択
3. 「Assign users or groups」をクリック

### 4-2. ユーザーを選択

1. 「Users」タブを選択
2. 「blog-admin」にチェックを入れる
3. 「Next」をクリック

### 4-3. 権限セットを選択

1. 先ほど作成した権限セットを選択
   - 「DeveloperAccess」（PowerUserAccessの場合）
   - または「BlogDeveloperAccess」（カスタムの場合）
2. 「Next」をクリック
3. 設定を確認
4. 「Submit」をクリック

---

## ステップ5: MFA（多要素認証）の設定

### 5-1. blog-adminユーザーでログイン

1. メールに届いた招待リンクをクリック
2. 初期パスワードを設定
3. 新しいパスワードでログイン

**ユーザーポータルURL:**
```
形式: https://d-xxxxxxxxxx.awsapps.com/start

確認方法:
1. IAM Identity Centerのダッシュボード
2. 「Settings」
3. 「AWS access portal URL」をコピー
```

### 5-2. MFAデバイスの登録

1. blog-adminでログイン後、右上のアカウント名をクリック
2. 「MFA devices」または「多要素認証」を選択
3. 「Register MFA device」をクリック

### 5-3. 認証アプリを選択

**推奨MFAアプリ:**
```
- Google Authenticator（iOS/Android）
- Microsoft Authenticator（iOS/Android）
- Authy（iOS/Android/デスクトップ）
```

**設定手順:**
1. 「Authenticator app」を選択
2. QRコードが表示される
3. 認証アプリでQRコードをスキャン
4. 認証アプリに表示される6桁のコードを入力
5. 次のコードを待って、再度6桁のコードを入力
6. 「Add MFA」をクリック

**リカバリーコードの保存:**
- MFAデバイス紛失時のために、リカバリーコードを安全な場所に保存
- パスワード管理ツール（1Password、Bitwarden等）の使用を推奨

---

## ステップ6: blog-adminユーザーでのアクセス方法

### 6-1. ブラウザからのアクセス

**マネジメントコンソールへのアクセス:**
```
1. ユーザーポータルURLにアクセス
   https://d-xxxxxxxxxx.awsapps.com/start

2. blog-adminでログイン
   - ユーザー名: blog-admin
   - パスワード: 設定したパスワード

3. MFAコードを入力
   - 認証アプリの6桁のコードを入力

4. AWSアカウントが表示される
   - 自分のアカウントをクリック

5. 権限セットを選択
   - 「DeveloperAccess」または「BlogDeveloperAccess」

6. 「Management console」をクリック
   - AWSマネジメントコンソールが開く
```

**ブックマーク推奨:**
- ユーザーポータルURLをブックマークしておくと便利

---

### 6-2. AWS CLIでのアクセス（開発用）

#### **AWS CLI v2のインストール**

**macOS:**
```bash
# Homebrewでインストール
brew install awscli

# 確認
aws --version
# 出力例: aws-cli/2.x.x Python/3.x.x Darwin/xx.x.x
```

**その他のOS:**
- [AWS CLI公式ドキュメント](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

#### **IAM Identity Center用の設定**

```bash
# AWS CLIの設定（対話形式）
aws configure sso

# 以下の情報を順に入力:

# 1. SSO session name（任意の名前）
SSO session name (Recommended): myblog-dev

# 2. SSO start URL（ユーザーポータルURL）
SSO start URL [None]: https://d-xxxxxxxxxx.awsapps.com/start

# 3. SSO region（Identity Centerのリージョン）
SSO region [None]: us-east-1

# 4. SSO registration scopes（デフォルトでOK）
SSO registration scopes [sso:account:access]: sso:account:access

# ブラウザが自動的に開き、認証を求められる
# 「Authorize request」をクリック

# 5. アカウント選択
# 自分のAWSアカウントを選択

# 6. 権限セット選択
# DeveloperAccess または BlogDeveloperAccess を選択

# 7. CLI default client Region（作業リージョン）
CLI default client Region [None]: ap-northeast-1

# 8. CLI default output format
CLI default output format [None]: json

# 9. CLI profile name
CLI profile name [DeveloperAccess-123456789012]: myblog-dev
```

#### **使用方法**

**プロファイルを指定してAWS CLIを使用:**
```bash
# S3バケット一覧
aws s3 ls --profile myblog-dev

# DynamoDBテーブル一覧
aws dynamodb list-tables --profile myblog-dev

# Lambda関数一覧
aws lambda list-functions --profile myblog-dev
```

**デフォルトプロファイルに設定（推奨）:**
```bash
# 環境変数で設定（セッション中のみ有効）
export AWS_PROFILE=myblog-dev

# 以降、--profile オプション不要
aws s3 ls
aws dynamodb list-tables
```

**~/.zshrc または ~/.bashrc に追加（永続化）:**
```bash
# ファイルを開く
vi ~/.zshrc  # または ~/.bashrc

# 以下を追加
export AWS_PROFILE=myblog-dev

# 保存後、反映
source ~/.zshrc  # または source ~/.bashrc
```

#### **セッションの更新**

SSOセッションは期限切れになります（デフォルト8時間）:
```bash
# セッションが期限切れの場合
aws sso login --profile myblog-dev

# ブラウザで再認証
```

---

### 6-3. CDKでの使用

**CDKプロジェクトでの設定:**

```bash
# プロファイルを指定してCDKコマンドを実行
cdk deploy --profile myblog-dev
cdk synth --profile myblog-dev
cdk diff --profile myblog-dev

# デフォルトプロファイルを設定している場合
export AWS_PROFILE=myblog-dev
cdk deploy
cdk synth
cdk diff
```

**cdk.json での設定（オプション）:**
```json
{
  "app": "npx ts-node bin/myblog-aws.ts",
  "profile": "myblog-dev"
}
```

---

## ステップ7: rootユーザーのセキュリティ強化

blog-adminユーザーの作成が完了したら、rootユーザーも保護します。

### 7-1. rootユーザーにMFAを設定

**重要: rootユーザーは最も強力な権限を持つため、MFA必須**

1. rootユーザーでAWSマネジメントコンソールにログイン
2. 右上のアカウント名をクリック
3. 「Security credentials」を選択
4. 「Multi-factor authentication (MFA)」セクション
5. 「Activate MFA」をクリック
6. 「Authenticator app」を選択
7. QRコードをスキャン（blog-adminとは別のエントリーで保存）
8. 2つの連続したコードを入力
9. 「Assign MFA」をクリック

**注意:**
- rootユーザーのMFAは、blog-adminとは別のエントリーとして保存
- 認証アプリで「AWS Root User - MyBlog」などの名前を付けると識別しやすい

### 7-2. rootユーザーのアクセスキーを削除

**重要: rootユーザーのアクセスキーは絶対に作成しない**

1. 「Access keys」セクションを確認
2. 既存のアクセスキーがあれば削除
   - 「Delete」をクリック
   - 確認ダイアログで「Delete」を再度クリック
3. 今後、rootユーザーのアクセスキーは作成しない

### 7-3. rootユーザーの使用を最小限に

**rootユーザーは以下の場合のみ使用:**
```
✅ アカウントの閉鎖
✅ 請求情報の変更
✅ IAM Identity Centerの初期設定
✅ サポートプランの変更
✅ アカウント復旧（緊急時）

❌ 日常の開発作業（blog-adminを使用）
❌ リソースの作成・削除
❌ アプリケーションのデプロイ
```

### 7-4. rootユーザーのパスワード管理

**推奨:**
- パスワード管理ツール（1Password、Bitwarden等）で厳重に管理
- 定期的にパスワードを変更（3-6ヶ月ごと）
- rootユーザーのメールアドレスを専用のものにする

---

## ステップ8: 動作確認

### 8-1. blog-adminでログイン確認

**ブラウザからの確認:**
```
1. ユーザーポータルURLにアクセス
2. blog-adminでログイン
3. MFAコード入力
4. AWSアカウント表示を確認
5. Management consoleにアクセス
```

### 8-2. 権限の確認

**以下のサービスにアクセスできることを確認:**
- [ ] DynamoDB
- [ ] S3
- [ ] Lambda
- [ ] API Gateway
- [ ] CloudFront
- [ ] Cognito
- [ ] Route53
- [ ] CloudWatch
- [ ] ACM (Certificate Manager)

**各サービスで基本的な操作を確認:**
- DynamoDB: テーブル一覧の表示
- S3: バケット一覧の表示
- Lambda: 関数一覧の表示

### 8-3. IAMユーザー作成の制限を確認

**PowerUserAccessの場合、以下ができないことを確認:**
- [ ] IAMユーザーの作成
- [ ] IAMグループの作成
- [ ] IAMポリシーの作成（一部制限）

**IAMコンソールで確認:**
1. IAMサービスを開く
2. 「Users」をクリック
3. 「Add users」ボタンが無効、またはエラーが表示される

これは正常な動作です（PowerUserAccessの制限）。

### 8-4. AWS CLI動作確認

```bash
# プロファイル確認
aws configure list --profile myblog-dev

# 認証情報確認
aws sts get-caller-identity --profile myblog-dev

# 出力例:
# {
#     "UserId": "AROAXXXXXXXXXXXXXXXXX:blog-admin",
#     "Account": "123456789012",
#     "Arn": "arn:aws:sts::123456789012:assumed-role/..."
# }

# S3バケット一覧
aws s3 ls --profile myblog-dev
```

---

## 📝 セキュリティチェックリスト

### 完了確認

- [ ] IAM Identity Centerを有効化
- [ ] blog-adminユーザーを作成
- [ ] 権限セットを作成・割り当て
- [ ] blog-adminにMFAを設定
- [ ] rootユーザーにMFAを設定
- [ ] rootユーザーのアクセスキーを削除（または作成していない）
- [ ] AWS CLIでSSO設定完了
- [ ] 動作確認完了

### 今後の運用

**日常の開発作業:**
```
✅ blog-adminを使用
✅ AWS CLI with SSOを使用
✅ CDKデプロイにプロファイル指定
```

**rootユーザー:**
```
❌ 日常的に使用しない
✅ パスワード管理ツールで厳重に管理
✅ MFA必須
✅ 緊急時・特定の管理作業のみ
```

**権限の見直し:**
```
📅 3ヶ月ごと: 使用している権限を確認
📅 6ヶ月ごと: 不要な権限を削除
📅 1年ごと: セキュリティ設定の全体見直し
```

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 問題1: MFAデバイスを紛失した

**解決方法:**
1. rootユーザーでログイン
2. IAM Identity Centerで該当ユーザーを選択
3. MFAデバイスをリセット
4. 新しいMFAデバイスを登録

#### 問題2: SSOセッションが期限切れ

**解決方法:**
```bash
# 再ログイン
aws sso login --profile myblog-dev

# ブラウザで認証
```

#### 問題3: 権限不足エラー

**確認事項:**
1. 正しい権限セットが割り当てられているか確認
2. セッションが有効か確認
3. 必要なポリシーが権限セットに含まれているか確認

**解決方法:**
- IAM Identity Centerで権限セットを確認・修正
- 必要に応じてポリシーを追加

#### 問題4: AWS CLIでプロファイルが見つからない

**解決方法:**
```bash
# 設定ファイルを確認
cat ~/.aws/config

# 再設定
aws configure sso
```

---

## 📚 参考資料

### AWS公式ドキュメント

- [IAM Identity Center ユーザーガイド](https://docs.aws.amazon.com/singlesignon/latest/userguide/)
- [AWS CLI with SSO](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)
- [ベストプラクティス](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

### セキュリティベストプラクティス

1. **最小権限の原則**: 必要最小限の権限のみ付与
2. **MFA必須**: すべてのユーザーにMFAを設定
3. **定期的な見直し**: 権限とアクセスログを定期確認
4. **rootユーザー保護**: 日常的に使用しない

---

## 🚀 次のステップ

セキュアな開発環境が整いました。次は：

1. **CDKプロジェクトの初期化**
   ```bash
   mkdir myblog-aws && cd myblog-aws
   cdk init app --language typescript
   ```

2. **blog-adminユーザーでCDKデプロイ**
   ```bash
   export AWS_PROFILE=myblog-dev
   cdk bootstrap
   ```

3. **インフラの構築開始**
   - Stateful Stackの実装
   - Stateless Stackの実装
   - デプロイ・テスト

---

このセットアップで、プロフェッショナルなセキュリティ基盤が整いました！🎉

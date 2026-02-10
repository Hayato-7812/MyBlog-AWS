# IAM Identity Center 基礎知識

> **作成日**: 2026/02/10  
> **目的**: IAM Identity CenterとIAMの違いを理解し、適切な認証・認可の仕組みを選択できるようになる  
> **関連文書**: [documents/03-1-iam-identity-center-setup.md](../documents/03-1-iam-identity-center-setup.md)

---

## 1. IAM Identity Center とは

IAM Identity Center（旧称：AWS SSO）は、**人間のユーザー**がAWSアカウントにアクセスするための**モダンな認証・認可サービス**です。

### 1.1 基本概念

```
IAM Identity Center = 人間がAWSを使うための入り口

- 複数のAWSアカウントへの一元管理されたアクセス
- シングルサインオン（SSO）
- 一時的な認証情報（セキュア）
- MFA（多要素認証）のサポート
```

### 1.2 主な特徴

| 特徴 | 説明 |
|------|------|
| **シングルサインオン** | 1回のログインで複数のAWSアカウントにアクセス |
| **一時認証情報** | セッション期限付きの認証情報（デフォルト8時間） |
| **中央集権管理** | ユーザーと権限を1箇所で管理 |
| **MFA統合** | 組み込みの多要素認証サポート |
| **外部IdP連携** | Azure AD、Okta等との統合可能 |

---

## 2. IAM と IAM Identity Center の違い

### 2.1 根本的な設計思想の違い

| 観点 | IAM | IAM Identity Center |
|------|-----|-------------------|
| **対象** | アプリケーション・サービス | 人間のユーザー |
| **認証情報** | 長期的（アクセスキー） | 一時的（セッション） |
| **管理単位** | 個別のAWSアカウント | 複数アカウントを一元管理 |
| **設計年代** | 2006年（古い） | 2017年（モダン） |
| **セキュリティ** | 手動での最小権限設定 | ベストプラクティスが組み込み |

### 2.2 技術的な違い

#### **IAM（Identity and Access Management）**

**用途**: プログラムやAWSサービス間の認証

```
典型的な使用例:
- Lambda関数がDynamoDBにアクセスする
- EC2インスタンスがS3にアクセスする
- CI/CDパイプラインがリソースをデプロイする
```

**認証情報の形式**:
```
アクセスキーID: AKIAIOSFODNN7EXAMPLE
シークレットアクセスキー: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

特性:
- 無期限（明示的に削除するまで有効）
- 漏洩すると大きなセキュリティリスク
- 定期的なローテーションが必要
```

**管理の複雑さ**:
```
1. IAMユーザーを作成
2. アクセスキーを発行
3. ポリシーをアタッチ
4. アクセスキーを安全に保管
5. 定期的なローテーション
6. 使用していないキーの削除
```

#### **IAM Identity Center**

**用途**: 人間がAWSマネジメントコンソールやCLIにアクセス

```
典型的な使用例:
- 開発者がAWSコンソールにログイン
- DevOpsエンジニアがCDKをデプロイ
- 管理者がリソースを確認
```

**認証情報の形式**:
```
一時的なセッショントークン（STS）:
- アクセスキーID: ASIAIOSFODNN7EXAMPLE
- シークレットアクセスキー: （一時的）
- セッショントークン: （一時的）

特性:
- 有効期限あり（デフォルト8時間）
- 期限切れ後は自動的に無効化
- MFAで保護可能
- 定期的なローテーション不要
```

**管理のシンプルさ**:
```
1. IAM Identity Centerでユーザーを作成
2. 権限セットを割り当て
3. MFAを設定
4. ユーザーポータルURLからログイン
→ 一時認証情報が自動生成される
```

---

## 3. IAM vs IAM Identity Center：使い分け

### 3.1 判断フローチャート

```
アクセスするのは誰？
    ↓
┌──────────────────┐
│ 人間のユーザー？ │
└──────────────────┘
         ↓
    YES ────→ IAM Identity Center を使用
         ↓
    NO
         ↓
┌──────────────────────┐
│ アプリケーション？   │
│ AWSサービス？        │
└──────────────────────┘
         ↓
    YES ────→ IAM Role を使用
         ↓
    NO
         ↓
┌──────────────────────┐
│ CI/CDパイプライン？  │
└──────────────────────┘
         ↓
    YES ────→ OIDC連携 + IAM Role（推奨）
              または IAMユーザー（非推奨）
```

### 3.2 具体的な使い分け例

#### **ケース1: 個人開発者のAWSアクセス**

❌ **悪い例（IAMユーザー）**:
```bash
# IAMユーザー作成
aws iam create-user --user-name blog-admin

# アクセスキー発行
aws iam create-access-key --user-name blog-admin

# ~/.aws/credentials に保存
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

問題点:
- アクセスキーが漏洩するリスク
- 定期的なローテーションが必要
- 複数のAWSアカウントで管理が煩雑
```

✅ **良い例（IAM Identity Center）**:
```bash
# IAM Identity Centerでユーザー作成（GUI）
# 権限セットを割り当て

# AWS CLI設定
aws configure sso

# 一時認証情報が自動生成
aws s3 ls --profile myblog-dev

メリット:
- アクセスキーの管理不要
- 8時間で自動期限切れ（安全）
- MFAで保護
- 複数アカウントを一元管理
```

#### **ケース2: Lambda関数がDynamoDBにアクセス**

✅ **正解（IAM Role）**:
```typescript
// CDKでIAM Roleを自動作成
const getPostsFunction = new lambda.Function(this, 'GetPostsFunction', {
  functionName: 'myblog-prod-lambda-get-posts',
  // ...
});

// DynamoDBへのアクセス権限を付与
postsTable.grantReadData(getPostsFunction);

仕組み:
- Lambda実行時に一時認証情報が自動付与
- アクセスキーの管理不要
- 最小権限の原則を自動適用
```

❌ **絶対にやってはいけない（アクセスキーをハードコード）**:
```javascript
// Lambda関数内にアクセスキーを直接記述
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',  // ❌ 危険！
  secretAccessKey: 'wJalrXUtnFEMI/...',  // ❌ 危険！
});

問題点:
- アクセスキーがコードに含まれる（Gitにコミットされる危険）
- 権限が広すぎる可能性
- ローテーション不可能
```

#### **ケース3: GitHub ActionsからAWSにデプロイ**

✅ **推奨（OIDC連携 + IAM Role）**:
```yaml
# .github/workflows/deploy.yml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
    aws-region: ap-northeast-1

仕組み:
- GitHubのOIDCトークンでAWSにアクセス
- 一時認証情報が自動生成
- アクセスキーの管理不要
```

❌ **非推奨（IAMユーザーのアクセスキーをシークレットに保存）**:
```yaml
# .github/workflows/deploy.yml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}      # ⚠️ 非推奨
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}  # ⚠️ 非推奨
    aws-region: ap-northeast-1

問題点:
- アクセスキーがGitHubに保存される
- 定期的なローテーションが必要
- キーが漏洩した場合の影響が大きい
```

---

## 4. ユースケース別の推奨構成

### 4.1 個人開発プロジェクト（MyBlog-AWS）

**構成**:
```
IAM Identity Center
  └── ユーザー: blog-admin
      └── 権限セット: PowerUserAccess または カスタム
          └── AWSアカウント: 123456789012

日常の作業:
- ブラウザ: ユーザーポータルからログイン
- CLI: aws configure sso
- CDK: --profile myblog-dev
```

**なぜIAM Identity Centerを選ぶか**:
1. rootユーザーを日常的に使わない（セキュリティ）
2. MFAで保護（二段階認証）
3. アクセスキーの管理不要
4. 一時認証情報（8時間で自動期限切れ）
5. 将来的に複数アカウントに拡張しやすい

**IAMは使わない理由**:
- 人間がアクセスする場合、IAMユーザーはアンチパターン
- アクセスキー漏洩のリスク
- ローテーションの手間

### 4.2 スタートアップ（小規模チーム: 2-10人）

**構成**:
```
IAM Identity Center
  ├── グループ: Developers
  │   ├── ユーザー: alice
  │   ├── ユーザー: bob
  │   └── 権限セット: DeveloperAccess
  └── グループ: Administrators
      ├── ユーザー: admin
      └── 権限セット: AdministratorAccess

AWS Organizations
  ├── アカウント: 本番環境（Production）
  ├── アカウント: ステージング（Staging）
  └── アカウント: 開発環境（Development）
```

**メリット**:
- チーム全体を一元管理
- 環境ごとにアクセス制御
- 新メンバーの追加が簡単
- 退職者のアクセス即座に無効化

### 4.3 エンタープライズ（大規模組織）

**構成**:
```
IAM Identity Center
  └── 外部IdP連携（Azure AD / Okta）
      ├── グループ: Engineering
      ├── グループ: DataScience
      ├── グループ: Security
      └── グループ: Finance

AWS Organizations（数百のアカウント）
  ├── OU: Production
  ├── OU: Staging
  ├── OU: Development
  └── OU: Sandbox
```

**メリット**:
- 既存のActive Directoryと統合
- SAML 2.0での認証
- 自動プロビジョニング（SCIM）
- 監査ログの一元管理

---

## 5. セキュリティ上のベストプラクティス

### 5.1 IAM Identity Center使用時

✅ **推奨事項**:

**1. MFA必須化**
```
すべてのユーザーにMFAを設定
- Google Authenticator
- Microsoft Authenticator
- Authy
```

**2. 最小権限の原則**
```
必要最小限の権限セットを作成
- 開発者: PowerUserAccess（IAM操作不可）
- 管理者: AdministratorAccess（必要な場合のみ）
- 読み取り専用: ReadOnlyAccess
```

**3. セッション期間の適切な設定**
```
推奨: 8時間
- 1日の作業時間に十分
- 長時間放置のリスク低減
- 必要に応じて4時間または12時間
```

**4. 定期的なアクセスレビュー**
```
3ヶ月ごと:
- 使われていない権限セットの削除
- 退職者アカウントの無効化
- 権限の見直し
```

### 5.2 IAM使用時（避けるべき）

❌ **アンチパターン**:

**1. rootユーザーの日常利用**
```
rootユーザーは以下の場合のみ:
- アカウント閉鎖
- 請求情報変更
- IAM Identity Center初期設定
- サポートプラン変更
```

**2. IAMユーザーでの人間のアクセス**
```
人間がAWSにアクセスする場合:
- IAMユーザーは使わない
- IAM Identity Centerを使用
```

**3. アクセスキーの長期利用**
```
アクセスキーは:
- 人間には発行しない
- アプリケーションにはIAM Roleを使用
- CI/CDにはOIDC連携を使用
```

**4. 広すぎる権限**
```
AdministratorAccessは:
- 本当に必要な場合のみ
- 開発者にはPowerUserAccessで十分
```

---

## 6. よくある誤解と正しい理解

### 6.1 誤解1: IAMユーザーが基本

❌ **誤解**:
```
「AWSアカウントを作ったら、まずIAMユーザーを作る」
```

✅ **正しい理解**:
```
「AWSアカウントを作ったら、IAM Identity Centerを有効化する」

理由:
- IAMユーザーは2006年の古い仕組み
- IAM Identity Centerは2017年以降のモダンな仕組み
- AWSも公式にIAM Identity Centerを推奨
```

### 6.2 誤解2: IAM Identity Centerは大企業向け

❌ **誤解**:
```
「IAM Identity Centerは複雑で、個人開発には不要」
```

✅ **正しい理解**:
```
「IAM Identity Centerは個人開発でこそ使うべき」

理由:
- セットアップは30分程度
- アクセスキー管理の手間がなくなる
- セキュリティが大幅に向上
- 将来的な拡張が容易
```

### 6.3 誤解3: アクセスキーは安全に保管すればOK

❌ **誤解**:
```
「アクセスキーは ~/.aws/credentials に保存しているから安全」
```

✅ **正しい理解**:
```
「アクセスキーは原理的に漏洩リスクがある」

リスク:
- ファイルのバックアップに含まれる
- 誤ってGitにコミット
- マルウェアによる窃取
- 共有PCでの残留

→ IAM Identity Centerの一時認証情報なら、
  8時間で自動期限切れ（被害を最小化）
```

### 6.4 誤解4: rootユーザーは管理者だから日常的に使う

❌ **誤解**:
```
「rootユーザーは管理者用アカウントだから、管理作業に使う」
```

✅ **正しい理解**:
```
「rootユーザーは緊急時のみ使用」

rootユーザーの特徴:
- すべての権限を持つ（制限不可能）
- MFAリセット権限
- アカウント閉鎖権限
- 請求情報変更権限

→ 日常作業はIAM Identity Centerのユーザーを使用
  必要な権限のみを付与（最小権限の原則）
```

---

## 7. コスト

### 7.1 IAM Identity Centerの料金

```
基本機能: 無料
- ユーザー作成: 無料
- 権限セット作成: 無料
- SSOアクセス: 無料
- MFA: 無料

追加機能（オプション）:
- 外部IdP連携: 無料
- SCIM自動プロビジョニング: 無料
```

### 7.2 IAMの料金

```
基本機能: 無料
- IAMユーザー作成: 無料
- IAM Role作成: 無料
- ポリシー作成: 無料

注意点:
- アクセスキー管理の運用コスト（人件費）
- 漏洩時の被害コスト（潜在的）
```

**結論**: IAM Identity Centerは追加コストなしでセキュリティを大幅に向上

---

## 8. 移行パス

### 8.1 IAMユーザーからIAM Identity Centerへの移行

**ステップ1: IAM Identity Centerのセットアップ**
```
1. IAM Identity Centerを有効化
2. ユーザーを作成
3. 権限セットを割り当て
4. MFAを設定
```

**ステップ2: 並行運用**
```
1. IAM Identity Centerで日常作業を開始
2. IAMユーザーは予備として保持
3. 2-4週間の動作確認
```

**ステップ3: IAMユーザーの削除**
```
1. IAMユーザーのアクセスキーを削除
2. IAMユーザーを無効化
3. 1ヶ月後に完全削除
```

### 8.2 本プロジェクト（MyBlog-AWS）での適用

**現状**: rootユーザーのみ

**移行手順**:
```
1. IAM Identity Centerを有効化 ✅
2. blog-adminユーザーを作成 ✅
3. PowerUserAccess権限セットを割り当て ✅
4. MFAを設定 ✅
5. AWS CLIでSSO設定 ✅
6. rootユーザーにもMFA設定 ✅
7. rootユーザーの日常利用を停止 ✅

→ セキュアな開発環境の完成
```

---

## 9. まとめ

### 9.1 重要ポイント

| 項目 | IAM | IAM Identity Center |
|------|-----|-------------------|
| **対象** | アプリケーション | 人間のユーザー |
| **認証情報** | 長期（リスク高） | 一時的（セキュア） |
| **管理** | 個別アカウント | 複数アカウント一元管理 |
| **推奨用途** | Lambda, EC2等 | コンソール、CLI |
| **セキュリティ** | 手動設定 | ベストプラクティス組み込み |
| **コスト** | 無料 | 無料 |

### 9.2 選択の指針

```
人間がAWSにアクセス
  → IAM Identity Center

アプリケーション/サービス間
  → IAM Role

CI/CD
  → OIDC連携 + IAM Role

レガシーシステム（やむを得ない場合のみ）
  → IAMユーザー（アクセスキーのローテーション必須）
```

### 9.3 セキュリティチェックリスト

- [ ] rootユーザーにMFA設定
- [ ] rootユーザーのアクセスキーは作成していない
- [ ] IAM Identity Centerで開発者アカウント作成
- [ ] すべてのユーザーにMFA設定
- [ ] 最小権限の原則を適用
- [ ] セッション期間を適切に設定（8時間推奨）
- [ ] IAMユーザーは使用していない（人間のアクセス用）
- [ ] アクセスキーは人間には発行していない

---

## 10. 参考資料

### AWS公式ドキュメント

- [IAM Identity Center](https://docs.aws.amazon.com/singlesignon/)
- [IAM ベストプラクティス](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [AWS CLI with SSO](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)

### セキュリティガイドライン

- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS AWS Foundations Benchmark](https://www.cisecurity.org/benchmark/amazon_web_services)

---

**次のステップ**: [IAM Identity Centerセットアップ手順](../documents/03-1-iam-identity-center-setup.md)で実際にセットアップを開始

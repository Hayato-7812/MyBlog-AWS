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

## 🔑 用語の整理（重要）

このセクションでは、混乱しやすい用語を明確に定義します。

### **1. AWSアカウント**

```
= AWS環境全体を表す単位
= 請求の単位
= リソース（DynamoDB、S3等）を管理する箱

例: Hayato-7812
アカウントID: 799638632395

比喩: 
家そのもの
└─ この中に複数の住人（ユーザー）が住める
```

**AWSアカウントの役割:**
- すべてのAWSリソースを保持
- 請求情報を管理
- 複数のユーザーがアクセス可能
- IAM Identity Centerで管理

---

### **2. rootユーザー（Root User）**

```
= AWSアカウント作成時に自動的に作られる最初のユーザー
= メールアドレスとパスワードでログイン
= すべての権限を持つ（制限不可能）

ログイン情報:
- メールアドレス: アカウント作成時に登録したメール
- パスワード: 自分で設定したパスワード
- ログインURL: https://console.aws.amazon.com/

比喩:
家の所有者
└─ 家を売却する権限まで持つ
```

**rootユーザーの特徴:**
- ✅ すべてのAWSサービスにアクセス可能
- ✅ 請求情報の変更が可能
- ✅ アカウント閉鎖が可能
- ✅ IAM Identity Center の初期設定が可能
- ⚠️ 権限の制限が不可能（危険）
- ❌ 日常的に使うべきではない

**rootユーザーの使用タイミング:**
```
✅ AWSアカウントの初期設定
✅ IAM Identity Centerの有効化
✅ 請求情報の変更
✅ サポートプランの変更
✅ アカウントの閉鎖
✅ 緊急時のアクセス復旧

❌ 日常の開発作業
❌ リソースの作成・削除
❌ アプリケーションのデプロイ
```

---

### **3. blog-admin（IAM Identity Centerユーザー）**

```
= IAM Identity Centerで作成する開発用ユーザー
= ユーザーポータルURL + ユーザー名でログイン
= 割り当てられた権限セットの範囲内で操作可能

ログイン情報:
- ユーザーポータルURL: https://d-xxxxxxxxxx.awsapps.com/start
- ユーザー名: blog-admin
- パスワード: 自分で設定したパスワード
- MFA: 認証アプリの6桁コード

比喩:
家の住人（開発者）
└─ 家の中で開発作業をする権限のみ
```

**blog-adminの特徴:**
- ✅ 開発に必要な権限のみ保持
- ✅ DynamoDB、S3、Lambda等にアクセス可能
- ✅ 一時的な認証情報（8時間で期限切れ）
- ✅ MFAで保護
- ❌ IAMユーザー・ロールの作成は不可（安全）
- ❌ 請求情報の変更は不可
- ❌ アカウントの閉鎖は不可

**blog-adminの使用タイミング:**
```
✅ 日常の開発作業
✅ CDKでのインフラ構築
✅ AWS CLIでのリソース操作
✅ マネジメントコンソールでの確認作業

❌ 請求情報の変更
❌ アカウント設定の変更
❌ rootユーザーの管理
```

---

### **4. 関係図**

```
┌─────────────────────────────────────────┐
│ AWSアカウント（Hayato-7812）            │
│ = AWS環境全体                            │
│ = アカウントID: 799638632395             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ rootユーザー                        │ │
│  │ = メールアドレスでログイン          │ │
│  │ = すべての権限                      │ │
│  │ = 緊急時・初期設定のみ使用          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ IAM Identity Center                 │ │
│  │                                     │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │ blog-admin（開発用ユーザー） │  │ │
│  │  │ = ユーザーポータルでログイン │  │ │
│  │  │ = 開発に必要な権限のみ       │  │ │
│  │  │ = 日常的に使用               │  │ │
│  │  └──────────────────────────────┘  │ │
│  │                                     │ │
│  │  ┌──────────────────────────────┐  │ │
│  │  │ 権限セット: DeveloperAccess  │  │ │
│  │  │ = PowerUserAccess            │  │ │
│  │  │ = IAM操作以外すべて可能      │  │ │
│  │  └──────────────────────────────┘  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ リソース（DynamoDB、S3、Lambda等）│ │
│  │ = blog-adminがアクセスする対象   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### **5. よくある誤解と正しい理解**

#### **誤解1: rootユーザーにblog-adminを割り当てる**

❌ **間違い:**
```
「rootユーザーにblog-adminを割り当てる」
```

✅ **正しい理解:**
```
「AWSアカウントにblog-adminを割り当てる」

rootユーザーは「ユーザー」であり、
何かを割り当てる対象ではありません。

割り当て先は「AWSアカウント」です。
```

#### **誤解2: rootユーザー = AWSアカウント**

❌ **間違い:**
```
「rootユーザーとAWSアカウントは同じもの」
```

✅ **正しい理解:**
```
AWSアカウント: 環境全体（箱）
rootユーザー: その箱の中の最初のユーザー

関係:
AWSアカウント（箱）
  └─ rootユーザー（所有者）
  └─ blog-admin（開発者）
  └─ リソース（DynamoDB等）
```

#### **誤解3: blog-adminはrootユーザーの代わり**

❌ **間違い:**
```
「blog-adminはrootユーザーと同じ権限を持つ」
```

✅ **正しい理解:**
```
blog-admin: 開発に必要な権限のみ
rootユーザー: すべての権限（請求、アカウント閉鎖等）

blog-adminでできること:
✅ DynamoDB、S3、Lambda等の操作
✅ CDKでのインフラ構築

blog-adminでできないこと:
❌ 請求情報の変更
❌ アカウントの閉鎖
❌ IAMユーザーの作成
```

---

### **6. 本ガイドでやること**

```
目的:
rootユーザーを日常的に使わず、
blog-adminで安全に開発作業を行えるようにする

手順:
1. IAM Identity Centerを有効化（rootユーザーで実行）
2. blog-adminユーザーを作成
3. blog-adminに開発用の権限を付与
4. blog-adminでログインして開発作業
5. rootユーザーにMFAを設定して保護
6. rootユーザーは緊急時のみ使用

結果:
✅ セキュアな開発環境の完成
✅ rootユーザーの保護
✅ 最小権限の原則を実現
```

---

## ステップ1: IAM Identity Centerの有効化

### 1-1. IAM Identity Centerにアクセス

1. AWSマネジメントコンソールにrootユーザーでログイン
2. 検索バーで「IAM Identity Center」を検索
3. 「IAM Identity Center」をクリック

### 1-2. IAM Identity Centerを有効化

1. 「Enable」または「有効化」ボタンをクリック

2. **リージョンの確認と選択**

#### **なぜus-east-1（バージニア北部）を推奨するのか？**

IAM Identity Centerは**リージョナルサービス**ですが、選択したリージョンは「管理データの保存場所」であり、認証機能自体はグローバルに動作します。

**us-east-1を推奨する5つの理由:**

```
1. AWS公式の推奨リージョン
   - AWSドキュメントやチュートリアルの標準
   - 多くのグローバルサービスのデフォルト

2. 新機能の優先提供
   - 新機能が最初にリリースされるリージョン
   - 最新のセキュリティ機能をいち早く利用可能

3. CloudFrontとの整合性
   - CloudFront用のACM証明書はus-east-1必須
   - インフラ全体で一貫したリージョン戦略

4. コスト最適化
   - 多くのサービスでus-east-1が最安
   - データ転送料金も最も安価

5. トラブルシューティングの容易さ
   - 多くの事例がus-east-1ベース
   - コミュニティのサポートを受けやすい
```

#### **東京リージョン（ap-northeast-1）は使えないのか？**

**結論: 使えますが、推奨しません**

**東京リージョンを選ぶメリット:**
```
✅ 日本語UIの一部機能
✅ データ主権（日本国内にデータ保存）の要件がある場合
✅ 心理的な安心感
```

**東京リージョンを選ぶデメリット:**
```
❌ 新機能の提供が遅れる可能性
❌ CloudFront証明書はus-east-1が必要（結局両方使う）
❌ ドキュメントとの不一致（トラブル時に混乱）
❌ コストが若干高い場合がある
```

#### **レイテンシー（遅延）の影響は？**

**実際の影響: ほぼゼロ**

```
IAM Identity Centerの操作:
- ログイン: 1日1回程度
- セッション更新: 8時間に1回
- AWS CLI認証: 必要時のみ

us-east-1までのレイテンシー:
- 日本から約150ms
- しかし認証は数秒に1回なので影響なし

実際のリソース（DynamoDB、Lambda等）:
- ap-northeast-1（東京）にデプロイ
- こちらは低レイテンシーが重要
- IAM Identity Centerのリージョンとは無関係
```

#### **推奨設定:**

```
IAM Identity Center: us-east-1（バージニア北部）
└─ 認証・権限管理の中枢

実際のリソース: ap-northeast-1（東京）
└─ DynamoDB、Lambda、S3等のアプリケーションリソース
```

**この構成により:**
- 認証管理はAWS標準のベストプラクティスに従う
- アプリケーションは東京リージョンで低レイテンシー
- CloudFront証明書も一貫してus-east-1で管理
- 将来的な拡張も容易

#### **AWSの公式推奨メッセージについて**

IAM Identity Center有効化画面で以下のメッセージが表示されます：

```
「アクセスのレイテンシーを低く抑えるため、
ほとんどのワークフォースに地理的に近い AWS リージョンに
インスタンスを作成することをお勧めします。」

現在の AWS リージョン: 米国東部 (バージニア北部)
```

#### **このメッセージへの対応**

**状況別の判断:**

##### **ケース1: 個人開発・小規模プロジェクト（MyBlog-AWS）**

**推奨: us-east-1（バージニア北部）のまま進む** ✅

**理由:**
```
1. 操作頻度が極めて低い
   - ログイン: 1日1回
   - レイテンシー150msは無視できる
   
2. CloudFront証明書との整合性
   - ACM証明書はus-east-1必須
   - 一貫した戦略
   
3. コスト・新機能・サポート
   - すべての面でus-east-1が有利
   
4. 将来の拡張性
   - グローバル展開に対応しやすい
```

**画面での選択:**
```
「これは適切な AWS リージョンですか?」
→ 「はい」または「続行」を選択（us-east-1のまま）
```

##### **ケース2: 大規模企業（従業員100人以上、日本のみ）**

**推奨: ap-northeast-1（東京）に変更を検討** ⚠️

**理由:**
```
1. 多数の従業員が毎日ログイン
   - 150ms × 100人 = 体感速度に影響
   
2. データ主権の要件
   - 企業ポリシーで日本国内保存が必要
   
3. コンプライアンス
   - 金融機関・公的機関等の規制
```

**注意点:**
```
⚠️ CloudFront証明書は依然としてus-east-1が必要
⚠️ 両方のリージョンを管理する複雑さが増す
```

##### **ケース3: グローバル企業（複数国に拠点）**

**推奨: us-east-1（バージニア北部）のまま** ✅

**理由:**
```
1. 全世界の中間地点
   - どの地域からも公平なレイテンシー
   
2. グローバルサービスとの整合性
   - CloudFront、Route53等と一貫
   
3. 多言語・多地域の管理が容易
```

---

#### **本プロジェクト（MyBlog-AWS）の推奨設定**

**最終推奨: us-east-1（バージニア北部）のまま進む** ✅

**設定手順:**

```
1. IAM Identity Center有効化画面を確認

2. 「このアカウントにはリソースが含まれていますか?」
   → 個人開発の場合: 「いいえ」または「続行」
   → 既にリソースがある場合: 「はい」でも問題なし
   
   注記: この質問は警告のため。管理アカウントに
   リソースを置かないのがベストプラクティスですが、
   個人開発では1アカウントで問題ありません。

3. 「これは適切な AWS リージョンですか?」
   現在の AWS リージョン: 米国東部 (バージニア北部)
   
   → 「はい」または「続行」を選択
   
   理由の再確認:
   ✅ レイテンシー150msは無視できる（1日1回の操作）
   ✅ CloudFront証明書はus-east-1必須
   ✅ コスト最適化
   ✅ トラブルシューティングが容易
   ✅ 将来のグローバル展開に対応

4. 続行して有効化
```

#### **どうしても東京リージョンにしたい場合**

**リージョン変更手順:**

```
1. 画面で「リージョンを変更」または「Change region」をクリック
2. 「アジアパシフィック (東京) ap-northeast-1」を選択
3. 確認して続行

注意点:
⚠️ CloudFront用ACM証明書は別途us-east-1で作成が必要
⚠️ ドキュメントとの不一致でトラブル時に混乱の可能性
⚠️ 新機能提供が遅れる可能性
⚠️ 後からリージョン変更は不可能（再作成が必要）
```

#### **レイテンシーの実測値（参考）**

```
日本からの接続:
- us-east-1: 約150ms
- ap-northeast-1: 約5-10ms

差: 約140ms

影響:
- ログイン画面の表示: 1日1回 → 体感差なし
- MFA入力: 1日1回 → 体感差なし
- CLI認証: 8時間に1回 → 体感差なし

結論: 認証操作に140msの差は無視できる
```

---

3. **組織の設定**
   - 「AWS Organizations」の有効化を促される場合があります
   - 「Enable AWS Organizations」をクリック（必要に応じて）
   - 組織インスタンスが作成されます（推奨）

4. **完了を待つ**
   - 有効化には数分かかる場合があります
   - 完了すると、IAM Identity Centerのダッシュボードに遷移します

### 1-3. 有効化完了の確認

**ダッシュボードで以下を確認:**

```
✅ 「IAM Identity Center の組織インスタンスが正常に作成されました」
   という緑色の成功メッセージが表示される

✅ 設定の概要に以下が表示される:
   - アイデンティティソース: Identity Center ディレクトリ
   - プライマリリージョン: us-east-1
   - 組織 ID: o-xxxxxxxxxx
   - 発行者 URL: https://identitycenter.amazonaws.com/ssoins-xxxxx
```

**重要: ディレクトリは自動作成される**
```
Identity Center ディレクトリは自動的に作成されます。
ディレクトリを選択する画面は表示されません。

後から変更したい場合（通常は不要）:
- 設定 → アイデンティティソース → 変更
- Active DirectoryやExternal identity providerに変更可能
```

---

## ステップ2: ユーザー「blog-admin」の作成

### 2-1. ユーザーを追加

1. IAM Identity Centerのダッシュボードで「ユーザー」または「Users」をクリック
2. 「ユーザーを追加」または「Add user」をクリック

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

- 初回は「Skip」または「スキップ」してOK
- 後で「Developers」グループなどを作成して追加可能

4. 「ユーザーを追加」または「Add user」をクリック

**注意: 招待メールはまだ送信されません**
```
ユーザー作成後、すぐに招待メールは送信されません。
次のステップ（アカウントと権限セットの割り当て）完了後に送信されます。
```

---

## ステップ3: ユーザーにAWSアカウントと権限セットを割り当て

**重要: 実際のUIフロー**
```
権限セットは、アカウント割り当て時に選択します。
先に作成する必要はありません（この画面で作成も可能）。
```

### 3-1. アカウント割り当て画面に移動

**方法1: ユーザー作成後の画面から（推奨）**
```
ユーザー作成直後に表示される画面で:
「AWS アカウントの割り当て」または「Assign AWS accounts」をクリック
```

**方法2: ダッシュボードから**
```
1. IAM Identity Centerのダッシュボードで「AWS アカウント」をクリック
2. 自分のAWSアカウントを選択
3. 「ユーザーまたはグループを割り当て」をクリック
```

### 3-2. ユーザーを選択

```
ステップ1: ユーザーとグループの選択

1. 「ユーザー」タブを選択（デフォルト）
2. 「blog-admin」の左側のチェックボックスにチェックを入れる
   ☐ blog-admin → ☑ blog-admin
3. 「次へ」をクリック

注意: 少なくとも1つのユーザーを選択しないと
「次へ」ボタンが押せません
```

### 3-3. 権限セットを選択

```
ステップ2: 許可セットを選択

画面に表示される内容:
「許可セットを『Hayato-7812』に割り当て」
```

**ここで2つの選択肢があります:**

#### **Option A: 既存の権限セットを選択（簡単・推奨）**

既に「DeveloperAccess」などの権限セットが表示されている場合:

```
1. 既存の権限セットのチェックボックスにチェックを入れる
   ☑ DeveloperAccess

2. 「次へ」をクリック

3. 確認画面で「送信」をクリック
```

#### **Option B: 新しい権限セットを作成（カスタマイズしたい場合）**

権限セットがまだない場合、またはカスタムを作成したい場合:

```
1. 画面右上の「許可セットを作成」ボタンをクリック

2. 権限セットの作成画面に移動
   （詳細は「ステップ4: 権限セットの詳細」を参照）

3. 作成後、この画面に戻る

4. 作成した権限セットにチェックを入れる

5. 「次へ」→「送信」
```

---

## ステップ4: 権限セットの詳細（参考情報）

**注意: このステップは、ステップ3で新しい権限セットを作成する場合のみ必要です**

既に権限セットがある場合、このステップはスキップできます。

### 4-1. 権限セットの作成画面に移動

1. IAM Identity Centerのダッシュボードで「Permission sets」をクリック
2. 「Create permission set」をクリック

### 4-2. 権限セットのタイプを選択

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

### 4-3. セッション期間の設定

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

---

## ✅ セットアップ完了後の現状（2026/02/10時点）

### **達成したこと**

#### **1. セキュアな認証基盤の構築**

```
✅ IAM Identity Center有効化完了
  - リージョン: us-east-1（バージニア北部）
  - Identity Center ディレクトリ: 自動作成済み
  - 組織インスタンス: 作成済み

✅ 開発用ユーザー「blog-admin」作成完了
  - ユーザーポータルURL: 発行済み
  - 権限セット: DeveloperAccess（PowerUserAccess）
  - アカウント割り当て: 完了

✅ rootユーザー保護
  - MFA設定: 推奨（このガイドに従って設定）
  - アクセスキー: 未作成（セキュア）
  - 日常的な使用から卒業
```

#### **2. 開発環境のセットアップ完了**

```
✅ AWS CLI SSOの設定完了
  - プロファイル名: myblog-dev
  - SSO session: 設定済み
  - リージョン: ap-northeast-1（東京）
  - 認証: blog-adminユーザーで実行

✅ CDKプロジェクト初期化完了
  - プロジェクトパス: /Users/shimizuhayato/Desktop/MyBlog-AWS/myblog-aws
  - 言語: TypeScript
  - 依存関係: インストール済み

✅ CDK Bootstrap実行完了
  - リージョン: ap-northeast-1
  - CloudFormationスタック: CDKToolkit作成済み
  - S3バケット: CDK assets用バケット作成済み
  - IAMロール: CDK実行用ロール作成済み
```

---

### **現在できること**

#### **1. セキュアなAWSアクセス**

```bash
# blog-adminユーザーでAWS CLIを使用
export AWS_PROFILE=myblog-dev

# 認証情報の確認
aws sts get-caller-identity
# → blog-adminユーザーの情報が表示される

# AWSサービスへのアクセス
aws s3 ls                    # S3バケット一覧
aws dynamodb list-tables     # DynamoDBテーブル一覧
aws lambda list-functions    # Lambda関数一覧
```

#### **2. CDKでのインフラ構築**

```bash
# CDKプロジェクトディレクトリで作業
cd /Users/shimizuhayato/Desktop/MyBlog-AWS/myblog-aws

# CloudFormationテンプレート生成
npx cdk synth

# デプロイ前の差分確認
npx cdk diff

# スタックのデプロイ
npx cdk deploy

# デプロイされたリソースの削除
npx cdk destroy
```

#### **3. Infrastructure as Code（IaC）の実装**

```typescript
// lib/myblog-aws-stack.ts で以下のリソースを定義可能:

// DynamoDB
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

// Lambda
import * as lambda from 'aws-cdk-lib/aws-lambda';

// API Gateway
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// S3
import * as s3 from 'aws-cdk-lib/aws-s3';

// CloudFront
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';

// Cognito
import * as cognito from 'aws-cdk-lib/aws-cognito';

// Route53
import * as route53 from 'aws-cdk-lib/aws-route53';

// ACM (Certificate Manager)
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
```

---

### **次に実装すべきこと**

#### **Phase 1: Stateful Stack（データ層）**

```
優先度: 高

1. DynamoDBテーブル設計
   - Articles テーブル
   - Users テーブル（オプション）
   - Comments テーブル（オプション）

2. S3バケット作成
   - 記事用画像保存バケット
   - CloudFrontオリジンバケット

3. Cognito User Pool作成
   - ユーザー認証
   - パスワードポリシー設定
```

#### **Phase 2: Stateless Stack（アプリケーション層）**

```
優先度: 高

1. Lambda関数実装
   - CRUD操作（Create, Read, Update, Delete）
   - 認証・認可ロジック

2. API Gateway設定
   - RESTful API設計
   - CORSの設定
   - 認証統合

3. CloudFront設定
   - CDN配信
   - SSL/TLS証明書（ACM）
   - カスタムドメイン設定
```

#### **Phase 3: CI/CD Pipeline構築**

```
優先度: 中

1. GitHub Actions設定
   - 自動テスト
   - 自動デプロイ

2. 環境分離
   - 開発環境（dev）
   - 本番環境（prod）
```

---

### **開発フロー（推奨）**

```bash
# 1. feature ブランチを作成
git checkout -b feature/dynamodb-table

# 2. CDKコードを実装
vi lib/stateful-stack.ts

# 3. ビルド＆シンセサイズ
npm run build
npx cdk synth

# 4. 差分確認
npx cdk diff

# 5. デプロイ
npx cdk deploy

# 6. 動作確認
aws dynamodb list-tables --profile myblog-dev

# 7. コミット＆プッシュ
git add .
git commit -m "feat: Add DynamoDB Articles table"
git push origin feature/dynamodb-table

# 8. main ブランチにマージ
git checkout main
git merge feature/dynamodb-table
git push origin main
```

---

### **セキュリティ状態**

```
✅ 最小権限の原則を実装
  - blog-admin: 開発に必要な権限のみ
  - IAMユーザー・ロールの作成は不可

✅ 多要素認証（MFA）有効化推奨
  - blog-admin: 設定推奨
  - rootユーザー: 必須

✅ 一時的な認証情報
  - SSOセッション: 8時間で期限切れ
  - 自動的に再認証が必要

✅ rootユーザーの保護
  - 日常的な使用から卒業
  - 緊急時のみアクセス
```

---

### **CDK Bootstrap により作成されたリソース**

```
リージョン: ap-northeast-1（東京）

1. CloudFormationスタック
   - 名前: CDKToolkit
   - 状態: CREATE_COMPLETE

2. S3バケット
   - 用途: CDK assetsの保存
   - 命名: cdktoolkit-stagingbucket-*
   - バージョニング: 有効

3. IAMロール
   - CloudFormation実行ロール
   - ファイル公開ロール
   - イメージ公開ロール
   - ルックアップロール

4. SSMパラメータ
   - Bootstrap バージョン情報
```

---

### **開発環境サマリー**

```
プロジェクト名: MyBlog-AWS
プロジェクトパス: /Users/shimizuhayato/Desktop/MyBlog-AWS

構成:
├── myblog-aws/          # CDKプロジェクト
│   ├── lib/             # スタック定義
│   ├── bin/             # エントリーポイント
│   └── test/            # テストコード
├── documents/           # 設計ドキュメント
├── catch-up/           # 学習メモ
└── wire-frame/         # ワイヤーフレーム

認証:
- ユーザー: blog-admin（IAM Identity Center）
- プロファイル: myblog-dev
- MFA: 設定推奨

リージョン戦略:
- IAM Identity Center: us-east-1（認証管理）
- アプリケーション: ap-northeast-1（リソース）
```

---

### **🎯 今後の作業ロードマップ**

#### **Week 1-2: データ層の構築**
```
□ DynamoDBテーブル設計
□ S3バケット設計
□ Cognito User Pool設計
□ CDKでの実装
```

#### **Week 3-4: アプリケーション層の構築**
```
□ Lambda関数実装
□ API Gateway設計
□ 認証・認可の実装
□ テストコード作成
```

#### **Week 5-6: フロントエンドとの統合**
```
□ React（ワイヤーフレーム）との接続
□ API統合テスト
□ E2Eテスト
```

#### **Week 7-8: デプロイ＆本番化**
```
□ CloudFront設定
□ カスタムドメイン設定
□ SSL/TLS証明書取得
□ 本番デプロイ
```

---

## 🎊 まとめ

### **達成した主要なマイルストーン**

1. ✅ **セキュリティ基盤の構築完了**
   - rootユーザーからの卒業
   - IAM Identity Centerによる開発者認証
   - 最小権限の原則の実装

2. ✅ **開発環境の完全セットアップ**
   - AWS CLI SSO設定完了
   - CDKプロジェクト初期化完了
   - CDK Bootstrap実行完了

3. ✅ **Infrastructure as Code（IaC）の準備完了**
   - CDKによるインフラ管理が可能
   - TypeScriptでのインフラ定義が可能
   - version管理されたインフラ

### **現在の状態**

```
セキュリティ: ✅ 本番レベル
開発環境: ✅ 完全セットアップ済み
IaCツール: ✅ CDK準備完了
次のステップ: データ層（Stateful Stack）の実装

準備完了！インフラ構築を開始できます 🚀
```

---

**最終更新: 2026年2月10日**

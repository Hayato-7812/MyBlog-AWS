# MyBlog-AWS アーキテクチャ図生成ツール

AWS公式アイコンを使用したアーキテクチャ図を自動生成するDiagrams as Codeツールです。

---

## 📋 概要

Pythonの`diagrams`ライブラリを使用して、MyBlog-AWSのアーキテクチャ図を自動生成します。

### 生成される図

1. **概要図** (`architecture_overview.png`)
   - システム全体の構成
   - ユーザー、CDN、AppStack、DataStack
   - シンプルでわかりやすい

2. **詳細図** (`architecture_details.png`)
   - 全リソースの詳細
   - API Gatewayエンドポイント
   - Lambda関数6個
   - データフロー

---

## 🚀 クイックスタート

### 1. 前提条件

```bash
# Pythonバージョン確認
python3 --version  # Python 3.7以上

# Graphvizインストール（必須）
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows
# https://graphviz.org/download/ からインストール
```

### 2. Pythonライブラリのインストール

```bash
# diagramsライブラリをインストール
pip3 install diagrams
```

### 3. 図の生成

```bash
# プロジェクトルートで実行
cd /Users/shimizuhayato/Desktop/MyBlog-AWS

# スクリプト実行
python3 documents/architecture_diagram.py
```

### 4. 生成されたファイル

```
documents/assets/images/
├── architecture_overview.png    # 概要図
└── architecture_details.png     # 詳細図
```

---

## 📖 使用方法

### 基本的な使い方

```bash
# 図を生成
python3 documents/architecture_diagram.py

# 実行可能にする（オプション）
chmod +x documents/architecture_diagram.py
./documents/architecture_diagram.py
```

### カスタマイズ

`architecture_diagram.py`を編集して、図をカスタマイズできます。

```python
# 例: 方向を変更
direction="LR"  # 左から右
direction="TB"  # 上から下（デフォルト）

# 例: ファイル名を変更
filename="my_custom_diagram"

# 例: 自動表示を有効化
show=True  # ブラウザで自動表示
```

---

## 🎨 Diagrams as Codeの利点

### 1. バージョン管理
```
- Gitで図の変更履歴を追跡
- コードレビューで図の変更を確認
- Diffで変更点を明確に把握
```

### 2. 保守性
```
- テキストベースで編集が容易
- 一貫性のあるスタイル
- 自動レイアウト
```

### 3. 自動化
```
- CI/CDパイプラインで自動生成
- インフラ変更時に自動更新
- ドキュメントの同期が簡単
```

### 4. AWS公式アイコン
```
- 最新のAWSアイコンを使用
- プロフェッショナルな見た目
- 標準的な表現
```

---

## 📚 サンプル出力

### 概要図の特徴

```
- ユーザー層（一般・管理者）
- CDN層（CloudFront × 2）
- AppStack
  - S3 Frontend
  - API Gateway
  - Lambda関数 × 6
- DataStack
  - DynamoDB
  - S3 Media
  - Cognito
- データフローの可視化
```

### 詳細図の特徴

```
- すべてのリソース
- API Gatewayエンドポイント
  - Public: /posts, /posts/{id}
  - Admin: /admin/posts, /admin/posts/{id}, /admin/presigned-url
- Lambda関数の詳細
  - Read Operations
  - Write Operations
  - Media Operations
- DynamoDB操作
  - Query
  - TransactWrite
- 認証フロー
```

---

## 🛠️ トラブルシューティング

### Graphvizがインストールされていない

```bash
# エラー: ExecutableNotFound: failed to execute ['dot', ...]

# 解決方法
brew install graphviz  # macOS
sudo apt-get install graphviz  # Ubuntu
```

### Pythonモジュールが見つからない

```bash
# エラー: ModuleNotFoundError: No module named 'diagrams'

# 解決方法
pip3 install diagrams
```

### パスの問題

```bash
# エラー: No such file or directory: 'documents/assets/images'

# 解決方法: プロジェクトルートから実行
cd /Users/shimizuhayato/Desktop/MyBlog-AWS
python3 documents/architecture_diagram.py
```

---

## 📝 カスタマイズ例

### 1. 色の変更

```python
# Clusterの背景色を変更
with Cluster("DataStack", graph_attr={"bgcolor": "lightblue"}):
    # ...
```

### 2. エッジのスタイル変更

```python
# 点線のエッジ
user >> Edge(label="HTTPS", style="dotted") >> cloudfront

# 太い線
lambda_fn >> Edge(penwidth="3.0") >> dynamodb
```

### 3. アイコンの追加

```python
from diagrams.aws.analytics import Analytics
from diagrams.aws.ml import Sagemaker

# 新しいリソースを追加
analytics = Analytics("CloudWatch")
```

---

## 🔄 CI/CD統合

### GitHub Actionsの例

```yaml
name: Generate Architecture Diagrams

on:
  push:
    paths:
      - 'documents/architecture_diagram.py'
      - 'myblog-aws/lib/**'

jobs:
  generate-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      
      - name: Install Graphviz
        run: sudo apt-get install graphviz
      
      - name: Install Python dependencies
        run: pip install diagrams
      
      - name: Generate diagrams
        run: python3 documents/architecture_diagram.py
      
      - name: Commit diagrams
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add documents/assets/images/*.png
          git commit -m "docs: update architecture diagrams" || true
          git push
```

---

## 📚 参考資料

### 公式ドキュメント

- [Diagrams Documentation](https://diagrams.mingrammer.com/)
- [Diagrams GitHub](https://github.com/mingrammer/diagrams)
- [AWS Architecture Icons](https://aws.amazon.com/jp/architecture/icons/)

### チュートリアル

- [Diagrams as Code - Introduction](https://diagrams.mingrammer.com/docs/getting-started/installation)
- [AWS Diagrams Examples](https://diagrams.mingrammer.com/docs/nodes/aws)

### ベストプラクティス

1. **定期的な更新**
   - インフラ変更時に図を更新
   - CIで自動生成を推奨

2. **シンプルさの維持**
   - 図が複雑になりすぎないよう注意
   - 必要に応じて複数の図に分割

3. **一貫性**
   - 命名規則の統一
   - スタイルの統一

---

## 💡 Tips

### 1. 複数の図を生成

```python
# overview.py
with Diagram("Overview", filename="overview"):
    # ...

# details.py
with Diagram("Details", filename="details"):
    # ...
```

### 2. チーム共有

```bash
# 図をMarkdownドキュメントに埋め込む
![Architecture](documents/assets/images/architecture_overview.png)
```

### 3. プレゼンテーション

```
- PNG形式で出力（デフォルト）
- 高解像度で印刷可能
- PowerPoint/Keynoteに直接挿入可能
```

---

## ✅ チェックリスト

### 初回セットアップ

- [ ] Python 3.7以上インストール
- [ ] Graphvizインストール
- [ ] diagramsライブラリインストール
- [ ] スクリプト実行権限付与（オプション）

### 図の生成

- [ ] プロジェクトルートから実行
- [ ] 生成されたPNGファイル確認
- [ ] 必要に応じてカスタマイズ
- [ ] Gitにコミット

---

## 🎯 次のステップ

1. **図の生成を試す**
   ```bash
   python3 documents/architecture_diagram.py
   ```

2. **生成された図を確認**
   ```bash
   open documents/assets/images/architecture_overview.png
   open documents/assets/images/architecture_details.png
   ```

3. **カスタマイズ**
   - `architecture_diagram.py`を編集
   - 色、スタイル、レイアウトを調整

4. **CI/CD統合（オプション）**
   - GitHub Actionsで自動生成
   - インフラ変更時に自動更新

---

**作成日**: 2026年2月11日  
**バージョン**: 1.0  
**Author**: MyBlog-AWS Team

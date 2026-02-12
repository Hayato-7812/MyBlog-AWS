# フロントエンド MVP版 実装ガイド（Next.js App Router）

## 目次
1. [概要](#概要)
2. [技術スタック選定理由](#技術スタック選定理由)
3. [wire-frame分析結果](#wire-frame分析結果)
4. [MVP機能要件](#mvp機能要件)
5. [プロジェクト構成](#プロジェクト構成)
6. [実装手順](#実装手順)
7. [デプロイ手順](#デプロイ手順)

---

## 概要

### プロジェクト名
MyBlog Frontend MVP (Next.js 15 App Router)

### 目的
- wire-frameで実現されているすべてのUI/UXをNext.jsで実装
- SEO最適化（SSR/SSG）
- CloudFront経由での配信
- バックエンドAPI（HTTP API）との統合

### 開発期間目安
- セットアップ: 1日
- コア機能実装: 3-5日
- API統合・テスト: 2-3日
- **合計: 約1週間**

---

## 技術スタック選定理由

### Next.js 15 (App Router) - 採用理由

#### 1. **SEO最適化**
- **SSR (Server-Side Rendering)**: 記事詳細ページ
- **SSG (Static Site Generation)**: 記事一覧・静的ページ
- **ISR (Incremental Static Regeneration)**: 新記事公開時の自動再生成

#### 2. **パフォーマンス**
- 自動コード分割
- 画像最適化（next/image）
- フォント最適化（next/font）
- React Server Components

#### 3. **開発体験**
- ファイルベースルーティング
- TypeScript完全サポート
- Hot Module Replacement
- 組み込みCSS/Tailwind CSS サポート

#### 4. **AWS統合**
- S3 + CloudFront での Static Export
- API Routes → HTTP API統合
- 環境変数管理

### 技術スタック構成

```
Next.js 15 (App Router)
├── React 18
├── TypeScript 5
├── Tailwind CSS 4 (@tailwindcss/postcss)
├── Lucide React (アイコン)
├── Axios (API通信)
├── date-fns (日付処理)
└── autoprefixer (CSS後処理)
```

**注意**: Tailwind CSS 4では`@tailwindcss/postcss`パッケージを使用

---

## wire-frame分析結果

### 実装済みコンポーネント（wire-frame/Article List Screen）

#### 📱 画面構成
1. **ログイン画面** (`LoginForm.tsx`)
   - メール/パスワード入力
   - パスワード忘れリンク
   - 美しいグラデーション背景

2. **記事一覧画面** (メイン画面)
   - **Header** (`Header.tsx`)
     - サイトロゴ
     - ナビゲーションメニュー
   - **ArticleCard** (`ArticleCard.tsx`) × 6
     - サムネイル画像
     - カテゴリタグ
     - タイトル・要約
     - 公開日・読了時間
   - **Sidebar** (`Sidebar.tsx`)
     - 検索ボックス
     - カテゴリ一覧
     - 最新記事リスト
   - **Footer** (`Footer.tsx`)

3. **記事詳細画面** (`ArticleDetail.tsx`)
   - フルサイズヘッダー画像
   - 記事本文（HTML）
   - 著者情報
   - タグ一覧
   - 「記事一覧に戻る」ボタン

#### 🎨 UIライブラリ
- **shadcn/ui**: 40+コンポーネント
- **Radix UI**: アクセシビリティ対応
- **Lucide React**: アイコン
- **Tailwind CSS 4**: スタイリング

### wire-frameの問題点（保守性）

#### ❌ 問題
1. **モックデータのハードコーディング**
   - `mockArticles` 配列が App.tsx に直接記述
   - API統合の準備がない

2. **状態管理の欠如**
   - useState のみ
   - ページネーション、フィルタリング未実装

3. **認証機能が空実装**
   - LoginForm は console.log のみ
   - Cognito統合なし

4. **ルーティングが仮想的**
   - 単一コンポーネントで画面切り替え
   - URL変更なし（SEO的に NG）

5. **レスポンシブ対応が不完全**
   - モバイルサイドバーが実装途中

#### ✅ MVP版での改善方針
- Next.js App Routerでファイルベースルーティング
- API統合（GET /posts, GET /posts/{id}）
- Cognito認証統合（AWS Amplify）
- 適切な状態管理（Context API or Zustand）
- 完全なレスポンシブ対応

---

## MVP機能要件

### Phase 1: 公開機能（認証不要）

#### 1.1 トップページ (`/`)
- [ ] 記事一覧表示（SSG）
- [ ] カテゴリフィルタ
- [ ] 検索機能
- [ ] ページネーション（10件/ページ）
- [ ] サイドバー（カテゴリ・最新記事）

#### 1.2 記事詳細ページ (`/posts/[postId]`)
- [ ] 記事本文表示（SSR）
- [ ] OGP対応（meta tags）
- [ ] パンくずリスト
- [ ] 関連記事表示
- [ ] SNSシェアボタン

#### 1.3 カテゴリページ (`/category/[name]`)
- [ ] カテゴリ別記事一覧（SSG）
- [ ] ページネーション

### Phase 2: 管理機能（認証必須）

#### 2.1 ログインページ (`/login`)
- [ ] Cognito認証フォーム
- [ ] パスワードリセット
- [ ] セッション管理

#### 2.2 管理ダッシュボード (`/admin`)
- [ ] 記事一覧（下書き含む）
- [ ] 新規作成ボタン
- [ ] 編集・削除ボタン

#### 2.3 記事作成・編集 (`/admin/posts/new`, `/admin/posts/[id]/edit`)
- [ ] リッチテキストエディタ
- [ ] 画像アップロード（Pre-signed URL）
- [ ] プレビュー機能
- [ ] 下書き保存・公開

---

## プロジェクト構成

### ディレクトリ構造

```
frontend/
├── app/                          # App Router
│   ├── (public)/                 # 公開画面グループ
│   │   ├── page.tsx              # トップページ
│   │   ├── posts/
│   │   │   └── [postId]/
│   │   │       └── page.tsx      # 記事詳細
│   │   └── category/
│   │       └── [name]/
│   │           └── page.tsx      # カテゴリ別一覧
│   ├── (auth)/                   # 認証画面グループ
│   │   └── login/
│   │       └── page.tsx          # ログイン
│   ├── admin/                    # 管理画面（認証必須）
│   │   ├── page.tsx              # ダッシュボード
│   │   └── posts/
│   │       ├── new/
│   │       │   └── page.tsx      # 新規作成
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx  # 編集
│   ├── api/                      # API Routes（Proxy）
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── layout.tsx                # Root Layout
│   ├── not-found.tsx             # 404ページ
│   └── error.tsx                 # エラーページ
├── components/                   # React コンポーネント
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── article/
│   │   ├── ArticleCard.tsx
│   │   ├── ArticleDetail.tsx
│   │   └── ArticleEditor.tsx
│   ├── auth/
│   │   └── LoginForm.tsx
│   └── ui/                       # shadcn/ui コンポーネント
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
├── lib/                          # ユーティリティ
│   ├── api/                      # APIクライアント
│   │   ├── client.ts
│   │   ├── posts.ts
│   │   └── auth.ts
│   ├── auth/                     # 認証処理
│   │   └── cognito.ts
│   └── utils/
│       ├── format.ts
│       └── seo.ts
├── types/                        # TypeScript型定義
│   ├── post.ts
│   ├── api.ts
│   └── user.ts
├── public/                       # 静的ファイル
│   ├── images/
│   └── fonts/
├── styles/                       # グローバルスタイル
│   └── globals.css
├── .env.local                    # 環境変数
├── .env.example
├── next.config.js                # Next.js設定
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 実装手順

### Step 1: プロジェクトセットアップ（1日目）

#### 1.1 Next.jsプロジェクト作成

```bash
# frontendディレクトリ作成
cd /Users/shimizuhayato/Desktop/MyBlog-AWS
npx create-next-app@latest frontend

# 対話型セットアップ
✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like to use `src/` directory? … No
✔ Would you like to use App Router? … Yes
✔ Would you like to customize the default import alias? … No
```

#### 1.2 依存パッケージインストール

```bash
cd frontend

# UIライブラリ
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install lucide-react date-fns

# API通信
npm install axios swr

# 認証
npm install aws-amplify @aws-amplify/ui-react

# フォーム
npm install react-hook-form zod @hookform/resolvers

# エディタ
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image

# 開発ツール
npm install -D @types/node @types/react @types/react-dom
```

#### 1.3 shadcn/ui セットアップ

```bash
npx shadcn-ui@latest init

# 必要なコンポーネントをインストール
npx shadcn-ui@latest add button card input label textarea
npx shadcn-ui@latest add dropdown-menu dialog alert
npx shadcn-ui@latest add badge separator skeleton
npx shadcn-ui@latest add form select checkbox switch
```

#### 1.4 環境変数設定

```bash
# .env.local 作成
cat > .env.local << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://hvqh0yavxe.execute-api.ap-northeast-1.amazonaws.com

# AWS Cognito
NEXT_PUBLIC_COGNITO_REGION=ap-northeast-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-northeast-1_sLYQGYp7X
NEXT_PUBLIC_COGNITO_CLIENT_ID=kmj9es19h7u2qigf914dsrqn0

# CloudFront
NEXT_PUBLIC_MEDIA_CDN=https://d3nf8x1ocsev4s.cloudfront.net
NEXT_PUBLIC_FRONTEND_CDN=https://d10a37r05xb397.cloudfront.net

# Site Configuration
NEXT_PUBLIC_SITE_NAME=MyBlog
NEXT_PUBLIC_SITE_URL=https://d10a37r05xb397.cloudfront.net
EOF

# .env.example 作成
cp .env.local .env.example
```

### Step 2: 型定義・ユーティリティ実装（1日目）

#### 2.1 型定義作成 (`types/post.ts`)

```typescript
// types/post.ts
export interface Post {
  postId: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  content: ContentBlock[];
  tags: string[];
  category?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  author?: {
    sub: string;
    email: string;
    username: string;
  };
}

export interface ContentBlock {
  order: number;
  type: 'text' | 'image' | 'code' | 'quote';
  content: string;
  layout: 'full' | 'half';
  metadata?: {
    language?: string;
    caption?: string;
  };
}

export interface PostListItem {
  postId: string;
  title: string;
  summary: string;
  status: 'draft' | 'published';
  tags: string[];
  category?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  readTime?: string;
}

export interface PostsResponse {
  posts: PostListItem[];
  nextToken?: string;
}
```

#### 2.2 APIクライアント (`lib/api/client.ts`)

```typescript
// lib/api/client.ts
import axios, { AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター（認証トークン追加）
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private async getAuthToken(): Promise<string | null> {
    // AWS Amplify から JWT トークン取得
    try {
      const { Auth } = await import('aws-amplify');
      const session = await Auth.currentSession();
      return session.getIdToken().getJwtToken();
    } catch {
      return null;
    }
  }

  async getPosts(params?: { status?: string; limit?: number; nextToken?: string }) {
    const response = await this.client.get('/posts', { params });
    return response.data;
  }

  async getPost(postId: string) {
    const response = await this.client.get(`/posts/${postId}`);
    return response.data;
  }

  async createPost(data: any) {
    const response = await this.client.post('/admin/posts', data);
    return response.data;
  }

  async updatePost(postId: string, data: any) {
    const response = await this.client.put(`/admin/posts/${postId}`, data);
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await this.client.delete(`/admin/posts/${postId}`);
    return response.data;
  }

  async generatePresignedUrl(fileName: string, contentType: string) {
    const response = await this.client.post('/admin/presigned-url', {
      fileName,
      contentType,
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### Step 3: 共通コンポーネント実装（2日目）

#### 3.1 Layout コンポーネント

wire-frameから移植：
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/layout/Sidebar.tsx`

#### 3.2 Article コンポーネント

wire-frameから移植・改善：
- `components/article/ArticleCard.tsx` 
  - API データ型に対応
  - next/image 使用
- `components/article/ArticleDetail.tsx`
  - ContentBlock配列レンダリング
  - SEO meta tags

### Step 4: 公開画面実装（3日目）

#### 4.1 トップページ (`app/(public)/page.tsx`)

```typescript
// app/(public)/page.tsx
import { Metadata } from 'next';
import { apiClient } from '@/lib/api/client';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'MyBlog - 最新記事',
  description: 'テクノロジー、ライフスタイル、ビジネスなど様々なトピックの記事を配信',
};

// SSG: 10分ごとに再生成
export const revalidate = 600;

export default async function HomePage() {
  const { posts } = await apiClient.getPosts({ status: 'published', limit: 10 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">最新記事</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <ArticleCard key={post.postId} article={post} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 記事詳細ページ (`app/(public)/posts/[postId]/page.tsx`)

```typescript
// app/(public)/posts/[postId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { ArticleDetail } from '@/components/article/ArticleDetail';

interface Props {
  params: { postId: string };
}

// 動的OGP生成
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await apiClient.getPost(params.postId);
    return {
      title: `${post.title} | MyBlog`,
      description: post.summary,
      openGraph: {
        title: post.title,
        description: post.summary,
        images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
        type: 'article',
        publishedTime: post.publishedAt,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.summary,
        images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
      },
    };
  } catch {
    return { title: '記事が見つかりません' };
  }
}

// SSR: 常に最新データ
export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: Props) {
  try {
    const post = await apiClient.getPost(params.postId);
    
    if (post.status !== 'published') {
      notFound();
    }

    return <ArticleDetail article={post} />;
  } catch {
    notFound();
  }
}
```

### Step 5: 認証機能実装（4日目）

#### 5.1 Amplify 設定 (`lib/auth/amplify-config.ts`)

```typescript
// lib/auth/amplify-config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
});
```

#### 5.2 ログインページ (`app/(auth)/login/page.tsx`)

wire-frameの `LoginForm.tsx` を改良：
- Amplify Auth.signIn() 統合
- エラーハンドリング
- リダイレクト処理

### Step 6: 管理画面実装（5日目）

#### 6.1 認証ミドルウェア

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // /admin/* へのアクセスは認証チェック
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // クライアントサイドで Amplify Auth チェック
    // ここではリダイレクトのみ
    const token = request.cookies.get('amplify-token');
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
```

#### 6.2 記事作成・編集画面

TipTap エディタ統合：
- リッチテキスト編集
- 画像アップロード（Pre-signed URL経由）
- プレビュー機能

### Step 7: デプロイ設定（6日目）

#### 7.1 next.config.js 設定

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static Export for S3
  images: {
    unoptimized: true, // S3では画像最適化無効
    domains: ['d3nf8x1ocsev4s.cloudfront.net'],
  },
  trailingSlash: true,
  // 環境変数
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION,
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    NEXT_PUBLIC_COGNITO_CLIENT_ID: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  },
};

module.exports = nextConfig;
```

#### 7.2 ビルド・デプロイスクリプト

```bash
# scripts/deploy-frontend.sh
#!/bin/bash

set -e

echo "🏗️  Building Next.js application..."
cd frontend
npm run build

echo "📦 Syncing to S3..."
aws s3 sync out/ s3://myblog-appstack-frontendbucketefe2e19c-rw1l1qmjcbae/ \
  --profile myblog-dev \
  --delete \
  --cache-control "public, max-age=31536000, immutable"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id E2K129PSGRSNK2 \
  --paths "/*" \
  --profile myblog-dev

echo "✅ Deployment complete!"
echo "🌐 https://d10a37r05xb397.cloudfront.net"
```

---

## デプロイ手順

### 手順1: ビルド

```bash
cd frontend
npm run build
```

### 手順2: S3アップロード

```bash
aws s3 sync out/ s3://myblog-appstack-frontendbucketefe2e19c-rw1l1qmjcbae/ \
  --profile myblog-dev \
  --delete
```

### 手順3: CloudFrontキャッシュ削除

```bash
aws cloudfront create-invalidation \
  --distribution-id E2K129PSGRSNK2 \
  --paths "/*" \
  --profile myblog-dev
```

### 手順4: 動作確認

```bash
# CloudFront URL
open https://d10a37r05xb397.cloudfront.net
```

---

## まとめ

### 実装完了チェックリスト

#### Phase 1: 公開機能
- [ ] トップページ（記事一覧）
- [ ] 記事詳細ページ
- [ ] カテゴリページ
- [ ] 検索機能
- [ ] レスポンシブ対応

#### Phase 2: 管理機能
- [ ] ログイン・認証
- [ ] 管理ダッシュボード
- [ ] 記事作成・編集
- [ ] 画像アップロード
- [ ] プレビュー機能

#### Phase 3: デプロイ
- [ ] ビルド成功
- [ ] S3アップロード
- [ ] CloudFront配信
- [ ] 本番動作確認

### 次のステップ

1. **パフォーマンス最適化**
   - Lighthouse スコア 90+
   - Core Web Vitals 改善

2. **SEO強化**
   - sitemap.xml 生成
   - robots.txt 設定
   - 構造化データ（JSON-LD）

3. **分析・モニタリング**
   - Google Analytics 統合
   - エラートラッキング（Sentry）

4. **追加機能**
   - コメント機能
   - いいね機能
   - RSS フィード

---

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [shadcn/ui](https://ui.shadcn.com/)
- [AWS Amplify](https://docs.amplify.aws/)
- [Tailwind CSS](https://tailwindcss.com/)

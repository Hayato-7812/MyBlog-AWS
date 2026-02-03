import { useState } from 'react';
import { Header } from '@/app/components/Header';
import { ArticleCard, Article } from '@/app/components/ArticleCard';
import { ArticleDetail } from '@/app/components/ArticleDetail';
import { Sidebar } from '@/app/components/Sidebar';
import { Footer } from '@/app/components/Footer';
import { AdminHeader } from '@/app/components/admin/AdminHeader';
import { AdminSidebar } from '@/app/components/admin/AdminSidebar';
import { ArticleTable, AdminArticle } from '@/app/components/admin/ArticleTable';
import { ArticleFilters } from '@/app/components/admin/ArticleFilters';
import { EditorHeader } from '@/app/components/admin/editor/EditorHeader';
import { TitleInput } from '@/app/components/admin/editor/TitleInput';
import { BlockEditor, Block } from '@/app/components/admin/editor/BlockEditor';
import { EditorSidebar } from '@/app/components/admin/editor/EditorSidebar';
import { PlusCircle } from 'lucide-react';

// モックデータ
const articles: Article[] = [
  {
    id: 1,
    title: 'モダンWeb開発のベストプラクティス2026',
    summary: 'React、TypeScript、Tailwind CSSを使った最新のWeb開発手法を解説します。パフォーマンスとユーザー体験を最適化するためのヒントをご紹介。',
    thumbnail: 'https://images.unsplash.com/photo-1739343338040-2dae68f6bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcwMDQ3MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'テクノロジー',
    date: '2026-02-02',
    readTime: '5分'
  },
  {
    id: 2,
    title: '自然の中で見つける心の平穏',
    summary: '忙しい日常から離れて、自然の中で過ごす時間の大切さについて考えます。週末に行ける絶景スポットもご紹介。',
    thumbnail: 'https://images.unsplash.com/photo-1596905738125-a6b51b1bdbb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGUlMjBzdW5zZXR8ZW58MXx8fHwxNzcwMDMyNDI1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'ライフスタイル',
    date: '2026-02-01',
    readTime: '4分'
  },
  {
    id: 3,
    title: 'リモートワークで生産性を最大化する方法',
    summary: '在宅勤務でもオフィス以上のパフォーマンスを発揮するためのテクニックと環境設定のポイントを解説します。',
    thumbnail: 'https://images.unsplash.com/photo-1622127921946-f58d7ef32593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvcmtzcGFjZSUyMGRlc2t8ZW58MXx8fHwxNzcwMDQwMzk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'ビジネス',
    date: '2026-01-31',
    readTime: '6分'
  },
  {
    id: 4,
    title: '世界の美しい都市建築を巡る旅',
    summary: 'ヨーロッパからアジアまで、息をのむような建築デザインを持つ都市を訪れた記録。建築愛好家必見の旅行ガイド。',
    thumbnail: 'https://images.unsplash.com/photo-1646673592159-d20b6ca5db6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBjaXR5JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3MDAzOTY3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '旅行',
    date: '2026-01-30',
    readTime: '8分'
  },
  {
    id: 5,
    title: '健康的な食生活のための簡単レシピ集',
    summary: '忙しい平日でも短時間で作れる、栄養バランスの取れた美味しい料理のレシピをご紹介します。',
    thumbnail: 'https://images.unsplash.com/photo-1665088127661-83aeff6104c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwY29va2luZyUyMGluZ3JlZGllbnRzfGVufDF8fHx8MTc3MDEwMTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: '料理',
    date: '2026-01-29',
    readTime: '5分'
  },
  {
    id: 6,
    title: '初心者でも続けられるフィットネスルーティン',
    summary: '運動習慣ゼロから始められる、無理のないトレーニングプログラムと継続のコツを伝授します。',
    thumbnail: 'https://images.unsplash.com/photo-1634144646738-809a0f8897c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXhlcmNpc2UlMjBoZWFsdGh8ZW58MXx8fHwxNzcwMTAxNDk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'フィットネス',
    date: '2026-01-28',
    readTime: '7分'
  }
];

// 記事詳細用のモックデータ
const articleDetailData = {
  id: 1,
  title: 'モダンWeb開発のベストプラクティス2026',
  category: 'テクノロジー',
  date: '2026-02-02',
  readTime: '5分',
  thumbnail: 'https://images.unsplash.com/photo-1739343338040-2dae68f6bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcwMDQ3MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  content: `
    <p>Web開発の世界は急速に進化しており、2026年現在、開発者が知っておくべきベストプラクティスも大きく変化しています。この記事では、React、TypeScript、Tailwind CSSを使った最新の開発手法について詳しく解説します。</p>

    <h2>1. TypeScriptの完全活用</h2>
    <p>TypeScriptは今や必須のツールとなっています。型安全性を確保することで、開発時のバグを大幅に削減し、リファクタリングも容易になります。特に大規模なプロジェクトでは、その真価を発揮します。</p>

    <p>最新のTypeScript 5.xでは、より強力な型推論機能が追加され、明示的な型定義を減らしながらも、高い型安全性を保つことができるようになりました。</p>

    <h2>2. パフォーマンス最適化の重要性</h2>
    <p>ユーザー体験を向上させるためには、パフォーマンスの最適化が不可欠です。以下のポイントに注意しましょう：</p>

    <ul>
      <li>コンポーネントの適切なメモ化（React.memo、useMemo、useCallback）</li>
      <li>コード分割とLazy Loading</li>
      <li>画像の最適化とWebP形式の活用</li>
      <li>バンドルサイズの削減</li>
    </ul>

    <h2>3. アクセシビリティファースト</h2>
    <p>現代のWeb開発では、アクセシビリティを後回しにすることはできません。すべてのユーザーが等しくアプリケーションを利用できるよう、WAI-ARIAガイドラインに従った実装を心がけましょう。</p>

    <p>セマンティックHTMLの使用、適切なARIA属性の設定、キーボードナビゲーションのサポートなど、基本的な要素から始めることが重要です。</p>

    <img src="https://images.unsplash.com/photo-1622131815183-e7f8bbac9cd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3b3Jrc3BhY2UlMjBsYXB0b3B8ZW58MXx8fHwxNzcwMDY1MDAxfDA&ixlib=rb-4.1.0&q=80&w=1080" alt="モダンな開発環境" style="width: 100%; height: auto; margin: 2rem 0; border-radius: 8px;" />

    <h2>4. テスト駆動開発（TDD）</h2>
    <p>品質の高いコードを書くためには、テストが欠かせません。Jest、React Testing Library、Cypressなどのツールを活用し、ユニットテスト、統合テスト、E2Eテストを実装しましょう。</p>

    <p>テストを先に書くことで、より保守性の高いコードが生まれ、将来的な変更にも強くなります。</p>

    <h2>5. 継続的な学習</h2>
    <p>技術は日々進化しています。最新のトレンドやベストプラクティスをキャッチアップするために、コミュニティに参加したり、技術ブログを読んだりすることが重要です。</p>

    <p>また、実際にプロジェクトで新しい技術を試してみることで、より深い理解が得られます。失敗を恐れず、常に学び続ける姿勢を持ちましょう。</p>

    <h2>まとめ</h2>
    <p>モダンなWeb開発では、技術的なスキルだけでなく、ユーザー体験、アクセシビリティ、パフォーマンスなど、多角的な視点が求められます。これらのベストプラクティスを実践することで、より良いWebアプリケーションを作ることができるでしょう。</p>
  `,
  author: {
    name: '田中 太郎',
    avatar: 'https://images.unsplash.com/photo-1683815251677-8df20f826622?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHBlcnNvbnxlbnwxfHx8fDE3NzAwNjM5MTF8MA&ixlib=rb-4.1.0&q=80&w=1080',
    bio: 'フロントエンド開発者として10年以上のキャリアを持つ。特にReactとTypeScriptを使ったアプリケーション開発を得意とし、複数の大規模プロジェクトを成功に導いてきた。技術ブログの執筆や勉強会での登壇も積極的に行っている。'
  },
  tags: ['React', 'TypeScript', 'Web開発', 'フロントエンド', 'ベストプラクティス']
};

// 管理画面用のモックデータ
const adminArticles: AdminArticle[] = [
  {
    id: 1,
    title: 'モダンWeb開発のベストプラクティス2026',
    thumbnail: 'https://images.unsplash.com/photo-1739343338040-2dae68f6bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcwMDQ3MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'PUBLISHED',
    category: 'テクノロジー',
    createdAt: '2026-02-02 10:30',
    updatedAt: '2026-02-02 14:20'
  },
  {
    id: 2,
    title: '自然の中で見つける心の平穏',
    thumbnail: 'https://images.unsplash.com/photo-1596905738125-a6b51b1bdbb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmUlMjBsYW5kc2NhcGUlMjBzdW5zZXR8ZW58MXx8fHwxNzcwMDMyNDI1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'PUBLISHED',
    category: 'ライフスタイル',
    createdAt: '2026-02-01 09:15',
    updatedAt: '2026-02-01 11:45'
  },
  {
    id: 3,
    title: 'リモートワークで生産性を最大化する方法',
    thumbnail: 'https://images.unsplash.com/photo-1622127921946-f58d7ef32593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHdvcmtzcGFjZSUyMGRlc2t8ZW58MXx8fHwxNzcwMDQwMzk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'DRAFT',
    category: 'ビジネス',
    createdAt: '2026-01-31 16:00',
    updatedAt: '2026-02-02 09:30'
  },
  {
    id: 4,
    title: '世界の美しい都市建築を巡る旅',
    thumbnail: 'https://images.unsplash.com/photo-1646673592159-d20b6ca5db6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBjaXR5JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3MDAzOTY3MXww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'PUBLISHED',
    category: '旅行',
    createdAt: '2026-01-30 13:20',
    updatedAt: '2026-01-30 15:50'
  },
  {
    id: 5,
    title: '健康的な食生活のための簡単レシピ集',
    thumbnail: 'https://images.unsplash.com/photo-1665088127661-83aeff6104c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwY29va2luZyUyMGluZ3JlZGllbnRzfGVufDF8fHx8MTc3MDEwMTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'DRAFT',
    category: '料理',
    createdAt: '2026-01-29 11:00',
    updatedAt: '2026-01-31 10:15'
  },
  {
    id: 6,
    title: '初心者でも続けられるフィットネスルーティン',
    thumbnail: 'https://images.unsplash.com/photo-1634144646738-809a0f8897c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXhlcmNpc2UlMjBoZWFsdGh8ZW58MXx8fHwxNzcwMTAxNDk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'ARCHIVE',
    category: 'フィットネス',
    createdAt: '2026-01-28 14:30',
    updatedAt: '2026-01-28 16:00'
  },
  {
    id: 7,
    title: 'AIと機械学習の最新トレンド',
    thumbnail: 'https://images.unsplash.com/photo-1739343338040-2dae68f6bdf5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYWJzdHJhY3R8ZW58MXx8fHwxNzcwMDQ3MjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    status: 'DRAFT',
    category: 'テクノロジー',
    createdAt: '2026-01-27 08:45',
    updatedAt: '2026-02-01 12:00'
  }
];

export default function App() {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'admin' | 'editor'>('editor');
  
  // エディタ用の状態
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBlocks, setEditorBlocks] = useState<Block[]>([
    { id: 'block-1', type: 'text', content: '' }
  ]);
  const [editorStatus, setEditorStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVE'>('DRAFT');
  const [editorCategory, setEditorCategory] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [editorThumbnail, setEditorThumbnail] = useState('');
  const [editorPublishDate, setEditorPublishDate] = useState('');
  const [editorSlug, setEditorSlug] = useState('');
  const [editorMetaDescription, setEditorMetaDescription] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {viewMode === 'editor' ? (
        <div>
          <EditorHeader 
            isNewArticle={true}
            onBack={() => setViewMode('admin')}
          />
          
          <main className="max-w-7xl mx-auto px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* メインエディタエリア（左側 60-70%） */}
              <div className="lg:col-span-2">
                <TitleInput 
                  value={editorTitle}
                  onChange={setEditorTitle}
                />
                
                <BlockEditor 
                  blocks={editorBlocks}
                  onBlocksChange={setEditorBlocks}
                />
              </div>

              {/* サイドバー（右側 30-40%） */}
              <div className="lg:col-span-1">
                <EditorSidebar
                  status={editorStatus}
                  category={editorCategory}
                  tags={editorTags}
                  thumbnailUrl={editorThumbnail}
                  publishDate={editorPublishDate}
                  slug={editorSlug}
                  metaDescription={editorMetaDescription}
                  onStatusChange={setEditorStatus}
                  onCategoryChange={setEditorCategory}
                  onTagsChange={setEditorTags}
                  onThumbnailChange={setEditorThumbnail}
                  onPublishDateChange={setEditorPublishDate}
                  onSlugChange={setEditorSlug}
                  onMetaDescriptionChange={setEditorMetaDescription}
                />
              </div>
            </div>
          </main>
        </div>
      ) : viewMode === 'admin' ? (
        <div className="flex">
          {/* サイドバー */}
          <AdminSidebar activeMenu="articles" />
          
          <div className="flex-1">
            <AdminHeader 
              userName="田中 太郎" 
              userAvatar="https://images.unsplash.com/photo-1750816204148-5d02aff367cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZG1pbiUyMHVzZXIlMjBhdmF0YXJ8ZW58MXx8fHwxNzcwMTAyMTY2fDA&ixlib=rb-4.1.0&q=80&w=1080"
            />
            
            <main className="p-8">
              {/* ページヘッダー */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">記事一覧</h1>
                  <p className="text-gray-600">
                    すべての記事を管理できます
                  </p>
                </div>
                <button className="flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  新規記事作成
                </button>
              </div>
              
              {/* 記事フィルタ */}
              <ArticleFilters />

              {/* 記事テーブル */}
              <div className="mt-6">
                <ArticleTable articles={adminArticles} />
              </div>

              {/* ページネーション */}
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    前へ
                  </button>
                  <button className="px-4 py-2 text-white bg-blue-600 rounded-lg">
                    1
                  </button>
                  <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    2
                  </button>
                  <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    3
                  </button>
                  <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                    次へ
                  </button>
                </nav>
              </div>
            </main>
          </div>
        </div>
      ) : (
        <div>
          <Header />
          
          {viewMode === 'list' ? (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* メインコンテンツエリア */}
                <div className="lg:col-span-2">
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">最新記事</h1>
                    <p className="text-gray-600">
                      様々なトピックの記事をお楽しみください
                    </p>
                  </div>
                  
                  {/* 記事グリッド */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                      <div key={article.id} onClick={() => setViewMode('detail')} className="cursor-pointer">
                        <ArticleCard article={article} />
                      </div>
                    ))}
                  </div>

                  {/* ページネーション */}
                  <div className="mt-12 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                        前へ
                      </button>
                      <button className="px-4 py-2 text-white bg-blue-600 rounded-lg">
                        1
                      </button>
                      <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                        2
                      </button>
                      <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                        3
                      </button>
                      <button className="px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                        次へ
                      </button>
                    </nav>
                  </div>
                </div>

                {/* サイドバー */}
                <div className="lg:col-span-1">
                  <Sidebar />
                </div>
              </div>
            </main>
          ) : (
            <main>
              <div className="bg-white py-4 border-b border-gray-200 mb-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                  <button 
                    onClick={() => setViewMode('list')}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    ← 記事一覧に戻る
                  </button>
                </div>
              </div>
              <ArticleDetail article={articleDetailData} />
            </main>
          )}

          <Footer />
        </div>
      )}
    </div>
  );
}
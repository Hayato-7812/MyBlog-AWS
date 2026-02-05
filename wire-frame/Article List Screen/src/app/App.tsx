import { useState } from 'react';
import { Header } from './components/Header';
import { ArticleCard, Article } from './components/ArticleCard';
import { ArticleDetail } from './components/ArticleDetail';
import { Sidebar } from './components/Sidebar';
import { MobileSidebarButton } from './components/MobileSidebarButton';
import { Footer } from './components/Footer';
import { LoginForm } from './components/auth/LoginForm';

const mockArticles: Article[] = [
  {
    id: 1,
    title: 'モダンWeb開発のベストプラクティス',
    summary: 'React、TypeScript、Tailwind CSSを使った最新のWeb開発手法について解説します。効率的な開発フローとパフォーマンス最適化のコツをご紹介。',
    thumbnail: 'https://images.unsplash.com/photo-1677022733442-99d2d7c60c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwY29tcHV0ZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzcwMjQ4MDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'テクノロジー',
    date: '2026-02-05',
    readTime: '8分'
  },
  {
    id: 2,
    title: '心地よい暮らしを作る5つの習慣',
    summary: '毎日の生活をより快適にするシンプルな習慣をご紹介。朝のルーティンから夜のリラックス方法まで、すぐに始められる実践的なアイデア集。',
    thumbnail: 'https://images.unsplash.com/photo-1651303317362-eefb146745d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaWZlc3R5bGUlMjBjb3p5JTIwaG9tZXxlbnwxfHx8fDE3NzAyNjM1NTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'ライフスタイル',
    date: '2026-02-04',
    readTime: '6分'
  },
  {
    id: 3,
    title: 'リモートワークを成功させる秘訣',
    summary: '在宅勤務で生産性を最大化する方法とは？時間管理、コミュニケーション、ワークスペースの設定など、プロが実践するテクニックを公開。',
    thumbnail: 'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBvZmZpY2V8ZW58MXx8fHwxNzcwMTk3MzYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'ビジネス',
    date: '2026-02-03',
    readTime: '10分'
  },
  {
    id: 4,
    title: '絶景を求めて：日本の秘境スポット10選',
    summary: 'まだ知られていない日本の美しい場所をご紹介。都会の喧騒を離れて、自然の中でリフレッシュできる穴場スポットを厳選しました。',
    thumbnail: 'https://images.unsplash.com/photo-1664263722962-4590c42ab5a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBhZHZlbnR1cmUlMjBtb3VudGFpbnxlbnwxfHx8fDE3NzAxODU1MTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '旅行',
    date: '2026-02-02',
    readTime: '12分'
  },
  {
    id: 5,
    title: '週末に作れる本格イタリアン',
    summary: '自宅で簡単に作れる本格的なイタリア料理のレシピをシェフが伝授。パスタから前菜まで、家族や友人を喜ばせる料理の数々。',
    thumbnail: 'https://images.unsplash.com/photo-1636647511414-c9ec06da32bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwY29va2luZyUyMGtpdGNoZW58ZW58MXx8fHwxNzcwMjM3MzYwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: '料理',
    date: '2026-02-01',
    readTime: '15分'
  },
  {
    id: 6,
    title: '初心者でもできる筋トレメニュー',
    summary: 'ジムに行かなくても自宅でできる効果的なトレーニング方法。正しいフォームと継続のコツを、パーソナルトレーナーが詳しく解説します。',
    thumbnail: 'https://images.unsplash.com/photo-1584827386916-b5351d3ba34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXhlcmNpc2UlMjBneW18ZW58MXx8fHwxNzcwMTM4MjYzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'フィットネス',
    date: '2026-01-31',
    readTime: '9分'
  }
];

const mockDetailArticle = {
  id: 1,
  title: 'モダンWeb開発のベストプラクティス',
  category: 'テクノロジー',
  date: '2026-02-05',
  readTime: '8分',
  thumbnail: 'https://images.unsplash.com/photo-1677022733442-99d2d7c60c6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwY29tcHV0ZXIlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzcwMjQ4MDk4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  content: `
    <p>現代のWeb開発は、かつてないほど多様なツールと技術に満ちています。React、TypeScript、Tailwind CSSなどの技術スタックは、開発者にとって強力な武器となっています。</p>
    
    <h2>なぜこれらの技術を選ぶのか</h2>
    <p>Reactは宣言的なUIを構築するための優れたライブラリです。コンポーネントベースのアーキテクチャにより、再利用可能で保守しやすいコードを書くことができます。</p>
    
    <p>TypeScriptは型安全性を提供し、開発時のバグを大幅に減らします。大規模なプロジェクトでは特に重要です。</p>
    
    <h2>パフォーマンス最適化のポイント</h2>
    <p>モダンなWebアプリケーションでは、パフォーマンスが極めて重要です。以下のポイントに注意しましょう：</p>
    <ul>
      <li>コンポーネントの遅延ローディング</li>
      <li>画像の最適化とWebP形式の使用</li>
      <li>コード分割とバンドルサイズの削減</li>
      <li>メモ化とパフォーマンスフックの活用</li>
    </ul>
    
    <h2>まとめ</h2>
    <p>これらのベストプラクティスを実践することで、より高速で保守しやすいWebアプリケーションを構築できます。継続的な学習と改善を心がけましょう。</p>
  `,
  author: {
    name: '山田太郎',
    avatar: 'https://images.unsplash.com/photo-1683815251677-8df20f826622?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHBlcnNvbnxlbnwxfHx8fDE3NzAxNzIzMTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    bio: 'フロントエンドエンジニアとして10年以上の経験を持つ。React、TypeScript、モダンWeb技術の専門家。技術ブログやカンファレンスでの登壇も多数。'
  },
  tags: ['React', 'TypeScript', 'Web開発', 'パフォーマンス']
};

export default function App() {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'login'>('list');
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  const handleArticleClick = (id: number) => {
    setSelectedArticleId(id);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedArticleId(null);
  };

  const handleLogin = (email: string, password: string) => {
    console.log('Login attempt:', email);
    // ログイン成功後は記事一覧画面へ
    setViewMode('list');
  };

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
  };

  // ログイン画面
  if (viewMode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"></div>
        
        {/* 装飾的な要素 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* ログインフォーム */}
        <div className="relative z-10">
          <LoginForm 
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
          />
        </div>

        {/* デモ用：画面切り替えボタン */}
        <button
          onClick={() => setViewMode('list')}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow text-sm font-medium"
        >
          記事一覧へ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* デモ用：画面切り替えボタン */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={() => setViewMode('login')}
          className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow text-sm font-medium"
        >
          ログイン画面
        </button>
      </div>

      {viewMode === 'list' ? (
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* メインコンテンツ：記事一覧 */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">最新記事</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mockArticles.map((article) => (
                    <div key={article.id} onClick={() => handleArticleClick(article.id)} className="cursor-pointer">
                      <ArticleCard article={article} />
                    </div>
                  ))}
                </div>
              </div>

              {/* サイドバー（デスクトップのみ表示） */}
              <div className="hidden lg:block">
                <Sidebar />
              </div>
            </div>
          </main>

          {/* モバイル用サイドバーボタン */}
          <MobileSidebarButton />
        </>
      ) : (
        <main>
          <button
            onClick={handleBackToList}
            className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2 transition-colors touch-manipulation"
          >
            <span>← 記事一覧に戻る</span>
          </button>
          <ArticleDetail article={mockDetailArticle} />
        </main>
      )}
      
      <Footer />
    </div>
  );
}
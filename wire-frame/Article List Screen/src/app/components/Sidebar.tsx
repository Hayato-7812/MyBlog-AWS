import { Search, TrendingUp } from 'lucide-react';

const categories = [
  { name: 'テクノロジー', count: 12 },
  { name: 'ライフスタイル', count: 8 },
  { name: 'ビジネス', count: 15 },
  { name: '旅行', count: 6 },
  { name: '料理', count: 10 },
  { name: 'フィットネス', count: 7 },
];

const recentArticles = [
  { title: 'モダンWeb開発のベストプラクティス', date: '2026-02-02' },
  { title: '効率的なリモートワークのコツ', date: '2026-02-01' },
  { title: '2026年注目のAI技術トレンド', date: '2026-01-31' },
  { title: '健康的な朝の習慣を作る方法', date: '2026-01-30' },
];

export function Sidebar() {
  return (
    <aside className="space-y-6 sm:space-y-8">
      {/* 検索ボックス */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">検索</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="記事を検索..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </div>
      </div>

      {/* カテゴリー一覧 */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">カテゴリー</h3>
        <div className="space-y-1 sm:space-y-2">
          {categories.map((category) => (
            <a
              key={category.name}
              href="#"
              className="flex justify-between items-center py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-50 transition-colors group touch-manipulation"
            >
              <span className="text-sm sm:text-base text-gray-700 group-hover:text-blue-600">
                {category.name}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">({category.count})</span>
            </a>
          ))}
        </div>
      </div>

      {/* 最新記事 */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">最新記事</h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {recentArticles.map((article, index) => (
            <a
              key={index}
              href="#"
              className="block group touch-manipulation"
            >
              <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                {article.title}
              </h4>
              <p className="text-xs text-gray-500">{article.date}</p>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
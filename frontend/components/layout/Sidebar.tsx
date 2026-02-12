import { Search, TrendingUp } from 'lucide-react';

const categories = [
  { name: 'テクノロジー', count: 12 },
  { name: 'ライフスタイル', count: 8 },
  { name: 'ビジネス', count: 15 },
  { name: '旅行', count: 6 },
  { name: '料理', count: 10 },
  { name: 'フィットネス', count: 7 },
];

export function Sidebar() {
  return (
    <aside className="space-y-6 sm:space-y-8">
      {/* Search Box */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          検索
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="記事を検索..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="記事を検索"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          カテゴリー
        </h3>
        <div className="space-y-1 sm:space-y-2">
          {categories.map((category) => (
            <a
              key={category.name}
              href={`/category/${encodeURIComponent(category.name)}`}
              className="flex justify-between items-center py-2 px-2 sm:px-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-sm sm:text-base text-gray-700 group-hover:text-blue-600">
                {category.name}
              </span>
              <span className="text-xs sm:text-sm text-gray-500">
                ({category.count})
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Popular Posts */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            人気記事
          </h3>
        </div>
        <div className="space-y-3 sm:space-y-4">
          <div className="group">
            <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
              モダンWeb開発のベストプラクティス
            </h4>
            <p className="text-xs text-gray-500">2026-02-05</p>
          </div>
          <div className="group">
            <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
              効率的なリモートワークのコツ
            </h4>
            <p className="text-xs text-gray-500">2026-02-04</p>
          </div>
          <div className="group">
            <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
              2026年注目のAI技術トレンド
            </h4>
            <p className="text-xs text-gray-500">2026-02-03</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

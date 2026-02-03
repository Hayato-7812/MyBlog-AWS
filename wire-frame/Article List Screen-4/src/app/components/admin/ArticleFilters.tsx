import { Search, Filter } from 'lucide-react';

interface ArticleFiltersProps {
  onStatusChange?: (status: string) => void;
  onCategoryChange?: (category: string) => void;
  onSearchChange?: (search: string) => void;
}

export function ArticleFilters({ 
  onStatusChange, 
  onCategoryChange, 
  onSearchChange 
}: ArticleFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* 検索ボックス */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="記事を検索..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* フィルター */}
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-600" />
          
          {/* ステータスフィルター */}
          <select
            onChange={(e) => onStatusChange?.(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">全てのステータス</option>
            <option value="DRAFT">下書き</option>
            <option value="PUBLISHED">公開</option>
            <option value="ARCHIVE">アーカイブ</option>
          </select>

          {/* カテゴリーフィルター */}
          <select
            onChange={(e) => onCategoryChange?.(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">全てのカテゴリー</option>
            <option value="テクノロジー">テクノロジー</option>
            <option value="ライフスタイル">ライフスタイル</option>
            <option value="ビジネス">ビジネス</option>
            <option value="旅行">旅行</option>
            <option value="料理">料理</option>
            <option value="フィットネス">フィットネス</option>
          </select>
        </div>
      </div>
    </div>
  );
}

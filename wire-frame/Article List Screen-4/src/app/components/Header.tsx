import { Search, Menu } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ / タイトル */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">MyBlog</h1>
          </div>

          {/* ナビゲーションメニュー（デスクトップ） */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
              About
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
              Contact
            </a>
          </nav>

          {/* 検索アイコンとハンバーガーメニュー（モバイル） */}
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="検索"
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-gray-900 md:hidden transition-colors"
              aria-label="メニュー"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

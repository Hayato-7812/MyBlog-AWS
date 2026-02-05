import { Filter } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';
import { useState } from 'react';

export function MobileSidebarButton() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* モバイル用フローティングボタン */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed bottom-6 right-6 lg:hidden z-30 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center touch-manipulation"
        aria-label="フィルターとカテゴリー"
      >
        <Filter className="w-6 h-6" />
      </button>

      {/* モバイル用サイドバーメニュー */}
      <MobileMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <div className="p-4">
          <Sidebar />
        </div>
      </MobileMenu>
    </>
  );
}

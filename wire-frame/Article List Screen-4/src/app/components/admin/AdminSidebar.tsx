import { LayoutDashboard, FileText, PlusCircle, Image, Settings } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

interface AdminSidebarProps {
  activeMenu?: string;
  onMenuClick?: (menuId: string) => void;
}

export function AdminSidebar({ activeMenu = 'articles', onMenuClick }: AdminSidebarProps) {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: <LayoutDashboard className="w-5 h-5" />,
      active: activeMenu === 'dashboard'
    },
    {
      id: 'articles',
      label: '記事一覧',
      icon: <FileText className="w-5 h-5" />,
      active: activeMenu === 'articles'
    },
    {
      id: 'new-article',
      label: '新規記事作成',
      icon: <PlusCircle className="w-5 h-5" />,
      active: activeMenu === 'new-article'
    },
    {
      id: 'media',
      label: 'メディアライブラリ',
      icon: <Image className="w-5 h-5" />,
      active: activeMenu === 'media'
    },
    {
      id: 'settings',
      label: '設定',
      icon: <Settings className="w-5 h-5" />,
      active: activeMenu === 'settings'
    }
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onMenuClick?.(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              item.active
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

import { Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

export interface AdminArticle {
  id: number;
  title: string;
  thumbnail: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVE';
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface ArticleTableProps {
  articles: AdminArticle[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function ArticleTable({ articles, onEdit, onDelete }: ArticleTableProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      ARCHIVE: 'bg-gray-100 text-gray-800'
    };

    const labels = {
      DRAFT: '下書き',
      PUBLISHED: '公開',
      ARCHIVE: 'アーカイブ'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>サムネイル</span>
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>タイトル</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>ステータス</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>カテゴリー</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>作成日時</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900">
                  <span>更新日時</span>
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  アクション
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <ImageWithFallback
                    src={article.thumbnail}
                    alt={article.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                    {article.title}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(article.status)}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{article.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{article.createdAt}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{article.updatedAt}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit?.(article.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      aria-label="編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(article.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

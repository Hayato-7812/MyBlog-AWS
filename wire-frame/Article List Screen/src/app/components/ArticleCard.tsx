import { Calendar, Clock } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

export interface Article {
  id: number;
  title: string;
  summary: string;
  thumbnail: string;
  category: string;
  date: string;
  readTime: string;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* サムネイル画像 */}
      <div className="relative overflow-hidden aspect-[16/10]">
        <ImageWithFallback
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* コンテンツエリア */}
      <div className="p-4 sm:p-6">
        {/* カテゴリータグ */}
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-full">
            {article.category}
          </span>
        </div>

        {/* タイトル */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          <a href="#">{article.title}</a>
        </h2>

        {/* 要約 */}
        <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">
          {article.summary}
        </p>

        {/* メタ情報 */}
        <div className="flex items-center text-xs sm:text-sm text-gray-500 space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{article.readTime}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
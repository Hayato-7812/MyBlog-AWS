import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { PostListItem } from '@/types/post';

interface ArticleCardProps {
  article: PostListItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  // Format date
  const formattedDate = article.publishedAt
    ? format(new Date(article.publishedAt), 'yyyy年MM月dd日', { locale: ja })
    : format(new Date(article.createdAt || Date.now()), 'yyyy年MM月dd日', {
        locale: ja,
      });

  // Calculate read time if not provided
  const readTime = article.readTime || '5分';

  // Fallback thumbnail
  const thumbnailUrl =
    article.thumbnailUrl ||
    'https://images.unsplash.com/photo-1677022733442-99d2d7c60c6f?w=800&h=500&fit=crop';

  return (
    <Link href={`/posts/${article.postId}`}>
      <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative overflow-hidden aspect-[16/10] bg-gray-200">
          <Image
            src={thumbnailUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          {/* Category Tag */}
          {article.category && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-full font-medium">
                {article.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors flex-1">
            {article.title}
          </h2>

          {/* Summary */}
          <p className="text-sm sm:text-base text-gray-600 mb-4 line-clamp-2">
            {article.summary}
          </p>

          {/* Meta Info */}
          <div className="flex items-center text-xs sm:text-sm text-gray-500 space-x-3 sm:space-x-4 mt-auto">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{readTime}</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

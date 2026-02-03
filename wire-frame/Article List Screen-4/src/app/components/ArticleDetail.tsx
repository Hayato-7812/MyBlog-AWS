import { Calendar, Clock, Tag, Share2, Bookmark } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ArticleDetailProps {
  article: {
    id: number;
    title: string;
    category: string;
    date: string;
    readTime: string;
    thumbnail: string;
    content: string;
    author: {
      name: string;
      avatar: string;
      bio: string;
    };
    tags: string[];
  };
}

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <article className="bg-white">
      {/* ヘッダー情報 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* カテゴリー */}
        <div className="mb-4">
          <span className="inline-block px-4 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-full">
            {article.category}
          </span>
        </div>

        {/* タイトル */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {article.title}
        </h1>

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{article.date}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{article.readTime}</span>
          </div>
          <div className="ml-auto flex items-center space-x-3">
            <button 
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="共有"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="ブックマーク"
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* サムネイル画像（横幅いっぱい） */}
      <div className="w-full mb-12">
        <ImageWithFallback
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-auto max-h-[600px] object-cover"
        />
      </div>

      {/* 記事本文 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="prose prose-lg max-w-none mb-12"
          style={{
            lineHeight: '1.8',
            fontSize: '1.125rem',
            color: '#374151'
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        {/* タグ */}
        <div className="mb-12 pb-12 border-b border-gray-200">
          <div className="flex items-center flex-wrap gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            {article.tags.map((tag) => (
              <a
                key={tag}
                href="#"
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                #{tag}
              </a>
            ))}
          </div>
        </div>

        {/* 著者情報 */}
        <div className="mb-12 p-6 bg-gray-50 rounded-xl">
          <div className="flex items-start space-x-4">
            <ImageWithFallback
              src={article.author.avatar}
              alt={article.author.name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {article.author.name}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {article.author.bio}
              </p>
            </div>
          </div>
        </div>

        {/* 関連記事セクション */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">関連記事</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 関連記事はここに追加可能 */}
          </div>
        </div>
      </div>
    </article>
  );
}

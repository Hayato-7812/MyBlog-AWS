import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { apiClient } from '@/lib/api/client';
import type { Post } from '@/types/post';

interface Props {
  params: { postId: string };
}

// Dynamic OGP generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await apiClient.getPost(params.postId);
  
  if (!post) {
    return { title: '記事が見つかりません' };
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: post.thumbnailUrl ? [post.thumbnailUrl] : [],
    },
  };
}

// SSR - always get fresh data
export const dynamic = 'force-dynamic';

function renderContentBlock(block: Post['content'][0], index: number) {
  switch (block.type) {
    case 'text':
      return (
        <div
          key={index}
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    
    case 'image':
      return (
        <figure key={index} className="my-8">
          <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
            <Image
              src={block.content}
              alt={block.metadata?.alt || ''}
              fill
              className="object-cover"
            />
          </div>
          {block.metadata?.caption && (
            <figcaption className="mt-2 text-sm text-gray-600 text-center">
              {block.metadata.caption}
            </figcaption>
          )}
        </figure>
      );
    
    case 'code':
      return (
        <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6">
          <code>{block.content}</code>
        </pre>
      );
    
    case 'quote':
      return (
        <blockquote key={index} className="border-l-4 border-blue-600 pl-4 my-6 italic text-gray-700">
          {block.content}
        </blockquote>
      );
    
    default:
      return null;
  }
}

export default async function PostPage({ params }: Props) {
  const post = await apiClient.getPost(params.postId);

  if (!post || post.status !== 'published') {
    notFound();
  }

  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), 'yyyy年MM月dd日', { locale: ja })
    : format(new Date(post.createdAt), 'yyyy年MM月dd日', { locale: ja });

  // Sort content blocks by order
  const sortedContent = [...post.content].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          記事一覧に戻る
        </Link>
      </div>

      {/* Article Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header Image */}
        {post.thumbnailUrl && (
          <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden mb-8">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-10">
          {/* Category */}
          {post.category && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-full font-medium">
                {post.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-8 pb-8 border-b">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>8分で読めます</span>
            </div>
          </div>

          {/* Summary */}
          <div className="text-lg text-gray-700 mb-8 pb-8 border-b">
            {post.summary}
          </div>

          {/* Content Blocks */}
          <div className="space-y-6">
            {sortedContent.map((block, index) => renderContentBlock(block, index))}
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">タグ</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Author (if available) */}
          {post.author && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">著者について</h3>
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {post.author.username[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{post.author.username}</h4>
                  <p className="text-sm text-gray-600">{post.author.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

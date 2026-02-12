import { apiClient } from '@/lib/api/client';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Sidebar } from '@/components/layout/Sidebar';

// SSG with revalidation every 10 minutes
export const revalidate = 600;

export default async function HomePage() {
  const { posts } = await apiClient.getPosts({
    status: 'published',
    limit: 12,
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              最新記事
            </h2>
            {posts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">まだ記事がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <ArticleCard key={post.postId} article={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

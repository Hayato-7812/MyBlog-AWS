import { Calendar, Tag, Image, Link2, FileText } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface EditorSidebarProps {
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVE';
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  publishDate: string;
  slug: string;
  metaDescription: string;
  onStatusChange: (status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVE') => void;
  onCategoryChange: (category: string) => void;
  onTagsChange: (tags: string[]) => void;
  onThumbnailChange: (url: string) => void;
  onPublishDateChange: (date: string) => void;
  onSlugChange: (slug: string) => void;
  onMetaDescriptionChange: (description: string) => void;
}

export function EditorSidebar({
  status,
  category,
  tags,
  thumbnailUrl,
  publishDate,
  slug,
  metaDescription,
  onStatusChange,
  onCategoryChange,
  onTagsChange,
  onThumbnailChange,
  onPublishDateChange,
  onSlugChange,
  onMetaDescriptionChange
}: EditorSidebarProps) {
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      const newTag = input.value.trim();
      if (newTag && !tags.includes(newTag)) {
        onTagsChange([...tags, newTag]);
        input.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      onThumbnailChange(fakeUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* 記事設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">記事設定</h3>

        {/* ステータス */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ステータス
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="DRAFT">下書き</option>
            <option value="PUBLISHED">公開</option>
            <option value="ARCHIVE">アーカイブ</option>
          </select>
        </div>

        {/* カテゴリー */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリー
          </label>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">カテゴリーを選択</option>
            <option value="テクノロジー">テクノロジー</option>
            <option value="ライフスタイル">ライフスタイル</option>
            <option value="ビジネス">ビジネス</option>
            <option value="旅行">旅行</option>
            <option value="料理">料理</option>
            <option value="フィットネス">フィットネス</option>
          </select>
        </div>

        {/* タグ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Tag className="w-4 h-4" />
            <span>タグ</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1.5 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            onKeyDown={handleTagInput}
            placeholder="タグを入力してEnter"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* サムネイル */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Image className="w-4 h-4" />
            <span>サムネイル画像</span>
          </label>
          {thumbnailUrl ? (
            <div className="relative group">
              <ImageWithFallback
                src={thumbnailUrl}
                alt="サムネイル"
                className="w-full h-32 object-cover rounded-lg"
              />
              <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <span className="text-white text-sm font-medium">変更</span>
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailUpload}
                className="hidden"
              />
              <Image className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">画像を選択</span>
            </label>
          )}
        </div>

        {/* 公開日時 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>公開日時</span>
          </label>
          <input
            type="datetime-local"
            value={publishDate}
            onChange={(e) => onPublishDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* URLスラッグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-1">
            <Link2 className="w-4 h-4" />
            <span>URLスラッグ</span>
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="url-slug"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          />
          <p className="mt-1 text-xs text-gray-500">
            /articles/{slug || 'url-slug'}
          </p>
        </div>
      </div>

      {/* SEO設定 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>SEO設定</span>
        </h3>

        {/* メタディスクリプション */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メタディスクリプション
          </label>
          <textarea
            value={metaDescription}
            onChange={(e) => onMetaDescriptionChange(e.target.value)}
            placeholder="検索結果に表示される説明文を入力..."
            rows={4}
            maxLength={160}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">
            {metaDescription.length}/160
          </p>
        </div>
      </div>
    </div>
  );
}
